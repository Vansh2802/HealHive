import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, LayoutDashboard } from "lucide-react";

export default function TherapistNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="w-full bg-background border-b border-border shadow-sm px-6 py-2 flex items-center justify-between z-50">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-bold tracking-tight text-primary">Heal</span>
          <span className="text-2xl font-bold tracking-tight text-accent">Hive</span>
        </Link>
        <span className="ml-6 text-base font-medium text-text-soft hidden sm:inline">Therapist Dashboard</span>
      </div>
      <div className="flex items-center gap-4">
        <Link
          to="/therapist/dashboard"
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-text-main hover:bg-primary-soft rounded-lg transition-all"
        >
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-text-soft hover:text-accent hover:bg-accent/10 rounded-lg transition-all"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
        {user && (
          <div className="ml-2 flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary-soft flex items-center justify-center text-primary font-semibold text-lg">
              {user.name?.[0]}
            </div>
            <span className="text-sm text-text-main font-medium hidden sm:block">{user.name}</span>
          </div>
        )}
      </div>
    </nav>
  );
}
