import { useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const PERIOD_OPTIONS = [
  { key: "this-month", label: "This Month" },
  { key: "last-month", label: "Last Month" },
  { key: "this-quarter", label: "This Quarter" },
  { key: "last-quarter", label: "Last Quarter" },
  { key: "this-year", label: "This Year" },
  { key: "last-year", label: "Last Year" },
  { key: "custom", label: "Custom Range" },
];

const TYPE_OPTIONS = [
  { key: "expenses", label: "💸 Expenses", color: "red" },
  { key: "income", label: "💼 Income", color: "green" },
  { key: "savings", label: "💰 Savings", color: "purple" },
  { key: "all", label: "📊 All Combined", color: "blue" },
];

// ─── Shared PDF Header/Footer Helper (matches app style) ──
function addBranding(doc, reportTitle) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text("MoneyMap", 14, 18);

  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.setTextColor(120);
  doc.text("Personal Finance Tracker", 14, 23);

  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(reportTitle, 14, 31);

  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.setTextColor(120);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`,
    14,
    36,
  );

  const addFooter = () => {
    const pageCount = doc.internal.getNumberOfPages();
    const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    doc.setTextColor(150);
    doc.text(
      `Made by Ashutosh | MoneyMap`,
      14,
      doc.internal.pageSize.getHeight() - 10,
    );
    doc.text(
      `Page ${currentPage} of ${pageCount}`,
      pageWidth - 14,
      doc.internal.pageSize.getHeight() - 10,
      { align: "right" },
    );
  };

  return { addFooter };
}

function stampFootersOnAllPages(doc, addFooter) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter();
  }
}

function Reports() {
  const [periodType, setPeriodType] = useState("this-month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [reportType, setReportType] = useState("expenses");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [snapshotData, setSnapshotData] = useState(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  // ─── Period Report Handlers ──────────────────────────────
  const handleGenerate = async () => {
    if (periodType === "custom" && (!customStart || !customEnd)) {
      return toast.error("Please select both start and end dates");
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        periodType,
        type: reportType,
      });
      if (periodType === "custom") {
        params.append("startDate", customStart);
        params.append("endDate", customEnd);
      }

      const res = await api.get(`/reports/generate?${params.toString()}`);
      setReportData(res.data);
      toast.success("Report generated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const getSectionsToExport = () => {
    if (!reportData) return [];
    const sections = [];
    if (reportData.data.expenses)
      sections.push({
        key: "expenses",
        label: "Expenses",
        color: [239, 68, 68],
      });
    if (reportData.data.income)
      sections.push({ key: "income", label: "Income", color: [34, 197, 94] });
    if (reportData.data.savings)
      sections.push({
        key: "savings",
        label: "Savings",
        color: [168, 85, 247],
      });
    return sections;
  };

  const handleExportPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const sections = getSectionsToExport();

    const { addFooter } = addBranding(
      doc,
      `Financial Report — ${reportData.period.label}`,
    );

    let yPos = 46;

    // Summary box
    doc.setFillColor(245, 247, 250);
    doc.rect(14, yPos, 182, 8 + sections.length * 7, "F");
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.setTextColor(30);
    doc.text("Summary", 18, yPos + 6);
    doc.setFont(undefined, "normal");
    doc.setFontSize(9);

    let summaryY = yPos + 12;
    sections.forEach((sec) => {
      const total = reportData.data[sec.key].total;
      doc.setTextColor(...sec.color);
      doc.text(
        `${sec.label}: Rs. ${total.toLocaleString("en-IN")}`,
        18,
        summaryY,
      );
      summaryY += 6;
    });

    yPos = summaryY + 8;

    sections.forEach((sec) => {
      const sectionData = reportData.data[sec.key];

      if (yPos > 245) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.setTextColor(...sec.color);
      doc.text(`${sec.label} (${sectionData.count} entries)`, 14, yPos);
      yPos += 4;

      const rows = sectionData.entries.map((e) => [
        new Date(e.date).toLocaleDateString("en-IN"),
        e.title,
        e.category,
        `Rs. ${e.amount.toLocaleString("en-IN")}`,
      ]);

      autoTable(doc, {
        startY: yPos + 2,
        head: [["Date", "Title", "Category", "Amount"]],
        body:
          rows.length > 0
            ? rows
            : [["-", "No entries for this period", "-", "-"]],
        theme: "striped",
        headStyles: { fillColor: sec.color, fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 14, right: 14, bottom: 22 },
      });

      yPos = doc.lastAutoTable.finalY + 12;
    });

    stampFootersOnAllPages(doc, addFooter);

    doc.save(`MoneyMap-Report-${reportData.period.type}-${Date.now()}.pdf`);
    toast.success("PDF downloaded!");
  };

  const handleExportExcel = () => {
    if (!reportData) return;

    const sections = getSectionsToExport();
    const wb = XLSX.utils.book_new();

    // Summary sheet — clean, no branding/tagline text
    const summaryRows = [
      ["MoneyMap Financial Report"],
      [`Period: ${reportData.period.label}`],
      [`Generated: ${new Date().toLocaleDateString("en-IN")}`],
      [],
      ["Category", "Total (Rs.)", "Entry Count"],
    ];
    sections.forEach((sec) => {
      const d = reportData.data[sec.key];
      summaryRows.push([sec.label, d.total, d.count]);
    });

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
    summarySheet["!cols"] = [{ wch: 20 }, { wch: 18 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

    // One sheet per section — always written with the FULL transaction
    // list (matches PDF behavior), with a friendly fallback row instead
    // of being left blank/empty when there's no data for that period.
    sections.forEach((sec) => {
      const d = reportData.data[sec.key];
      const rows = [["Date", "Title", "Category", "Amount (Rs.)", "Notes"]];

      if (d.entries.length > 0) {
        d.entries.forEach((e) => {
          rows.push([
            new Date(e.date).toLocaleDateString("en-IN"),
            e.title,
            e.category,
            e.amount,
            e.notes || "",
          ]);
        });
      } else {
        rows.push(["-", "No entries for this period", "-", "-", "-"]);
      }

      const sheet = XLSX.utils.aoa_to_sheet(rows);
      sheet["!cols"] = [
        { wch: 12 },
        { wch: 25 },
        { wch: 16 },
        { wch: 14 },
        { wch: 25 },
      ];
      XLSX.utils.book_append_sheet(wb, sheet, sec.label);
    });

    XLSX.writeFile(
      wb,
      `MoneyMap-Report-${reportData.period.type}-${Date.now()}.xlsx`,
    );
    toast.success("Excel file downloaded!");
  };

  // ─── Snapshot Handlers ────────────────────────────────────
  const handleGenerateSnapshot = async () => {
    setSnapshotLoading(true);
    try {
      const res = await api.get("/reports/snapshot");
      setSnapshotData(res.data);
      toast.success("Snapshot generated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate snapshot");
    } finally {
      setSnapshotLoading(false);
    }
  };

  const handleExportSnapshotPDF = () => {
    if (!snapshotData) return;

    const doc = new jsPDF();
    const { addFooter } = addBranding(
      doc,
      `Financial Snapshot — as of ${new Date(snapshotData.generatedAt).toLocaleDateString("en-IN")}`,
    );

    let yPos = 46;

    // Net Worth highlight box
    const nw = snapshotData.netWorth;
    const nwPositive = nw.netWorth >= 0;
    doc.setFillColor(
      nwPositive ? 37 : 220,
      nwPositive ? 99 : 38,
      nwPositive ? 235 : 38,
    );
    doc.roundedRect(14, yPos, 182, 22, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.text("TOTAL NET WORTH", 20, yPos + 8);
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text(
      `${nwPositive ? "" : "-"}Rs. ${Math.abs(nw.netWorth).toLocaleString("en-IN")}`,
      20,
      yPos + 17,
    );
    yPos += 30;

    // Budget section
    if (snapshotData.budget.entries.length > 0) {
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.setTextColor(59, 130, 246);
      doc.text(`Budget — ${snapshotData.month}`, 14, yPos);
      yPos += 4;

      autoTable(doc, {
        startY: yPos + 2,
        head: [["Category", "Limit (Rs.)", "Spent (Rs.)", "Status"]],
        body: snapshotData.budget.entries.map((b) => [
          b.category,
          b.limit.toLocaleString("en-IN"),
          b.spent.toLocaleString("en-IN"),
          b.status,
        ]),
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 14, right: 14, bottom: 22 },
      });
      yPos = doc.lastAutoTable.finalY + 10;
    }

    // Goals section
    if (snapshotData.goals.entries.length > 0) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.setTextColor(37, 99, 235);
      doc.text("Financial Goals", 14, yPos);
      yPos += 4;

      autoTable(doc, {
        startY: yPos + 2,
        head: [["Goal", "Category", "Saved (Rs.)", "Target (Rs.)", "Status"]],
        body: snapshotData.goals.entries.map((g) => [
          g.title,
          g.category,
          g.currentAmount.toLocaleString("en-IN"),
          g.targetAmount.toLocaleString("en-IN"),
          g.isCompleted ? "Completed" : "In Progress",
        ]),
        theme: "striped",
        headStyles: { fillColor: [37, 99, 235], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 14, right: 14, bottom: 22 },
      });
      yPos = doc.lastAutoTable.finalY + 10;
    }

    // EMI section
    if (snapshotData.emi.entries.length > 0) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.setTextColor(249, 115, 22);
      doc.text("EMI / Loans", 14, yPos);
      yPos += 4;

      autoTable(doc, {
        startY: yPos + 2,
        head: [
          ["Loan", "Category", "EMI (Rs.)", "Paid/Tenure", "Outstanding (Rs.)"],
        ],
        body: snapshotData.emi.entries.map((e) => [
          e.name,
          e.category,
          e.emiAmount.toLocaleString("en-IN"),
          `${e.paidMonths}/${e.tenureMonths}`,
          e.outstanding.toLocaleString("en-IN"),
        ]),
        theme: "striped",
        headStyles: { fillColor: [249, 115, 22], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 14, right: 14, bottom: 22 },
      });
      yPos = doc.lastAutoTable.finalY + 10;
    }

    // Bills section
    if (snapshotData.bills.entries.length > 0) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.setTextColor(234, 88, 12);
      doc.text(`Bills — ${snapshotData.month}`, 14, yPos);
      yPos += 4;

      autoTable(doc, {
        startY: yPos + 2,
        head: [["Bill", "Category", "Amount (Rs.)", "Due Day", "Status"]],
        body: snapshotData.bills.entries.map((b) => [
          b.name,
          b.category,
          b.amount.toLocaleString("en-IN"),
          b.dueDate,
          b.status,
        ]),
        theme: "striped",
        headStyles: { fillColor: [234, 88, 12], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 14, right: 14, bottom: 22 },
      });
      yPos = doc.lastAutoTable.finalY + 10;
    }

    // Net Worth breakdown
    const allAssets = [
      ...(nw.breakdown?.autoAssets || []),
      ...(nw.breakdown?.manualAssets || []),
    ];
    const allLiabilities = [
      ...(nw.breakdown?.autoLiabilities || []),
      ...(nw.breakdown?.manualLiabilities || []),
    ];

    if (allAssets.length > 0 || allLiabilities.length > 0) {
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.setTextColor(34, 197, 94);
      doc.text("Assets & Liabilities", 14, yPos);
      yPos += 4;

      const rows = [
        ...allAssets.map((a) => [
          a.name,
          a.category,
          "Asset",
          `Rs. ${a.value.toLocaleString("en-IN")}`,
        ]),
        ...allLiabilities.map((l) => [
          l.name,
          l.category,
          "Liability",
          `Rs. ${l.value.toLocaleString("en-IN")}`,
        ]),
      ];

      autoTable(doc, {
        startY: yPos + 2,
        head: [["Name", "Category", "Type", "Value"]],
        body: rows,
        theme: "striped",
        headStyles: { fillColor: [34, 197, 94], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 14, right: 14, bottom: 22 },
      });
    }

    stampFootersOnAllPages(doc, addFooter);

    doc.save(`MoneyMap-Snapshot-${Date.now()}.pdf`);
    toast.success("Snapshot PDF downloaded!");
  };

  const handleExportSnapshotExcel = () => {
    if (!snapshotData) return;

    const wb = XLSX.utils.book_new();

    // Overview sheet — clean, no branding/tagline text
    const overviewRows = [
      ["MoneyMap Financial Snapshot"],
      [
        `Generated: ${new Date(snapshotData.generatedAt).toLocaleDateString("en-IN")}`,
      ],
      [`Month: ${snapshotData.month}`],
      [],
      ["Total Net Worth (Rs.)", snapshotData.netWorth.netWorth],
      ["Total Assets (Rs.)", snapshotData.netWorth.totalAssets],
      ["Total Liabilities (Rs.)", snapshotData.netWorth.totalLiabilities],
    ];
    const overviewSheet = XLSX.utils.aoa_to_sheet(overviewRows);
    overviewSheet["!cols"] = [{ wch: 26 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, overviewSheet, "Overview");

    // Budget — always create the sheet, with a friendly fallback
    // row instead of being skipped/blank when there's no data.
    {
      const rows = [["Category", "Limit (Rs.)", "Spent (Rs.)", "Status"]];
      if (snapshotData.budget.entries.length > 0) {
        snapshotData.budget.entries.forEach((b) => {
          rows.push([b.category, b.limit, b.spent, b.status]);
        });
      } else {
        rows.push(["-", "-", "-", "No budgets set"]);
      }
      const sheet = XLSX.utils.aoa_to_sheet(rows);
      sheet["!cols"] = [{ wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, sheet, "Budget");
    }

    // Goals
    {
      const rows = [
        ["Goal", "Category", "Saved (Rs.)", "Target (Rs.)", "Status"],
      ];
      if (snapshotData.goals.entries.length > 0) {
        snapshotData.goals.entries.forEach((g) => {
          rows.push([
            g.title,
            g.category,
            g.currentAmount,
            g.targetAmount,
            g.isCompleted ? "Completed" : "In Progress",
          ]);
        });
      } else {
        rows.push(["-", "-", "-", "-", "No goals yet"]);
      }
      const sheet = XLSX.utils.aoa_to_sheet(rows);
      sheet["!cols"] = [
        { wch: 22 },
        { wch: 16 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
      ];
      XLSX.utils.book_append_sheet(wb, sheet, "Goals");
    }

    // EMI
    {
      const rows = [
        [
          "Loan",
          "Category",
          "EMI (Rs.)",
          "Paid Months",
          "Tenure Months",
          "Outstanding (Rs.)",
        ],
      ];
      if (snapshotData.emi.entries.length > 0) {
        snapshotData.emi.entries.forEach((e) => {
          rows.push([
            e.name,
            e.category,
            e.emiAmount,
            e.paidMonths,
            e.tenureMonths,
            e.outstanding,
          ]);
        });
      } else {
        rows.push(["-", "-", "-", "-", "-", "No active EMIs"]);
      }
      const sheet = XLSX.utils.aoa_to_sheet(rows);
      sheet["!cols"] = [
        { wch: 20 },
        { wch: 16 },
        { wch: 12 },
        { wch: 12 },
        { wch: 14 },
        { wch: 16 },
      ];
      XLSX.utils.book_append_sheet(wb, sheet, "EMI");
    }

    // Bills
    {
      const rows = [["Bill", "Category", "Amount (Rs.)", "Due Day", "Status"]];
      if (snapshotData.bills.entries.length > 0) {
        snapshotData.bills.entries.forEach((b) => {
          rows.push([b.name, b.category, b.amount, b.dueDate, b.status]);
        });
      } else {
        rows.push(["-", "-", "-", "-", "No bills added"]);
      }
      const sheet = XLSX.utils.aoa_to_sheet(rows);
      sheet["!cols"] = [
        { wch: 20 },
        { wch: 16 },
        { wch: 14 },
        { wch: 10 },
        { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(wb, sheet, "Bills");
    }

    // Net Worth breakdown
    {
      const allAssets = [
        ...(snapshotData.netWorth.breakdown?.autoAssets || []),
        ...(snapshotData.netWorth.breakdown?.manualAssets || []),
      ];
      const allLiabilities = [
        ...(snapshotData.netWorth.breakdown?.autoLiabilities || []),
        ...(snapshotData.netWorth.breakdown?.manualLiabilities || []),
      ];
      const rows = [["Name", "Category", "Type", "Value (Rs.)"]];
      if (allAssets.length > 0 || allLiabilities.length > 0) {
        allAssets.forEach((a) =>
          rows.push([a.name, a.category, "Asset", a.value]),
        );
        allLiabilities.forEach((l) =>
          rows.push([l.name, l.category, "Liability", l.value]),
        );
      } else {
        rows.push(["-", "-", "-", "No assets or liabilities recorded"]);
      }
      const sheet = XLSX.utils.aoa_to_sheet(rows);
      sheet["!cols"] = [{ wch: 20 }, { wch: 16 }, { wch: 12 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(wb, sheet, "Net Worth");
    }

    XLSX.writeFile(wb, `MoneyMap-Snapshot-${Date.now()}.xlsx`);
    toast.success("Snapshot Excel downloaded!");
  };

  const inputClass =
    "w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm";

  const sections = getSectionsToExport();

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6">
        📄 Reports
      </h1>

      {/* ═══════════ SECTION 1 — PERIOD REPORTS ═══════════ */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700 p-4 sm:p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">
          📅 Period Reports
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Expenses, Income, and Savings for any date range
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Period
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setPeriodType(opt.key)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition border ${
                  periodType === opt.key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {periodType === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        )}

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Report Type
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setReportType(opt.key)}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition border ${
                  reportType === opt.key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded transition font-medium disabled:opacity-50 text-sm"
        >
          {loading ? "Generating..." : "📊 Generate Report"}
        </button>
      </div>

      {reportData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200">
                Report Preview
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {reportData.period.label}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportPDF}
                className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition"
              >
                📄 PDF
              </button>
              <button
                onClick={handleExportExcel}
                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition"
              >
                📊 Excel
              </button>
            </div>
          </div>

          <div
            className="grid gap-3 sm:gap-4 mb-6"
            style={{
              gridTemplateColumns: `repeat(${Math.min(sections.length, 3)}, 1fr)`,
            }}
          >
            {sections.map((sec) => {
              const d = reportData.data[sec.key];
              const colorClass =
                sec.key === "expenses"
                  ? "text-red-600 dark:text-red-400"
                  : sec.key === "income"
                    ? "text-green-600 dark:text-green-400"
                    : "text-purple-600 dark:text-purple-400";

              return (
                <div
                  key={sec.key}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 sm:p-4 text-center"
                >
                  <p className={`text-base sm:text-xl font-bold ${colorClass}`}>
                    ₹{d.total.toLocaleString()}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {sec.label} • {d.count} entries
                  </p>
                </div>
              );
            })}
          </div>

          {sections.map((sec) => {
            const d = reportData.data[sec.key];
            const categoryEntries = Object.entries(d.categoryTotals).sort(
              (a, b) => b[1] - a[1],
            );
            if (categoryEntries.length === 0) return null;

            return (
              <div key={sec.key} className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
                  {sec.label} by Category
                </h3>
                <div className="space-y-2">
                  {categoryEntries.map(([cat, amount]) => {
                    const pct =
                      d.total > 0 ? Math.round((amount / d.total) * 100) : 0;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-700 dark:text-gray-300">
                            {cat}
                          </span>
                          <span className="font-medium text-gray-600 dark:text-gray-400">
                            ₹{amount.toLocaleString()} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════ SECTION 2 — CURRENT SNAPSHOT ═══════════ */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700 p-4 sm:p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">
          📸 Current Snapshot
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Budget, Goals, EMI, Bills, and Net Worth — as of right now
        </p>

        <button
          onClick={handleGenerateSnapshot}
          disabled={snapshotLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded transition font-medium disabled:opacity-50 text-sm"
        >
          {snapshotLoading ? "Generating..." : "📸 Generate Snapshot"}
        </button>
      </div>

      {snapshotData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-transparent dark:border-gray-700 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-700 dark:text-gray-200">
                Snapshot Preview
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                As of{" "}
                {new Date(snapshotData.generatedAt).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportSnapshotPDF}
                className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition"
              >
                📄 PDF
              </button>
              <button
                onClick={handleExportSnapshotExcel}
                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition"
              >
                📊 Excel
              </button>
            </div>
          </div>

          <div
            style={{
              background:
                snapshotData.netWorth.netWorth >= 0
                  ? "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)"
                  : "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
              borderRadius: "12px",
              padding: "1rem 1.25rem",
              textAlign: "center",
              marginBottom: "1.5rem",
            }}
            className="sm:!p-6"
          >
            <p
              style={{
                color: "rgba(255,255,255,0.75)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
              className="!text-[0.65rem] sm:!text-[0.7rem]"
            >
              Total Net Worth
            </p>
            <p
              style={{ color: "white", fontWeight: "800" }}
              className="!text-2xl sm:!text-[1.75rem]"
            >
              {snapshotData.netWorth.netWorth >= 0 ? "" : "-"}₹
              {Math.abs(snapshotData.netWorth.netWorth).toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
              <p className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">
                ₹{snapshotData.budget.totalSpent.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                Budget Spent
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
              <p className="text-base sm:text-lg font-bold text-purple-600 dark:text-purple-400">
                ₹{snapshotData.goals.totalSaved.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                Goals Saved
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
              <p className="text-base sm:text-lg font-bold text-orange-600 dark:text-orange-400">
                ₹{snapshotData.emi.monthlyOutflow.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                EMI Outflow
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
              <p className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400">
                {snapshotData.bills.overdueCount}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                Bills Overdue
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
