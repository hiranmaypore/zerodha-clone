import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Search,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  BarChart3,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const navItems = [
  { path: "/dashboard", label: "Home" },
  { path: "/market", label: "Markets" },
  { path: "/orders", label: "Trade", highlight: true },
  { path: "/holdings", label: "Features" },
  { path: "/watchlist", label: "Earn" },
  { path: "/funds", label: "Assets" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-xl border-b border-edge z-50">
      <div className="h-full max-w-[1920px] mx-auto px-6 flex items-center justify-between">
        {/* Logo + Nav */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/dashboard")}
          >
            <div className="relative w-9 h-9">
              <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
                <path
                  d="M8 20C8 14 12 8 20 8"
                  stroke="#7C3AED"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M14 20C14 16 16 12 20 12"
                  stroke="#A78BFA"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M20 8C28 8 32 14 32 20"
                  stroke="#7C3AED"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M20 12C24 12 26 16 26 20"
                  stroke="#A78BFA"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M32 20C32 26 28 32 20 32"
                  stroke="#7C3AED"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="20" cy="20" r="2" fill="#A78BFA" />
              </svg>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, label, highlight }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                  ${
                    isActive || highlight
                      ? "bg-surface text-primary"
                      : "text-secondary hover:text-primary"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <button className="p-2.5 rounded-xl text-secondary hover:text-primary hover:bg-surface transition-all">
            <Search className="w-[18px] h-[18px]" />
          </button>
          <button className="p-2.5 rounded-xl text-secondary hover:text-primary hover:bg-surface transition-all relative">
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full" />
          </button>
          <button className="p-2.5 rounded-xl text-secondary hover:text-primary hover:bg-surface transition-all">
            <Settings className="w-[18px] h-[18px]" />
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-edge mx-1" />

          {/* User Dropdown */}
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl hover:bg-surface transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-primary hidden lg:block">
                {user?.name || "User"}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-muted transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-edge rounded-xl shadow-2xl py-2 animate-fade-in">
                <div className="px-4 py-2 border-b border-edge">
                  <p className="text-sm font-medium text-primary truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-muted truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-sm text-loss hover:bg-loss-dim flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
