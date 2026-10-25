import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/useTheme";

function NotFound() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-200 relative"
      style={{ fontFamily: "sans-serif", padding: "1.25rem" }}
    >
      {/* Dark mode toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-lg shadow hover:shadow-md transition"
      >
        {isDark ? "☀️" : "🌙"}
      </button>

      <div style={{ textAlign: "center", maxWidth: "480px", width: "100%" }}>
        {/* SVG Illustration */}
        <svg
          viewBox="0 0 400 300"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "100%", maxWidth: "280px", marginBottom: "1.5rem" }}
          className="sm:!max-w-[320px] sm:!mb-8"
        >
          <circle
            cx="200"
            cy="150"
            r="120"
            fill={isDark ? "#1f2937" : "#eff6ff"}
          />
          <text
            x="200"
            y="140"
            textAnchor="middle"
            fontSize="72"
            fontWeight="800"
            fill={isDark ? "#60a5fa" : "#2563eb"}
            fontFamily="Arial"
          >
            404
          </text>
          <text
            x="200"
            y="195"
            textAnchor="middle"
            fontSize="36"
            fontFamily="Arial"
          >
            🗺️
          </text>
          <circle cx="80" cy="60" r="8" fill={isDark ? "#374151" : "#bfdbfe"} />
          <circle
            cx="320"
            cy="80"
            r="6"
            fill={isDark ? "#374151" : "#bfdbfe"}
          />
          <circle
            cx="60"
            cy="220"
            r="5"
            fill={isDark ? "#374151" : "#bfdbfe"}
          />
          <circle
            cx="340"
            cy="230"
            r="7"
            fill={isDark ? "#374151" : "#bfdbfe"}
          />
          <path
            d="M 80 200 Q 150 100 200 150 Q 250 200 320 120"
            stroke={isDark ? "#374151" : "#93c5fd"}
            strokeWidth="2"
            strokeDasharray="8 4"
            fill="none"
          />
          <circle
            cx="320"
            cy="120"
            r="10"
            fill={isDark ? "#60a5fa" : "#2563eb"}
          />
          <circle cx="320" cy="120" r="5" fill="white" />
        </svg>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 dark:text-white mb-2">
          Page Not Found
        </h1>

        {/* Subtext */}
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 sm:mb-8 leading-relaxed px-2">
          Looks like this page got lost on the map. Let's get you back on track.
        </p>

        {/* Buttons */}
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition"
          >
            🏠 Go to Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 px-5 py-2.5 rounded-lg text-sm font-semibold transition"
          >
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
