import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Calendar as CalendarIcon, 
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  ChevronRight
} from "lucide-react";
import { format, parseISO } from "date-fns";

const AttendanceHistory = () => {
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [members, setMembers] = useState({});
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  
  // Member history modal
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberHistory, setMemberHistory] = useState([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    fetchDates();
    fetchMembers();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchAttendanceByDate(selectedDate);
    }
  }, [selectedDate]);

  const fetchDates = async () => {
    try {
      const response = await axios.get(`${API}/attendance/dates`);
      setDates(response.data);
      if (response.data.length > 0) {
        setSelectedDate(response.data[0]);
      }
    } catch (error) {
      toast.error("Failed to fetch attendance dates");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${API}/members`);
      const membersMap = {};
      response.data.forEach((member) => {
        membersMap[member.id] = member;
      });
      setMembers(membersMap);
    } catch (error) {
      console.error("Failed to fetch members:", error);
    }
  };

  const fetchAttendanceByDate = async (date) => {
    setIsLoadingAttendance(true);
    try {
      const [attendanceRes, summaryRes] = await Promise.all([
        axios.get(`${API}/attendance?date=${date}`),
        axios.get(`${API}/attendance/summary?date=${date}`)
      ]);
      setAttendance(attendanceRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      toast.error("Failed to fetch attendance");
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  const fetchMemberHistory = async (memberId) => {
    try {
      const response = await axios.get(`${API}/attendance/member/${memberId}`);
      setMemberHistory(response.data);
    } catch (error) {
      toast.error("Failed to fetch member history");
    }
  };

  const openMemberHistory = async (memberId) => {
    setSelectedMember(members[memberId]);
    await fetchMemberHistory(memberId);
    setIsHistoryModalOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Present":
        return (
          <span className="status-badge status-present">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Present
          </span>
        );
      case "Not Present":
        return (
          <span className="status-badge status-not-present">
            <XCircle className="w-3 h-3 mr-1" />
            Not Present
          </span>
        );
      case "Absent":
        return (
          <span className="status-badge status-absent">
            <AlertCircle className="w-3 h-3 mr-1" />
            Absent
          </span>
        );
      default:
        return null;
    }
  };

  const formatDisplayDate = (dateStr) => {
    try {
      return format(parseISO(dateStr), "EEEE, MMMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="page-container animate-fadeIn" data-testid="history-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Attendance History</h1>
          <p className="text-slate-500 mt-1">View past attendance records</p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center">
          <div className="spinner w-8 h-8 mx-auto" />
        </div>
      ) : dates.length === 0 ? (
        <div className="card-style">
          <div className="empty-state">
            <History className="empty-state-icon" />
            <h3 className="empty-state-title">No attendance records</h3>
            <p className="empty-state-description">
              Take attendance to see history here
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Date Selection */}
          <div className="card-style mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-600">Select Date:</span>
              </div>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="w-full sm:w-[300px]" data-testid="history-date-select">
                  <SelectValue placeholder="Select a date" />
                </SelectTrigger>
                <SelectContent>
                  {dates.map((date) => (
                    <SelectItem key={date} value={date}>
                      {formatDisplayDate(date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="stats-card" data-testid="summary-total">
                <div className="stats-value text-slate-800">{summary.total}</div>
                <div className="stats-label">Total Recorded</div>
              </div>
              <div className="stats-card border-l-4 border-l-green-500" data-testid="summary-present">
                <div className="stats-value text-green-600">{summary.present}</div>
                <div className="stats-label">Present</div>
              </div>
              <div className="stats-card border-l-4 border-l-yellow-500" data-testid="summary-not-present">
                <div className="stats-value text-yellow-600">{summary.not_present}</div>
                <div className="stats-label">Not Present</div>
              </div>
              <div className="stats-card border-l-4 border-l-red-500" data-testid="summary-absent">
                <div className="stats-value text-red-600">{summary.absent}</div>
                <div className="stats-label">Absent</div>
              </div>
            </div>
          )}

          {/* Attendance Table */}
          <div className="table-container">
            {isLoadingAttendance ? (
              <div className="p-8 text-center">
                <div className="spinner w-8 h-8 mx-auto" />
              </div>
            ) : attendance.length === 0 ? (
              <div className="empty-state">
                <History className="empty-state-icon" />
                <h3 className="empty-state-title">No records for this date</h3>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Reason</TableHead>
                    <TableHead className="text-right">History</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((record, index) => {
                    const member = members[record.member_id];
                    return (
                      <TableRow 
                        key={record.id} 
                        className="table-row-hover"
                        data-testid={`history-row-${index}`}
                      >
                        <TableCell className="font-medium">
                          {member ? (
                            <div>
                              {member.first_name} {member.surname}
                              <div className="text-xs text-slate-400 sm:hidden">
                                {member.zone}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">Unknown Member</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="zone-badge">{member?.zone || "-"}</span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(record.status)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-slate-500">
                          {record.reason || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <button
                            onClick={() => openMemberHistory(record.member_id)}
                            className="action-btn text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                            data-testid={`view-history-${index}`}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </>
      )}

      {/* Member History Modal */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="max-w-lg" data-testid="member-history-modal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {selectedMember?.first_name} {selectedMember?.surname}'s History
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {memberHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No attendance history found
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {memberHistory.map((record, index) => (
                  <div 
                    key={record.id} 
                    className="py-3 flex items-center justify-between"
                    data-testid={`member-history-row-${index}`}
                  >
                    <div>
                      <div className="font-medium text-slate-900">
                        {formatDisplayDate(record.date)}
                      </div>
                      {record.reason && (
                        <div className="text-sm text-slate-500 mt-1">
                          Reason: {record.reason}
                        </div>
                      )}
                    </div>
                    <div>{getStatusBadge(record.status)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendanceHistory;
