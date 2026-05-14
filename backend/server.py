from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.responses import RedirectResponse
import os
import certifi
import httpx

os.environ['SSL_CERT_FILE'] = certifi.where()
os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

import logging
import secrets
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import asyncio

# Google Imports
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2.credentials import Credentials

# ========================
# Setup
# ========================
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'churchadmin2024')
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '')
GOOGLE_SHEETS_ID = os.environ.get('GOOGLE_SHEETS_ID', '')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")
REDIRECT_URI = f"{BACKEND_URL}/api/oauth/sheets/callback"

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
]

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBasic()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Locks for sync deduplication
members_sync_lock = asyncio.Lock()
attendance_sync_lock = asyncio.Lock()

# ========================
# Models
# ========================
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    message: str

class MemberCreate(BaseModel):
    first_name: str
    surname: str
    gender: str
    status: str
    zone: str
    phone_number: str
    address: Optional[str] = ""

class MemberUpdate(BaseModel):
    first_name: Optional[str] = None
    surname: Optional[str] = None
    gender: Optional[str] = None
    status: Optional[str] = None
    zone: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None

class Member(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    surname: str
    gender: str
    status: str
    zone: str
    phone_number: str
    address: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AttendanceRecord(BaseModel):
    member_id: str
    status: str
    reason: Optional[str] = ""

class AttendanceCreate(BaseModel):
    date: str
    records: List[AttendanceRecord]

class Attendance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    member_id: str
    date: str
    status: str
    reason: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ========================
# Helper & Sync Functions
# ========================
async def get_sheets_credentials():
    token = await db.google_tokens.find_one({}, {"_id": 0})
    if not token:
        return None
    
    creds = Credentials(
        token=token["access_token"],
        refresh_token=token.get("refresh_token"),
        token_uri=token["token_uri"],
        client_id=token["client_id"],
        client_secret=token["client_secret"]
    )

    if token.get("expires_at"):
        expires = datetime.fromisoformat(token["expires_at"])
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) >= expires:
            try:
                creds.refresh(GoogleRequest())
                await db.google_tokens.update_one({}, {"$set": {
                    "access_token": creds.token,
                    "expires_at": creds.expiry.isoformat() if creds.expiry else None
                }})
            except Exception as e:
                logger.error(f"Token refresh failed: {e}")
                return None
    return creds

async def sync_members_to_sheets_internal(creds):
    members = await db.members.find({}, {"_id": 0}).to_list(10000)
    headers = ["Member ID", "First Name", "Surname", "Gender", "Status", "Zone", "Phone Number", "Address"]
    values = [headers]
    for m in members:
        values.append([m.get('id', ''), m.get('first_name', ''), m.get('surname', ''),
                       m.get('gender', ''), m.get('status', ''), m.get('zone', ''),
                       m.get('phone_number', ''), m.get('address', '')])

    def write():
        service = build('sheets', 'v4', credentials=creds)
        service.spreadsheets().values().clear(spreadsheetId=GOOGLE_SHEETS_ID, range="Members!A:Z").execute()
        service.spreadsheets().values().update(
            spreadsheetId=GOOGLE_SHEETS_ID, range="Members!A1", valueInputOption="RAW", body={"values": values}
        ).execute()
    await asyncio.to_thread(write)

async def sync_attendance_to_sheets_internal(creds):
    records = await db.attendance.find({}, {"_id": 0}).to_list(100000)
    all_members = await db.members.find({}, {"_id": 0}).to_list(10000)
    member_map = {m['id']: m for m in all_members}

    headers = ["First Name", "Surname", "Date", "Status", "Reason"]
    values = [headers]
    for r in records:
        member = member_map.get(r.get('member_id', ''), {})
        values.append([
            member.get('first_name', ''), member.get('surname', ''),
            r.get('date', ''), r.get('status', ''), r.get('reason', '')
        ])

    def write():
        service = build('sheets', 'v4', credentials=creds)
        service.spreadsheets().values().clear(spreadsheetId=GOOGLE_SHEETS_ID, range="Attendance!A:Z").execute()
        service.spreadsheets().values().update(
            spreadsheetId=GOOGLE_SHEETS_ID, range="Attendance!A1", valueInputOption="RAW", body={"values": values}
        ).execute()
    await asyncio.to_thread(write)

# Background Syncs
async def background_sync_members():
    if members_sync_lock.locked():
        return
    async with members_sync_lock:
        try:
            await asyncio.sleep(2)
            creds = await get_sheets_credentials()
            if creds and GOOGLE_SHEETS_ID:
                await sync_members_to_sheets_internal(creds)
                logger.info("✅ Background members sync completed")
        except Exception as e:
            logger.error(f"Background members sync failed: {e}")

