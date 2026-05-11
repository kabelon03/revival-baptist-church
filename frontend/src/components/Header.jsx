import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  ClipboardCheck, 
  History, 
  Settings,
  LogOut,
  ChevronDown
} from "lucide-react";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const navLinks = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/members", label: "Members", icon: Users },
    { path: "/attendance", label: "Take Attendance", icon: ClipboardCheck },
    { path: "/history", label: "History", icon: History },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <header className="header" data-testid="header">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-md"
            data-testid="mobile-menu-button"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/")}
            data-testid="header-logo"
          >
            <img 
              src="/images/login-hero.jpg"
              alt="Church Logo" 
              className="h-10 w-auto"
            />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                Revival Baptist
              </h1>
              <p className="text-xs text-slate-500 -mt-0.5">Attendance System</p>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
                transition-colors duration-150
                ${isActive(link.path) 
                  ? "bg-blue-50 text-blue-600" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}
              `}
              data-testid={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </button>
          ))}
        </nav>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              data-testid="user-menu-button"
            >
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                A
              </div>
              <span className="hidden sm:inline text-sm font-medium text-slate-700">Admin</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={() => navigate("/settings")}
              className="cursor-pointer"
              data-testid="menu-settings"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="cursor-pointer text-red-600 focus:text-red-600"
              data-testid="menu-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-menu-overlay lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          data-testid="mobile-menu-overlay"
        />
      )}

      {/* Mobile Menu */}
      <div 
        className={`
          mobile-menu lg:hidden
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        data-testid="mobile-menu"
      >
        {/* Mobile Menu Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <img 
              src="/images/login-hero.jpg" 
              alt="Church Logo" 
              className="h-8 w-auto"
            />
            <span className="font-bold text-slate-900">Revival Baptist</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 hover:bg-slate-100 rounded-md"
            data-testid="close-mobile-menu"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Mobile Menu Links */}
        <nav className="p-4 space-y-1">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => {
                navigate(link.path);
                setIsMobileMenuOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left
                transition-colors duration-150
                ${isActive(link.path) 
                  ? "bg-blue-50 text-blue-600" 
                  : "text-slate-600 hover:bg-slate-50"}
              `}
              data-testid={`mobile-nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <link.icon className="w-5 h-5" />
              <span className="font-medium">{link.label}</span>
            </button>
          ))}
        </nav>

        {/* Mobile Menu Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50"
            data-testid="mobile-logout"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Header;