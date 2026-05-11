import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
  Settings as SettingsIcon,
  Link,
  Unlink,
  RefreshCw,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Cloud,
  AlertTriangle,
  ExternalLink
} from "lucide-react";

const Settings = () => {
  const [searchParams] = useSearchParams();
  const [sheetsStatus, setSheetsStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchSheetsStatus();
    
    // Check for successful connection from OAuth callback
    if (searchParams.get("sheets_connected") === "true") {
      toast.success("Google Sheets connected successfully!");
    }
  }, [searchParams]);

  const fetchSheetsStatus = async () => {
    try {
      const response = await axios.get(`${API}/oauth/sheets/status`);
      setSheetsStatus(response.data);
    } catch (error) {
      console.error("Failed to fetch sheets status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectGoogleSheets = async () => {
    try {
      const response = await axios.get(`${API}/oauth/sheets/login`);
      // Redirect to Google OAuth
      window.location.href = response.data.auth_url;
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to initiate connection");
    }
  };

  const disconnectGoogleSheets = async () => {
    try {
      await axios.post(`${API}/oauth/sheets/disconnect`);
      toast.success("Google Sheets disconnected");
      fetchSheetsStatus();
    } catch (error) {
      toast.error("Failed to disconnect");
    }
  };

  const syncMembers = async () => {
    setIsSyncing(true);
    try {
      const response = await axios.post(`${API}/sheets/sync/members`);
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to sync members");
    } finally {
      setIsSyncing(false);
    }
  };

  const syncAttendance = async () => {
    setIsSyncing(true);
    try {
      const response = await axios.post(`${API}/sheets/sync/attendance`);
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to sync attendance");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="page-container animate-fadeIn" data-testid="settings-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-blue-500" />
          Settings
        </h1>
        <p className="text-slate-500 mt-1">Configure Google Sheets integration</p>
      </div>

      {/* Google Sheets Integration Card */}
      <div className="card-style mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-50 rounded-lg">
            <FileSpreadsheet className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900">Google Sheets Integration</h2>
            <p className="text-slate-500 text-sm mt-1">
              Connect to Google Sheets to sync your member and attendance data
            </p>

            {isLoading ? (
              <div className="mt-4">
                <div className="spinner w-6 h-6" />
              </div>
            ) : (
              <>
                {/* Status */}
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Configuration:</span>
                    {sheetsStatus?.configured ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        Configured
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 text-sm">
                        <XCircle className="w-4 h-4" />
                        Not Configured
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Connection:</span>
                    {sheetsStatus?.connected ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-yellow-600 text-sm">
                        <XCircle className="w-4 h-4" />
                        Not Connected
                      </span>
                    )}
                  </div>
                </div>

                {/* Setup Instructions */}
                {!sheetsStatus?.configured && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-amber-800">Setup Required</h3>
                        <p className="text-sm text-amber-700 mt-1">
                          To use Google Sheets integration, you need to set up Google OAuth credentials. 
                          Follow these steps:
                        </p>
                        <ol className="mt-3 space-y-2 text-sm text-amber-700">
                          <li className="flex gap-2">
                            <span className="font-bold">1.</span>
                            Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                              Google Cloud Console <ExternalLink className="w-3 h-3" />
                            </a>
                          </li>
                          <li className="flex gap-2">
                            <span className="font-bold">2.</span>
                            Create a new project or select an existing one
                          </li>
                          <li className="flex gap-2">
                            <span className="font-bold">3.</span>
                            Go to "APIs & Services" → "Library" and enable "Google Sheets API"
                          </li>
                          <li className="flex gap-2">
                            <span className="font-bold">4.</span>
                            Go to "APIs & Services" → "OAuth consent screen" and configure it
                          </li>
                          <li className="flex gap-2">
                            <span className="font-bold">5.</span>
                            Go to "APIs & Services" → "Credentials" and create OAuth 2.0 credentials
                          </li>
                          <li className="flex gap-2">
                            <span className="font-bold">6.</span>
                            Add these environment variables to your backend:
                            <ul className="ml-4 mt-1 space-y-1 font-mono text-xs bg-amber-100 p-2 rounded">
                              <li>GOOGLE_CLIENT_ID=your_client_id</li>
                              <li>GOOGLE_CLIENT_SECRET=your_client_secret</li>
                              <li>GOOGLE_SHEETS_ID=your_spreadsheet_id</li>
                            </ul>
                          </li>
                          <li className="flex gap-2">
                            <span className="font-bold">7.</span>
                            Create a Google Sheet with two tabs named "Members" and "Attendance"
                          </li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}

                {/* Connection Actions */}
                {sheetsStatus?.configured && (
                  <div className="mt-4">
                    {sheetsStatus?.connected ? (
                      <Button
                        variant="outline"
                        onClick={disconnectGoogleSheets}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        data-testid="disconnect-sheets-button"
                      >
                        <Unlink className="w-4 h-4 mr-2" />
                        Disconnect Google Sheets
                      </Button>
                    ) : (
                      <Button
                        onClick={connectGoogleSheets}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                        data-testid="connect-sheets-button"
                      >
                        <Link className="w-4 h-4 mr-2" />
                        Connect Google Sheets
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sync Actions */}
      {sheetsStatus?.connected && (
        <div className="card-style">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Cloud className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-900">Sync Data</h2>
              <p className="text-slate-500 text-sm mt-1">
                Sync your local data to Google Sheets
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  onClick={syncMembers}
                  disabled={isSyncing}
                  variant="outline"
                  data-testid="sync-members-button"
                >
                  {isSyncing ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Sync Members
                </Button>
                <Button
                  onClick={syncAttendance}
                  disabled={isSyncing}
                  variant="outline"
                  data-testid="sync-attendance-button"
                >
                  {isSyncing ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Sync Attendance
                </Button>
              </div>

              {sheetsStatus?.sheet_id && (
                <p className="mt-4 text-sm text-slate-500">
                  Sheet ID: <code className="bg-slate-100 px-2 py-1 rounded text-xs">{sheetsStatus.sheet_id}</code>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
