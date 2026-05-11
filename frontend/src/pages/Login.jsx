import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User, AlertCircle } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await login(username, password);
    
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="login-container">
      {/* Left side - Login Form */}
      <div className="login-form-section">
        <div className="w-full max-w-md animate-fadeIn">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img 
              src="/logo.png"   // ← Put your logo in public/logo.png
              alt="Church Logo" 
              className="h-24 w-auto"
              data-testid="login-logo"
            />
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Church Attendance System
            </h1>
            <p className="text-slate-500">
              Sign in to manage attendance records
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
            {error && (
              <div 
                className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-sm"
                data-testid="login-error"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="label-style">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="pl-10"
                  required
                  data-testid="login-username-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="label-style">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="pl-10"
                  required
                  data-testid="login-password-input"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 transition-all duration-150 active:scale-[0.98]"
              disabled={isLoading}
              data-testid="login-submit-button"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="spinner w-4 h-4" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-slate-400 mt-8">
            Revival Baptist Church Attendance System
          </p>
        </div>
      </div>

      {/* Right side - Hero Image */}
      <div className="login-hero-section">
        <div className="absolute inset-0 bg-blue-900/30" />
        <div className="relative z-10 text-center text-white p-8">
          <h2 className="text-3xl font-bold mb-4">Welcome Back</h2>
          <p className="text-lg opacity-90 max-w-md">
            Track attendance, manage members, and keep your congregation connected.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;