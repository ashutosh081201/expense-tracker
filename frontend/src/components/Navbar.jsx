import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useTheme } from "../context/useTheme";

function Navbar() {
  const { user, token, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!token) return null;

  const links = [
    { path: "/dashboard", label: "📊 Dashboard" },
    { path: "/expenses", label: "💸 Expenses" },
    { path: "/income", label: "💼 Income" },
    { path: "/savings", label: "💰 Savings" },
    { path: "/budget", label: "💳 Budget" },
    { path: "/goals", label: "🎯 Goals" },
    { path: "/emi", label: "🏦 EMI" },
    { path: "/bills", label: "🔔 Bills" },
    { path: "/networth", label: "📈 Net Worth" },
    { path: "/reports", label: "📄 Reports" },
    { path: "/ai-insights", label: "🤖 AI Insights" },
  ];

  return (
    <nav className="bg-blue-600 dark:bg-gray-900 text-white px-4 md:px-6 py-3 md:py-4 shadow-md dark:border-b dark:border-gray-700 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        {/* Mobile hamburger */}
        <button
          onClick={() => setShowMobileNav(!showMobileNav)}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded hover:bg-blue-500 dark:hover:bg-gray-700 transition flex-shrink-0"
          aria-label="Toggle menu"
        >
          <span className="text-xl">{showMobileNav ? "✕" : "☰"}</span>
        </button>

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-800 dark:bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm md:text-base flex-shrink-0">
            ₹
          </div>
          <span className="text-lg md:text-xl font-bold tracking-wide">
            MoneyMap
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1 overflow-x-auto mx-4 flex-1">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-1.5 rounded text-sm font-medium transition whitespace-nowrap ${
                location.pathname === link.path
                  ? "bg-white text-blue-600 dark:bg-gray-700 dark:text-white"
                  : "hover:bg-blue-500 dark:hover:bg-gray-700 text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-blue-500 dark:hover:bg-gray-700 transition text-lg"
            title={isDark ? "Switch to Light" : "Switch to Dark"}
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 hover:bg-blue-500 dark:hover:bg-gray-700 px-2 md:px-3 py-1.5 rounded transition"
            >
              <div
                style={{ backgroundColor: user?.avatarColor || "#1d4ed8" }}
                className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
              >
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline text-sm whitespace-nowrap">
                {user?.name?.split(" ")[0]}
              </span>
              <span className="hidden sm:inline text-xs">▼</span>
            </button>

            {/* Dropdown */}
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 z-50">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.email}
                  </p>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setShowMenu(false)}
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  👤 Profile
                </Link>

                <Link
                  to="/change-password"
                  onClick={() => setShowMenu(false)}
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  🔒 Change Password
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 transition"
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Slide-Down Nav */}
      {showMobileNav && (
        <div className="md:hidden mt-3 pb-2 border-t border-blue-500 dark:border-gray-700 pt-3">
          <div className="grid grid-cols-2 gap-1.5">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setShowMobileNav(false)}
                className={`px-3 py-2 rounded text-sm font-medium transition ${
                  location.pathname === link.path
                    ? "bg-white text-blue-600 dark:bg-gray-700 dark:text-white"
                    : "bg-blue-500/40 dark:bg-gray-800 hover:bg-blue-500 dark:hover:bg-gray-700 text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
