function Footer() {
  return (
    <footer className="text-center py-8 px-4 mt-12 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Logo */}
      <div className="flex justify-center items-center gap-2 mb-3">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow">
          ₹
        </div>
        <span className="text-lg font-bold text-gray-800 dark:text-white tracking-tight">
          MoneyMap
        </span>
      </div>

      {/* Divider */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <div className="h-px w-16 bg-gray-200 dark:bg-gray-700" />
        <span className="text-base">💙</span>
        <div className="h-px w-16 bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Made by */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
        Made with <span className="text-red-500">❤️</span> by{" "}
        <span className="font-bold text-blue-600 dark:text-blue-400">
          Ashutosh
        </span>
      </p>

      {/* Tagline */}
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Track smart. Spend wise. Save more. 💰
      </p>
    </footer>
  );
}

export default Footer;
