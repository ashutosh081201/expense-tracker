import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// ─── EXCEL EXPORT ───────────────────────────────────────────

export function exportToExcel(data, filename, sheetName) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  // Set column widths
  const cols = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.max(key.length, 15),
  }));
  worksheet["!cols"] = cols;

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || "Sheet1");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// ─── PDF EXPORT ─────────────────────────────────────────────

export function exportToPDF(title, columns, rows, filename) {
  const doc = new jsPDF();

  const pageW = doc.internal.pageSize.getWidth();

  // ── Blue header bar ──
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 28, "F");

  // App name
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("MoneyMap", 14, 13);

  // Subtitle
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Personal Finance Tracker", 14, 21);

  // Report title on right
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(title, pageW - 14, 13, { align: "right" });

  // Generated date on right
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`,
    pageW - 14,
    21,
    { align: "right" },
  );

  // ── Table ──
  autoTable(doc, {
    startY: 34,
    head: [columns],
    body: rows,
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
      halign: "left",
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
      halign: "left",
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249],
    },
    columnStyles: {
      1: { halign: "right" }, // Amount column right aligned
    },
    margin: { left: 14, right: 14 },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.1,
  });

  // ── Footer on every page ──
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    const pageH = doc.internal.pageSize.getHeight();

    // Footer line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(14, pageH - 14, pageW - 14, pageH - 14);

    // Left footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.text("Made by Ashutosh | MoneyMap", 14, pageH - 8);

    // Right footer — page number
    doc.text(`Page ${i} of ${pageCount}`, pageW - 14, pageH - 8, {
      align: "right",
    });
  }

  doc.save(`${filename}.pdf`);
}

// ─── PREPARE EXPENSE DATA ────────────────────────────────────

export function prepareExpenseData(expenses) {
  return expenses.map((e) => ({
    Title: e.title,
    Amount: `Rs. ${e.amount.toLocaleString("en-IN")}`,
    Type: e.type === "expense" ? "Expense" : "Income",
    Category: e.category,
    Date: new Date(e.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    Notes: e.notes || "-",
  }));
}

// ─── PREPARE INCOME DATA ─────────────────────────────────────

export function prepareIncomeData(incomes) {
  return incomes.map((e) => ({
    Title: e.title,
    Amount: `Rs. ${e.amount.toLocaleString("en-IN")}`,
    Category: e.category,
    Date: new Date(e.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    Notes: e.notes || "-",
  }));
}

// ─── PREPARE SAVING DATA ─────────────────────────────────────

export function prepareSavingData(savings) {
  return savings.map((e) => ({
    Title: e.title,
    Amount: `Rs. ${e.amount.toLocaleString("en-IN")}`,
    Category: e.category,
    Date: new Date(e.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    Notes: e.notes || "-",
  }));
}
