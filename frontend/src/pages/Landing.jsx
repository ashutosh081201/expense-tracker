import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useTheme } from "../context/useTheme";

const FEATURES = [
  {
    icon: "💸",
    title: "Expense Tracking",
    desc: "Log and categorize every expense. Search, filter, bulk delete and export to Excel or PDF.",
  },
  {
    icon: "💼",
    title: "Income Management",
    desc: "Track all income sources — salary, freelance, dividends and more.",
  },
  {
    icon: "💰",
    title: "Savings Tracker",
    desc: "Monitor your savings across accounts, FDs, gold, stocks and crypto.",
  },
  {
    icon: "💳",
    title: "Budget Planner",
    desc: "Set monthly budgets per category. Get alerts when you are nearing your limit.",
  },
  {
    icon: "🎯",
    title: "Financial Goals",
    desc: "Set savings goals with deadlines. Track progress and add money incrementally.",
  },
  {
    icon: "🏦",
    title: "EMI Tracker",
    desc: "Track all your loans and EMIs. Mark monthly payments and see outstanding amounts.",
  },
  {
    icon: "🔔",
    title: "Bill Reminders",
    desc: "Never miss a recurring bill. Get overdue and due-soon alerts with payment punctuality tracking.",
  },
  {
    icon: "📈",
    title: "Net Worth Calculator",
    desc: "Know your true financial standing. Assets minus liabilities — with monthly growth tracking.",
  },
  {
    icon: "📊",
    title: "Smart Dashboard",
    desc: "9 analytics tabs with 20+ interactive charts covering every part of your finances.",
  },
  {
    icon: "💯",
    title: "Financial Health Score",
    desc: "A single 0-100 score based on savings rate, budget control, EMI burden and cash flow.",
  },
  {
    icon: "📄",
    title: "Custom Reports",
    desc: "Download PDF or Excel reports for any month, quarter, year or custom date range.",
  },
  {
    icon: "🤖",
    title: "AI Insights",
    desc: "Get AI-generated insights and trend predictions across spending, savings, goals and more.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Create your account",
    desc: "Sign up for free. Verify your email and you are ready to go in under a minute.",
  },
  {
    step: "02",
    title: "Add your data",
    desc: "Log your expenses, income, savings, EMIs and bills. Everything in one place.",
  },
  {
    step: "03",
    title: "Track and improve",
    desc: "See your dashboard, set budgets, track goals, and get AI-powered insights.",
  },
];

