import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Users,
  X,
  AlertCircle
} from "lucide-react";

const ZONES = ["Adonai", "Faith", "Wisdom", "Kindness", "Goodness", "Peace", "Bethel"];
const STATUSES = ["BB RBC Member", "Jukulyn RBC Member", "Non-member", "First Time Visitor"];
const GENDERS = ["Male", "Female"];
const GROUPS = [
  "Teens (13-17)",
  "Youth (18-25)",
  "Young Adult/YAF (25-40)",
  "Women of Virtue/WOV (40-65)",
  "Men of Valor (40-65)",
  "Senior Citizens (65+)"
];

const ZONE_MAP = {
  "block bb": "Adonai", "block dd": "Adonai",
  "block aa": "Kindness", "block l": "Kindness", "block h": "Kindness",
  "block f": "Kindness", "block k": "Kindness", "block g": "Kindness",
  "block lkk": "Kindness", "block m": "Kindness", "block cc": "Kindness",
  "block vv": "Wisdom", "block uu": "Wisdom", "block ww": "Wisdom", "block xx": "Wisdom",
  "ext 1": "Wisdom", "ext 2": "Wisdom", "ext 3": "Wisdom", "ext 4": "Wisdom",
  "ext 5": "Wisdom", "ext 6": "Wisdom", "ext 7": "Wisdom", "ext 8": "Wisdom",
  "ext 9": "Wisdom", "ext 10": "Wisdom", "ext 11": "Wisdom", "ext 12": "Wisdom",
  "ext 13": "Wisdom", "ext 14": "Wisdom",
  "block gg": "Goodness", "block ff": "Goodness", "block ia": "Goodness",
  "block jj": "Goodness", "block hh": "Goodness", "block ll": "Goodness", "skuurlik": "Goodness",
  "mabopane": "Peace", "klipgat": "Peace", "garankua": "Peace", "wintervelt": "Peace",
  "wonderpark": "Bethel", "rosslyn": "Bethel", "pretoria-wes": "Bethel",
  "pretoria wes": "Bethel", "pretoria-noord": "Bethel", "pretoria noord": "Bethel",
  "block ss": "Faith", "block kk": "Faith", "block mm": "Faith", "block p": "Faith",
  "block y": "Faith", "block r": "Faith", "block x": "Faith", "block s": "Faith",
  "block w": "Faith", "block t": "Faith", "block v": "Faith", "block f4": "Faith",
  "dally mpofu": "Faith",
};

const detectZoneFromAddress = (address) => {
  if (!address) return null;
  const lower = address.toLowerCase().trim();
  const sortedEntries = Object.entries(ZONE_MAP).sort(([a], [b]) => b.length - a.length);
  for (const [keyword, zone] of sortedEntries) {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lower)) return zone;
  }
  return null;
};

