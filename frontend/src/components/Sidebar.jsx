import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Search, Bell, ChevronDown, LogOut, Settings,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const navItems = [
  { path: "/dashboard",  label: "Home"     },
  { path: "/market",     label: "Markets"  },
  { path: "/orders",     label: "Trade"    },
  { path: "/holdings",   label: "Holdings" },
  { path: "/watchlist",  label: "Watchlist"},
  { path: "/funds",      label: "Funds"    },
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
    <header className="fixed top-0 left-0 right-0 h-14 bg-card/90 backdrop-blur-xl border-b border-edge z-50">
      <div className="h-full max-w-[1920px] mx-auto px-4 flex items-center justify-between">

        {/* ── Logo + Nav ── */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer shrink-0"
            onClick={() => navigate("/dashboard")}
          >
            <div className="relative w-8 h-8">
              <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
                <path d="M8 20C8 14 12 8 20 8"  stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
                <path d="M14 20C14 16 16 12 20 12" stroke="#A78BFA" strokeWidth="3" strokeLinecap="round" />
                <path d="M20 8C28 8 32 14 32 20"  stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
                <path d="M20 12C24 12 26 16 26 20" stroke="#A78BFA" strokeWidth="3" strokeLinecap="round" />
                <path d="M32 20C32 26 28 32 20 32" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
                <circle cx="20" cy="20" r="2" fill="#A78BFA" />
              </svg>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map(({ path, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-surface text-primary"
                      : "text-secondary hover:text-primary hover:bg-surface/60"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* ── Right Side ── */}
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-surface transition-all">
            <Search className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-surface transition-all relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-purple-500 rounded-full" />
          </button>
          <button className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-surface transition-all">
            <Settings className="w-4 h-4" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-edge mx-2" />

          {/* User Dropdown */}
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-surface transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-primary hidden lg:block max-w-[120px] truncate">
                {user?.name || "User"}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-muted transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-edge rounded-xl shadow-2xl py-2 animate-fade-in">
                <div className="px-4 py-2.5 border-b border-edge">
                  <p className="text-sm font-semibold text-primary truncate">{user?.name}</p>
                  <p className="text-[11px] text-muted truncate mt-0.5">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-sm text-loss hover:bg-loss/10 flex items-center gap-2 transition-colors"
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
