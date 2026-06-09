import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Search, 
  Calendar as CalendarIcon, 
  Save,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Filter,
  UserPlus
} from "lucide-react";
import { format } from "date-fns";

const ZONES = ["Adonai", "Faith", "Wisdom", "Kindness", "Goodness", "Peace", "Bethel"];
const GROUPS = [
  "Teens (13-17)",
  "Youth (18-25)",
  "Young Adult/YAF (25-40)",
  "Women of Virtue/WOV (40-65)",
  "Men of Valor (40-65)",
  "Senior Citizens (65+)"
];
const ATTENDANCE_STATUSES = ["Present", "Not Present", "Absent", "First Time Visitor"];

const TakeAttendance = () => {
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [search, setSearch] = useState("");
  const [filterZone, setFilterZone] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (members.length > 0) {
      loadExistingAttendance();
    }
  }, [selectedDate, members]);

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${API}/members`);
      setMembers(response.data);
      const initialAttendance = {};
      response.data.forEach((member) => {
        initialAttendance[member.id] = { status: "Not Present", reason: "" };
      });
      setAttendance(initialAttendance);
    } catch (error) {
      toast.error("Failed to fetch members");
    } finally {
      setIsLoading(false);
    }
  };

  const loadExistingAttendance = async () => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    try {
      const response = await axios.get(`${API}/attendance?date=${dateStr}`);
      if (response.data.length > 0) {
        const existingAttendance = {};
        members.forEach((member) => {
          const record = response.data.find((r) => r.member_id === member.id);
          if (record) {
            existingAttendance[member.id] = { status: record.status, reason: record.reason || "" };
          } else {
            existingAttendance[member.id] = { status: "Not Present", reason: "" };
          }
        });
        setAttendance(existingAttendance);
        toast.info("Loaded existing attendance for this date");
      } else {
        const initialAttendance = {};
        members.forEach((member) => {
          initialAttendance[member.id] = { status: "Not Present", reason: "" };
        });
        setAttendance(initialAttendance);
      }
    } catch (error) {
      console.error("Failed to load existing attendance:", error);
    }
  };

  const updateAttendance = (memberId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        status,
        reason: status === "Absent" ? prev[memberId]?.reason || "" : ""
      }
    }));
  };

  const updateReason = (memberId, reason) => {
    setAttendance((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], reason }
    }));
  };

  const saveAttendance = async () => {
    setIsSaving(true);
    try {
      const records = Object.entries(attendance).map(([memberId, data]) => ({
        member_id: memberId,
        status: data.status,
        reason: data.reason || ""
      }));

      await axios.post(`${API}/attendance`, {
        date: format(selectedDate, "yyyy-MM-dd"),
        records
      });

      const clearedAttendance = {};
      Object.entries(attendance).forEach(([memberId, data]) => {
        clearedAttendance[memberId] = { status: data.status, reason: "" };
      });
      setAttendance(clearedAttendance);
      toast.success("Attendance saved successfully");
    } catch (error) {
      toast.error("Failed to save attendance");
    } finally {
      setIsSaving(false);
    }
  };

  const markAllPresent = () => {
    const updated = {};
    filteredMembers.forEach((member) => {
      updated[member.id] = { status: "Present", reason: "" };
    });
    setAttendance((prev) => ({ ...prev, ...updated }));
    toast.success("All visible members marked as Present");
  };

  const markAllNotPresent = () => {
    const updated = {};
    filteredMembers.forEach((member) => {
      updated[member.id] = { status: "Not Present", reason: "" };
    });
    setAttendance((prev) => ({ ...prev, ...updated }));
    toast.success("All visible members marked as Not Present");
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      !search ||
      `${member.first_name} ${member.surname}`.toLowerCase().includes(search.toLowerCase()) ||
      member.phone_number?.includes(search);
    const matchesZone = !filterZone || filterZone === "all" || member.zone === filterZone;
    const matchesGroup = !filterGroup || filterGroup === "all" || member.group === filterGroup;
    const matchesStatus =
      !filterStatus ||
      filterStatus === "all" ||
      attendance[member.id]?.status === filterStatus;
    return matchesSearch && matchesZone && matchesGroup && matchesStatus;
  });

  const stats = {
    present: Object.values(attendance).filter((a) => a.status === "Present").length,
    notPresent: Object.values(attendance).filter((a) => a.status === "Not Present").length,
    absent: Object.values(attendance).filter((a) => a.status === "Absent").length,
    firstTimeVisitor: Object.values(attendance).filter((a) => a.status === "First Time Visitor").length,
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Present": return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "Not Present": return <XCircle className="w-5 h-5 text-yellow-500" />;
      case "Absent": return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "First Time Visitor": return <UserPlus className="w-5 h-5 text-blue-500" />;
      default: return null;
    }
  };

  return (
    <div className="page-container animate-fadeIn" data-testid="attendance-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Take Attendance</h1>
          <p className="text-slate-500 mt-1">Record attendance for your members</p>
        </div>
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2" data-testid="attendance-date-picker">
                <CalendarIcon className="w-4 h-4" />
                {format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Stats Cards — now 4 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div
          className={`stats-card border-l-4 border-l-green-500 cursor-pointer transition-all ${filterStatus === "Present" ? "ring-2 ring-green-400" : ""}`}
          onClick={() => setFilterStatus(filterStatus === "Present" ? "" : "Present")}
          data-testid="stats-present"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="stats-value text-green-600">{stats.present}</div>
              <div className="stats-label">Present</div>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div
          className={`stats-card border-l-4 border-l-yellow-500 cursor-pointer transition-all ${filterStatus === "Not Present" ? "ring-2 ring-yellow-400" : ""}`}
          onClick={() => setFilterStatus(filterStatus === "Not Present" ? "" : "Not Present")}
          data-testid="stats-not-present"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="stats-value text-yellow-600">{stats.notPresent}</div>
              <div className="stats-label">Not Present</div>
            </div>
            <XCircle className="w-8 h-8 text-yellow-200" />
          </div>
        </div>

        <div
          className={`stats-card border-l-4 border-l-red-500 cursor-pointer transition-all ${filterStatus === "Absent" ? "ring-2 ring-red-400" : ""}`}
          onClick={() => setFilterStatus(filterStatus === "Absent" ? "" : "Absent")}
          data-testid="stats-absent"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="stats-value text-red-600">{stats.absent}</div>
              <div className="stats-label">Absent</div>
            </div>
            <AlertCircle className="w-8 h-8 text-red-200" />
          </div>
        </div>

        <div
          className={`stats-card border-l-4 border-l-blue-500 cursor-pointer transition-all ${filterStatus === "First Time Visitor" ? "ring-2 ring-blue-400" : ""}`}
          onClick={() => setFilterStatus(filterStatus === "First Time Visitor" ? "" : "First Time Visitor")}
          data-testid="stats-first-time-visitor"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="stats-value text-blue-600">{stats.firstTimeVisitor}</div>
              <div className="stats-label">First Time Visitors</div>
            </div>
            <UserPlus className="w-8 h-8 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card-style mb-6">
        <div className="flex flex-col md:flex-row gap-4 flex-wrap">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input type="text" placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" data-testid="attendance-search-input" />
          </div>

          <Select value={filterZone} onValueChange={setFilterZone}>
            <SelectTrigger className="w-full md:w-[160px]" data-testid="attendance-zone-filter">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Zones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              {ZONES.map((zone) => <SelectItem key={zone} value={zone}>{zone}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterGroup} onValueChange={setFilterGroup}>
            <SelectTrigger className="w-full md:w-[180px]" data-testid="attendance-group-filter">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {GROUPS.map((group) => <SelectItem key={group} value={group}>{group}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-[180px]" data-testid="attendance-status-filter">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {ATTENDANCE_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {filterStatus && filterStatus !== "all" && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-slate-500">
              Showing <strong>{filteredMembers.length}</strong> members marked as <strong>{filterStatus}</strong>
            </span>
            <button onClick={() => setFilterStatus("")} className="text-xs text-blue-500 underline">Clear</button>
          </div>
        )}
      </div>

      {/* Members List */}
      <div className="card-style mb-6">
        {isLoading ? (
          <div className="p-8 text-center"><div className="spinner w-8 h-8 mx-auto" /></div>
        ) : filteredMembers.length === 0 ? (
          <div className="empty-state">
            <Users className="empty-state-icon" />
            <h3 className="empty-state-title">No members found</h3>
            <p className="empty-state-description">
              {members.length === 0 ? "Add members first to take attendance" : "Try adjusting your search or filters"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredMembers.map((member, index) => (
              <div key={member.id} className="attendance-row flex-col sm:flex-row gap-4" data-testid={`attendance-row-${index}`}>
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium">
                    {member.first_name[0]}{member.surname[0]}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{member.first_name} {member.surname}</div>
                    <div className="text-sm text-slate-500">{member.zone} | {member.status}</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <RadioGroup
                    value={attendance[member.id]?.status || "Not Present"}
                    onValueChange={(value) => updateAttendance(member.id, value)}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Present" id={`present-${member.id}`} data-testid={`present-radio-${index}`} />
                      <Label htmlFor={`present-${member.id}`} className="text-sm font-medium text-green-600 cursor-pointer">Present</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="/* No */t Present" id={`not-present-${member.id}`} data-testid={`not-present-radio-${index}`} />
                      <Label htmlFor={`not-present-${member.id}`} className="text-sm font-medium text-yellow-600 cursor-pointer">Not Present</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Absent" id={`absent-${member.id}`} data-testid={`absent-radio-${index}`} />
                      <Label htmlFor={`absent-${member.id}`} className="text-sm font-medium text-red-600 cursor-pointer">Absent</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="First Time Visitor" id={`visitor-${member.id}`} data-testid={`visitor-radio-${index}`} />
                      <Label htmlFor={`visitor-${member.id}`} className="text-sm font-medium text-blue-600 cursor-pointer">First Time Visitor</Label>
                    </div>
                  </RadioGroup>
                  <div className="hidden sm:block">{getStatusIcon(attendance[member.id]?.status)}</div>
                </div>

                {attendance[member.id]?.status === "Absent" && (
                  <div className="w-full sm:w-64">
                    <Input
                      placeholder="Reason for absence"
                      value={attendance[member.id]?.reason || ""}
                      onChange={(e) => updateReason(member.id, e.target.value)}
                      className="text-sm"
                      data-testid={`reason-input-${index}`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      {members.length > 0 && (
        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={saveAttendance} disabled={isSaving} className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg px-8" data-testid="save-attendance-button">
            {isSaving ? (
              <><div className="spinner w-4 h-4 mr-2" />Saving...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />Save Attendance</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default TakeAttendance;