function Landing() {
  const { token } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) navigate("/dashboard");
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-200 overflow-x-hidden">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-950 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
            ₹
          </div>
          <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            MoneyMap
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-base sm:text-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition flex-shrink-0"
          >
            {isDark ? "☀️" : "🌙"}
          </button>
          <Link
            to="/login"
            className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition whitespace-nowrap"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition whitespace-nowrap"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="text-center px-4 sm:px-6 py-14 sm:py-24 max-w-4xl mx-auto">
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
            border: "1px solid #bfdbfe",
            borderRadius: "9999px",
            padding: "6px 16px",
            marginBottom: "1.25rem",
            maxWidth: "100%",
          }}
          className="dark:border-blue-700"
        >
          <span style={{ fontSize: "0.9rem" }}>✨</span>
          <span
            style={{
              background: "linear-gradient(90deg, #2563eb, #7c3aed)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: "700",
              fontSize: "0.7rem",
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
            }}
            className="sm:!text-[0.85rem]"
          >
            Complete Personal Finance Toolkit
          </span>
          <span style={{ fontSize: "0.9rem" }}>💰</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-5 sm:mb-6 leading-tight px-2">
          Take control of your
          <span className="text-blue-600 dark:text-blue-400"> money </span>
          with MoneyMap
        </h1>

        <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
          Track expenses, manage budgets, hit your goals, and get AI-powered
          insights — with a Financial Health Score and custom reports, all in
          one place.
        </p>

        <div className="flex gap-3 sm:gap-4 justify-center flex-wrap px-4">
          <Link
            to="/register"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl transition shadow-lg shadow-blue-200 dark:shadow-none text-sm w-full sm:w-auto"
          >
            Start Tracking Free →
          </Link>
          <Link
            to="/login"
            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl border border-gray-200 dark:border-gray-700 transition text-sm w-full sm:w-auto"
          >
            Sign In
          </Link>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-5 sm:mt-6 px-4">
          Free forever · No credit card required · Email verified security
        </p>
      </section>

      {/* Feature Stats Row */}
      <section className="px-4 sm:px-6 pb-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { value: "12", label: "Core Features" },
            { value: "20+", label: "Interactive Charts" },
            { value: "AI", label: "Powered Insights" },
            { value: "100%", label: "Free to Use" },
          ].map((stat, i) => (
            <div
              key={i}
              className="text-center p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
            >
              <p className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400">
                {stat.value}
              </p>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
            Everything you need to manage money
          </h2>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 px-4">
            12 powerful features to help you manage every aspect of your
            finances
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {FEATURES.map((feature, i) => (
            <div
              key={i}
              className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 sm:p-6 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md transition"
            >
              <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">
                {feature.icon}
              </div>
              <h3 className="font-bold text-gray-800 dark:text-white mb-1.5 sm:mb-2 text-sm sm:text-base">
                {feature.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Highlight: AI Insights + Dashboard callout */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700">
            <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🤖</div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-2">
              AI-Powered Insights
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
              Generate AI insights for any period — spending patterns, budget
              discipline, savings trends, goal pace, EMI burden and net worth
              growth, plus trend-based predictions.
            </p>
            <ul className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 space-y-1.5">
              <li>✅ Category-wise spending insights</li>
              <li>✅ Budget and savings pattern detection</li>
              <li>✅ Goal pace and completion forecasts</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700">
            <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">📊</div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-2">
              9-Tab Analytics Dashboard
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
              A dedicated dashboard tab for Overview, Expenses, Income, Savings,
              Budget, Goals, EMI, Bills and Net Worth — each with purpose-built
              charts.
            </p>
            <ul className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 space-y-1.5">
              <li>✅ Financial Health Score with breakdown</li>
              <li>✅ EMI & Bill due-date calendar</li>
              <li>✅ Downloadable PDF / Excel reports</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
              Up and running in minutes
            </h2>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 px-4">
              No complicated setup. Just sign up and start tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {STEPS.map((step, i) => (
              <div key={i} className="text-center px-2">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-lg sm:text-xl font-extrabold mx-auto mb-3 sm:mb-4 shadow-lg shadow-blue-200 dark:shadow-none">
                  {step.step}
                </div>
                <h3 className="font-bold text-gray-800 dark:text-white mb-2 text-sm sm:text-base">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 sm:py-20 px-4 sm:px-6">
        <div
          style={{
            background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
            borderRadius: "24px",
            padding: "2.5rem 1.5rem",
            textAlign: "center",
            maxWidth: "800px",
            margin: "0 auto",
          }}
          className="sm:!p-16"
        >
          <h2
            style={{
              color: "white",
              fontWeight: "800",
              marginBottom: "1rem",
            }}
            className="!text-2xl sm:!text-3xl"
          >
            Ready to take control of your finances?
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.75)",
              marginBottom: "2rem",
            }}
            className="!text-sm sm:!text-base px-2"
          >
            Join MoneyMap and start your journey to financial clarity today.
          </p>
          <Link
            to="/register"
            style={{
              background: "white",
              color: "#2563eb",
              fontWeight: "700",
              padding: "0.75rem 2rem",
              borderRadius: "12px",
              textDecoration: "none",
              display: "inline-block",
            }}
            className="!text-sm sm:!px-10 sm:!py-3.5"
          >
            Create Free Account →
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Landing;