async def background_sync_attendance():
    if attendance_sync_lock.locked():
        return
    async with attendance_sync_lock:
        try:
            await asyncio.sleep(2)
            creds = await get_sheets_credentials()
            if creds and GOOGLE_SHEETS_ID:
                await sync_attendance_to_sheets_internal(creds)
                logger.info("✅ Background attendance sync completed")
        except Exception as e:
            logger.error(f"Background attendance sync failed: {e}")

# ========================
# Auth
# ========================
def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    if not (secrets.compare_digest(credentials.username, ADMIN_USERNAME) and 
            secrets.compare_digest(credentials.password, ADMIN_PASSWORD)):
        raise HTTPException(status_code=401, detail="Invalid credentials", headers={"WWW-Authenticate": "Basic"})
    return credentials.username

# ========================
# Endpoints
# ========================
@api_router.post("/members", response_model=Member)
async def create_member(member_data: MemberCreate):
    member = Member(**member_data.model_dump())
    doc = member.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.members.insert_one(doc)
    asyncio.create_task(background_sync_members())
    return member

@api_router.put("/members/{member_id}", response_model=Member)
async def update_member(member_id: str, member_data: MemberUpdate):
    update_dict = {k: v for k, v in member_data.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.members.update_one({"id": member_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    member = await db.members.find_one({"id": member_id}, {"_id": 0})
    asyncio.create_task(background_sync_members())
    return member

@api_router.delete("/members/{member_id}")
async def delete_member(member_id: str):
    result = await db.members.delete_one({"id": member_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    await db.attendance.delete_many({"member_id": member_id})
    asyncio.create_task(background_sync_members())
    return {"message": "Member deleted successfully"}

@api_router.post("/attendance")
async def save_attendance(attendance_data: AttendanceCreate):
    for record in attendance_data.records:
        await db.attendance.delete_one({"date": attendance_data.date, "member_id": record.member_id})

    records = []
    for record in attendance_data.records:
        attendance = Attendance(
            member_id=record.member_id,
            date=attendance_data.date,
            status=record.status,
            reason=record.reason or ""
        )
        doc = attendance.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        records.append(doc)

    if records:
        await db.attendance.insert_many(records)

    asyncio.create_task(background_sync_attendance())
    return {"message": f"Attendance saved for {len(records)} members", "date": attendance_data.date}

# Google OAuth
@api_router.get("/oauth/sheets/login")
async def sheets_login():
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=400, detail="Google OAuth not configured")

    flow = Flow.from_client_config({
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token"
        }
    }, scopes=SCOPES, redirect_uri=REDIRECT_URI)

    flow.code_challenge_method = None
    url, state = flow.authorization_url(access_type='offline', prompt='consent')

    await db.oauth_states.delete_many({})
    await db.oauth_states.insert_one({"state": state, "created_at": datetime.now(timezone.utc).isoformat()})

    return {"auth_url": url}


@api_router.get("/oauth/sheets/callback")
async def sheets_callback(code: str, state: str):
    stored_state = await db.oauth_states.find_one({"state": state})
    if not stored_state:
        raise HTTPException(status_code=400, detail="Invalid or expired state")

    await db.oauth_states.delete_one({"state": state})

    flow = Flow.from_client_config({
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token"
        }
    }, scopes=SCOPES, redirect_uri=REDIRECT_URI)

    flow.code_challenge_method = None

    try:
        flow.fetch_token(code=code)
        creds = flow.credentials

        await db.google_tokens.delete_many({})
        await db.google_tokens.insert_one({
            "access_token": creds.token,
            "refresh_token": creds.refresh_token,
            "expires_at": creds.expiry.isoformat() if creds.expiry else None,
            "token_uri": creds.token_uri,
            "client_id": creds.client_id,
            "client_secret": creds.client_secret,
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        logger.info("✅ Google Sheets connected successfully")
        return RedirectResponse(f"{FRONTEND_URL}/settings?sheets_connected=true")

    except Exception as e:
        logger.error(f"Token exchange failed: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to connect Google Sheets: {str(e)}")


@api_router.post("/oauth/sheets/disconnect")
async def disconnect_sheets():
    await db.google_tokens.delete_many({})
    return {"message": "Google Sheets disconnected"}

# Manual Sync
@api_router.post("/sheets/sync/members")
async def sync_members_to_sheets():
    creds = await get_sheets_credentials()
    if not creds:
        raise HTTPException(status_code=400, detail="Google Sheets not connected")
    await sync_members_to_sheets_internal(creds)
    return {"message": "Members synced successfully"}

# Add other missing endpoints (get_members, get_attendance, stats, etc.) as needed

@api_router.get("/")
async def root():
    return {"message": "Revival Baptist Church API", "status": "running"}

# ========================
# App Setup
# ========================
app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()