const Members = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterZone, setFilterZone] = useState(searchParams.get("zone") || "");
  const [filterGroup, setFilterGroup] = useState(searchParams.get("group") || "");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterGender, setFilterGender] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "", surname: "", gender: "", status: "",
    zone: "", phone_number: "", address: "", group: ""
  });

  useEffect(() => {
    // Read zone and group from URL params
    const zoneParam = searchParams.get("zone");
    const groupParam = searchParams.get("group");
    if (zoneParam) setFilterZone(zoneParam);
    if (groupParam) setFilterGroup(groupParam);

    if (searchParams.get("action") === "add") {
      setIsAddModalOpen(true);
      searchParams.delete("action");
      setSearchParams(searchParams);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => { fetchMembers(); }, 300);
    return () => clearTimeout(debounce);
  }, [search, filterZone, filterGroup, filterStatus, filterGender]);

  const fetchMembers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterZone && filterZone !== "all") params.append("zone", filterZone);
      if (filterGroup && filterGroup !== "all") params.append("group", filterGroup);
      if (filterStatus && filterStatus !== "all") params.append("status", filterStatus);
      if (filterGender && filterGender !== "all") params.append("gender", filterGender);
      const response = await axios.get(`${API}/members?${params.toString()}`);
      setMembers(response.data);
    } catch (error) {
      toast.error("Failed to fetch members");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ first_name: "", surname: "", gender: "", status: "", zone: "", phone_number: "", address: "", group: "" });
  };

  const handleAddMember = async () => {
    if (!formData.first_name || !formData.surname || !formData.gender || !formData.status || !formData.zone) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (formData.phone_number && formData.phone_number.length !== 10) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }
    setIsSaving(true);
    try {
      await axios.post(`${API}/members`, formData);
      toast.success("Member added successfully");
      setIsAddModalOpen(false);
      resetForm();
      fetchMembers();
    } catch (error) {
      toast.error("Already a member");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditMember = async () => {
    if (!formData.first_name || !formData.surname) {
      toast.error("Please fill in required fields");
      return;
    }
    if (formData.phone_number && formData.phone_number.length !== 10) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }
    setIsSaving(true);
    try {
      await axios.put(`${API}/members/${selectedMember.id}`, formData);
      toast.success("Member updated successfully");
      setIsEditModalOpen(false);
      setSelectedMember(null);
      resetForm();
      fetchMembers();
    } catch (error) {
      toast.error("Failed to update member");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMember = async () => {
    try {
      await axios.delete(`${API}/members/${selectedMember.id}`);
      toast.success("Member deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (error) {
      toast.error("Failed to delete member");
    }
  };

  const openEditModal = (member) => {
    setSelectedMember(member);
    setFormData({
      first_name: member.first_name, surname: member.surname,
      gender: member.gender, status: member.status, zone: member.zone,
      phone_number: member.phone_number, address: member.address || "", group: member.group || ""
    });
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (member) => { setSelectedMember(member); setIsDeleteDialogOpen(true); };

  const clearFilters = () => {
    setSearch(""); setFilterZone(""); setFilterGroup(""); setFilterStatus(""); setFilterGender("");
    setSearchParams({});
  };

  const hasFilters = search || filterZone || filterGroup || filterStatus || filterGender;

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "BB RBC Member": return "member-status-bb-rbc-member";
      case "Jukulyn RBC Member": return "member-status-jukulyn-rbc-member";
      case "Non-member": return "member-status-non-member";
      case "First Time Visitor": return "member-status-visitor";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="page-container animate-fadeIn" data-testid="members-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Members</h1>
          {/* Show active filter label */}
          {filterZone && filterZone !== "all" && (
            <p className="text-blue-600 text-sm mt-1 font-medium">📍 Filtered by Zone: {filterZone}</p>
          )}
          {filterGroup && filterGroup !== "all" && (
            <p className="text-violet-600 text-sm mt-1 font-medium">👥 Filtered by Group: {filterGroup}</p>
          )}
          {!filterZone && !filterGroup && (
            <p className="text-slate-500 mt-1">Manage church members</p>
          )}
        </div>
        <Button onClick={() => { resetForm(); setIsAddModalOpen(true); }} className="bg-blue-500 hover:bg-blue-600 text-white" data-testid="add-member-button">
          <Plus className="w-4 h-4 mr-2" />Add Member
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="card-style mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input type="text" placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" data-testid="member-search-input" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Select value={filterZone} onValueChange={setFilterZone}>
              <SelectTrigger className="w-[140px]" data-testid="filter-zone-select">
                <SelectValue placeholder="All Zones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                {ZONES.map((zone) => <SelectItem key={zone} value={zone}>{zone}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger className="w-[160px]" data-testid="filter-group-select">
                <SelectValue placeholder="All Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {GROUPS.map((group) => <SelectItem key={group} value={group}>{group}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]" data-testid="filter-status-select">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterGender} onValueChange={setFilterGender}>
              <SelectTrigger className="w-[120px]" data-testid="filter-gender-select">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                {GENDERS.map((gender) => <SelectItem key={gender} value={gender}>{gender}</SelectItem>)}
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="text-slate-500" data-testid="clear-filters-button">
                <X className="w-4 h-4 mr-1" />Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="table-container">
        {isLoading ? (
          <div className="p-8 text-center"><div className="spinner w-8 h-8 mx-auto" /></div>
        ) : members.length === 0 ? (
          <div className="empty-state">
            <Users className="empty-state-icon" />
            <h3 className="empty-state-title">No members found</h3>
            <p className="empty-state-description">{hasFilters ? "Try adjusting your filters" : "Add your first member to get started"}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Gender</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Zone</TableHead>
                <TableHead className="hidden md:table-cell">Group</TableHead>
                <TableHead className="hidden lg:table-cell">Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member, index) => (
                <TableRow key={member.id} className="table-row-hover" data-testid={`member-row-${index}`}>
                  <TableCell className="font-medium">
                    <div>
                      {member.first_name} {member.surname}
                      <div className="text-xs text-slate-400 sm:hidden">{member.gender} | {member.zone}</div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{member.gender}</TableCell>
                  <TableCell>
                    <span className={`status-badge ${getStatusBadgeClass(member.status)}`}>{member.status}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="zone-badge">{member.zone}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-slate-600">{member.group || "—"}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{member.phone_number}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEditModal(member)} className="action-btn" data-testid={`edit-member-${index}`}>
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => openDeleteDialog(member)} className="action-btn text-red-500 hover:text-red-700 hover:bg-red-50" data-testid={`delete-member-${index}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {!isLoading && members.length > 0 && (
        <p className="text-sm text-slate-500 mt-4">Showing {members.length} member{members.length !== 1 ? "s" : ""}</p>
      )}

      {/* Add Member Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg" data-testid="add-member-modal">
          <DialogHeader><DialogTitle>Add New Member</DialogTitle></DialogHeader>
          <MemberForm formData={formData} setFormData={setFormData} prefix="add" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMember} disabled={isSaving} className="bg-blue-500 hover:bg-blue-600">
              {isSaving ? "Saving..." : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg" data-testid="edit-member-modal">
          <DialogHeader><DialogTitle>Edit Member</DialogTitle></DialogHeader>
          <MemberForm formData={formData} setFormData={setFormData} prefix="edit" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleEditMember} disabled={isSaving} className="bg-blue-500 hover:bg-blue-600">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedMember?.first_name} {selectedMember?.surname}?
              This action cannot be undone and will also delete all attendance records for this member.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMember} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const MemberForm = ({ formData, setFormData, prefix }) => {
  const [zoneSuggestion, setZoneSuggestion] = useState(null);

  const handleAddressChange = (e) => {
    const address = e.target.value;
    const detectedZone = detectZoneFromAddress(address);
    setFormData({ ...formData, address });
    setZoneSuggestion(detectedZone || null);
  };

  const applyZoneSuggestion = () => {
    setFormData({ ...formData, zone: zoneSuggestion });
    setZoneSuggestion(null);
  };

  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-first-name`} className="label-style">First Name *</Label>
          <Input id={`${prefix}-first-name`} value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} placeholder="Enter first name" autoComplete="off" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-surname`} className="label-style">Surname *</Label>
          <Input id={`${prefix}-surname`} value={formData.surname} onChange={(e) => setFormData({ ...formData, surname: e.target.value })} placeholder="Enter surname" autoComplete="off" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="label-style">Gender *</Label>
          <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
            <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
            <SelectContent>{GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="label-style">Status *</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="label-style">Group</Label>
        <Select value={formData.group} onValueChange={(value) => setFormData({ ...formData, group: value })}>
          <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
          <SelectContent>{GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}-address`} className="label-style">Address</Label>
        <Input id={`${prefix}-address`} value={formData.address} onChange={handleAddressChange} placeholder="e.g. Block BB, Soshanguve" autoComplete="off" />
        {zoneSuggestion && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
            <span className="text-sm text-blue-700">📍 Suggested Zone: <strong>{zoneSuggestion}</strong></span>
            <Button type="button" size="sm" onClick={applyZoneSuggestion} className="bg-blue-500 hover:bg-blue-600 text-white text-xs h-7">Apply</Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="label-style">Zone *</Label>
        <Select value={formData.zone} onValueChange={(value) => setFormData({ ...formData, zone: value })}>
          <SelectTrigger><SelectValue placeholder="Select zone" /></SelectTrigger>
          <SelectContent>{ZONES.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${prefix}-phone`} className="label-style">Phone Number</Label>
        <Input
          id={`${prefix}-phone`}
          type="tel"
          value={formData.phone_number}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9]/g, '');
            if (value.length <= 10) setFormData({ ...formData, phone_number: value });
          }}
          placeholder="Enter 10 digit phone number"
          autoComplete="off"
          maxLength={10}
          className={`transition-all ${formData.phone_number.length > 0 && formData.phone_number.length !== 10 ? "border-red-500 ring-1 ring-red-500" : ""}`}
        />
        {formData.phone_number.length > 0 && formData.phone_number.length !== 10 && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />Phone number must be exactly 10 digits
          </p>
        )}
      </div>
    </div>
  );
};

export default Members;
