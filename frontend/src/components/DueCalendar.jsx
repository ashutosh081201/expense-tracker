import { useState } from "react";

function DueCalendar({ emis, bills, mode = "all" }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthShort = currentDate.toLocaleString("default", {
    month: "short",
    year: "numeric",
  });

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  // Is the viewed month strictly BEFORE the actual current month?
  const isPastMonth =
    year < today.getFullYear() ||
    (year === today.getFullYear() && month < today.getMonth());

  const showBills = mode === "all" || mode === "bills";
  const showEMIs = mode === "all" || mode === "emi";

  const eventsByDay = {};

  if (showBills) {
    (bills || [])
      .filter((b) => b.isActive !== false)
      .forEach((bill) => {
        const day = bill.dueDate;
        if (day >= 1 && day <= daysInMonth) {
          if (!eventsByDay[day]) eventsByDay[day] = [];

          // Determine paid state for THIS viewed month:
          // - Past months: bill cycle already completed → treat as paid
          // - Current month: use actual bill.status from backend
          // - Future months: not yet due/paid
          const isPaidForThisMonth = isPastMonth
            ? true
            : isCurrentMonth
              ? bill.status === "paid"
              : false;

          eventsByDay[day].push({
            type: "bill",
            name: bill.name,
            amount: bill.amount,
            category: bill.category,
            status: bill.status,
            isPaidForThisMonth,
          });
        }
      });
  }

  if (showEMIs) {
    (emis || [])
      .filter((e) => e.isActive)
      .forEach((emi) => {
        const nextDue = new Date(emi.startDate);
        nextDue.setMonth(nextDue.getMonth() + emi.paidMonths);
        if (nextDue.getFullYear() === year && nextDue.getMonth() === month) {
          const day = nextDue.getDate();
          if (!eventsByDay[day]) eventsByDay[day] = [];
          eventsByDay[day].push({
            type: "emi",
            name: emi.name,
            amount: emi.emiAmount,
            category: emi.category,
          });
        }
      });
  }

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };
  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  const weeks = [];
  let week = new Array(firstDayOfMonth).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const totalThisMonth = Object.values(eventsByDay)
    .flat()
    .reduce((s, e) => s + e.amount, 0);

  const totalEvents = Object.values(eventsByDay).flat().length;

  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

  const title =
    mode === "emi"
      ? "🏦 EMI Calendar"
      : mode === "bills"
        ? "🔔 Bill Calendar"
        : "🗓️ EMI & Bill Calendar";

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 border border-transparent dark:border-gray-700 flex flex-col"
      style={{ height: "400px" }}
    >
      {/* Header row: title + month nav */}
      <div className="flex flex-wrap items-start justify-between mb-2 gap-1.5 flex-shrink-0">
        <div className="min-w-0">
          <h2 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
            {title}
          </h2>
          <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500">
            {totalEvents} due • ₹{totalThisMonth.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={goToPrevMonth}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
          >
            ‹
          </button>
          <button
            onClick={goToToday}
            className="px-2 sm:px-2.5 py-1 rounded border border-gray-200 dark:border-gray-600 text-[10px] sm:text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition whitespace-nowrap"
          >
            {monthShort}
          </button>
          <button
            onClick={goToNextMonth}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm"
          >
            ›
          </button>
        </div>
      </div>

      {mode === "all" && (
        <div className="flex justify-center gap-3 mb-1.5 text-[10px] flex-shrink-0 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
            <span className="text-gray-500 dark:text-gray-400">Bill Due</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            <span className="text-gray-500 dark:text-gray-400">Bill Paid</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            <span className="text-gray-500 dark:text-gray-400">EMI</span>
          </span>
        </div>
      )}

      {mode === "bills" && (
        <div className="flex justify-center gap-3 mb-1.5 text-[10px] flex-shrink-0">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
            <span className="text-gray-500 dark:text-gray-400">Due</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            <span className="text-gray-500 dark:text-gray-400">Paid</span>
          </span>
        </div>
      )}

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 flex-shrink-0">
        {dayNames.map((d, i) => (
          <div
            key={i}
            className="text-center text-[10px] sm:text-xs font-medium text-gray-400 dark:text-gray-500"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid — fills all remaining vertical space */}
      <div className="flex-1 flex flex-col gap-0.5 sm:gap-1 min-h-0">
        {weeks.map((week, wIdx) => (
          <div key={wIdx} className="grid grid-cols-7 gap-0.5 sm:gap-1 flex-1">
            {week.map((day, dIdx) => {
              if (day === null) {
                return <div key={dIdx} />;
              }

              const events = eventsByDay[day] || [];
              const isToday = isCurrentMonth && day === todayDate;
              const isPast = isCurrentMonth && day < todayDate;
              const hasBillDue = events.some(
                (e) => e.type === "bill" && !e.isPaidForThisMonth,
              );
              const hasBillPaid = events.some(
                (e) => e.type === "bill" && e.isPaidForThisMonth,
              );
              const hasEMI = events.some((e) => e.type === "emi");
              const isSelected = selectedDay === day;

              return (
                <button
                  key={dIdx}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`rounded-lg flex flex-col items-center justify-center relative transition ${
                    isSelected
                      ? "bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-500"
                      : isToday
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : events.length > 0
                          ? "bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  }`}
                >
                  <span
                    className={`text-[10px] sm:text-xs ${
                      isToday
                        ? "font-bold text-blue-600 dark:text-blue-400"
                        : isPast
                          ? "text-gray-300 dark:text-gray-600"
                          : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {day}
                  </span>
                  {events.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {hasBillDue && (
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
                      )}
                      {hasBillPaid && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      )}
                      {hasEMI && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Selected day details — overlays, doesn't affect grid height */}
      {selectedDay && eventsByDay[selectedDay] && (
        <div
          className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex-shrink-0"
          style={{ maxHeight: "70px", overflowY: "auto" }}
        >
          <div className="space-y-1">
            {eventsByDay[selectedDay].map((event, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-2 py-1 bg-gray-50 dark:bg-gray-700/50 rounded"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      event.type === "bill"
                        ? event.isPaidForThisMonth
                          ? "bg-green-500"
                          : "bg-orange-500"
                        : "bg-blue-500"
                    }`}
                  />
                  <p className="text-xs font-medium text-gray-800 dark:text-white truncate">
                    {event.name}
                    {event.type === "bill" && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1">
                        ({event.isPaidForThisMonth ? "Paid" : "Due"})
                      </span>
                    )}
                  </p>
                </div>
                <span className="text-xs font-bold text-gray-800 dark:text-white flex-shrink-0 ml-2">
                  ₹{event.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DueCalendar;
