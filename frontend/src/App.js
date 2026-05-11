import { useState, useEffect, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";

// Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Members from "@/pages/Members";
import TakeAttendance from "@/pages/TakeAttendance";
import AttendanceHistory from "@/pages/AttendanceHistory";
import Settings from "@/pages/Settings";

// Components
import Header from "@/components/Header";

console.log("API:", process.env.REACT_APP_API_URL);

export const API = process.env.REACT_APP_API_URL;

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [credentials, setCredentials] = useState(null);

  useEffect(() => {
    const storedAuth = localStorage.getItem("churchAuth");
    if (storedAuth) {
      const parsed = JSON.parse(storedAuth);
      setCredentials(parsed);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { username, password });
      if (response.data.success) {
        const creds = { username, password };
        setCredentials(creds);
        setIsAuthenticated(true);
        localStorage.setItem("churchAuth", JSON.stringify(creds));
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || "Login failed" };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCredentials(null);
    localStorage.removeItem("churchAuth");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, credentials }}>
      {children}
    </AuthContext.Provider>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="spinner w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Layout with Header
const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main>{children}</main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/members"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Members />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TakeAttendance />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AttendanceHistory />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
