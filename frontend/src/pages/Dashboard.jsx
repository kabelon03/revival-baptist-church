import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { 
  Users, 
  UserPlus, 
  ClipboardCheck, 
  History, 
  TrendingUp,
  ChevronRight
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const actionCards = [
    {
      title: "Add Member",
      description: "Register a new church member",
      icon: UserPlus,
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
      path: "/members?action=add",
      testId: "dashboard-add-member-card"
    },
    {
      title: "View Members",
      description: "Browse and manage all members",
      icon: Users,
      color: "bg-emerald-500",
      lightColor: "bg-emerald-50",
      textColor: "text-emerald-600",
      path: "/members",
      testId: "dashboard-view-members-card"
    },
    {
      title: "Take Attendance",
      description: "Record today's attendance",
      icon: ClipboardCheck,
      color: "bg-violet-500",
      lightColor: "bg-violet-50",
      textColor: "text-violet-600",
      path: "/attendance",
      testId: "dashboard-take-attendance-card"
    }
  ];

  return (
    <div className="page-container animate-fadeIn" data-testid="dashboard-page">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
          Dashboard
        </h1>
        <p className="text-slate-500">
          Welcome to the Church Attendance Management System
        </p>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stats-card animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-16 mx-auto mb-2" />
              <div className="h-4 bg-slate-100 rounded w-24 mx-auto" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="stats-card" data-testid="stats-total-members">
            <div className="stats-value text-blue-600">
              {stats?.total_members || 0}
            </div>
            <div className="stats-label">Total Members</div>
          </div>
          <div className="stats-card" data-testid="stats-active-members">
            <div className="stats-value text-emerald-600">
              {stats?.members_by_status?.Member || 0}
            </div>
            <div className="stats-label">Active Members</div>
          </div>
          <div className="stats-card" data-testid="stats-visitors">
            <div className="stats-value text-violet-600">
              {stats?.members_by_status?.Visitor || 0}
            </div>
            <div className="stats-label">Visitors</div>
          </div>
          <div className="stats-card" data-testid="stats-today-present">
            <div className="stats-value text-amber-600">
              {stats?.today_attendance?.present || 0}
            </div>
            <div className="stats-label">Present Today</div>
          </div>
        </div>
      )}

      {/* Action Cards */}
      <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {actionCards.map((card) => (
          <div
            key={card.title}
            onClick={() => navigate(card.path)}
            className="dashboard-card group"
            data-testid={card.testId}
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-lg ${card.lightColor}`}>
                <card.icon className={`w-6 h-6 ${card.textColor}`} />
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mt-4">
              {card.title}
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              {card.description}
            </p>
          </div>
        ))}
      </div>

      {/* Zone Distribution */}
      {stats?.members_by_zone && Object.keys(stats.members_by_zone).length > 0 && (
        <div className="card-style">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Members by Zone
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {Object.entries(stats.members_by_zone).map(([zone, count]) => (
              <div 
                key={zone} 
                className="bg-slate-50 rounded-lg p-3 text-center"
                data-testid={`zone-stat-${zone.toLowerCase()}`}
              >
                <div className="text-xl font-bold text-slate-800">{count}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">{zone}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={() => navigate("/history")}
          className="btn-secondary flex items-center gap-2"
          data-testid="dashboard-history-link"
        >
          <History className="w-4 h-4" />
          View Attendance History
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
