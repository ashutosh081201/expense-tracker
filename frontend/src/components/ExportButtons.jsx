import toast from "react-hot-toast";
import {
  exportToExcel,
  exportToPDF,
  prepareExpenseData,
  prepareIncomeData,
  prepareSavingData,
} from "../services/exportService";

function ExportButtons({ data, type, filename }) {
  const handleExcelExport = () => {
    try {
      let prepared = [];
      if (type === "expenses") prepared = prepareExpenseData(data);
      if (type === "income") prepared = prepareIncomeData(data);
      if (type === "savings") prepared = prepareSavingData(data);
      exportToExcel(prepared, filename, type);
      toast.success("Excel file downloaded!");
    } catch (err) {
      toast.error("Failed to export Excel");
      console.error(err);
    }
  };

  const handlePDFExport = () => {
    try {
      let prepared = [];
      let columns = [];
      if (type === "expenses") {
        prepared = prepareExpenseData(data);
        columns = ["Title", "Amount", "Type", "Category", "Date", "Notes"];
      }
      if (type === "income") {
        prepared = prepareIncomeData(data);
        columns = ["Title", "Amount", "Category", "Date", "Notes"];
      }
      if (type === "savings") {
        prepared = prepareSavingData(data);
        columns = ["Title", "Amount", "Category", "Date", "Notes"];
      }
      const rows = prepared.map((row) => columns.map((col) => row[col] || ""));
      const title = type.charAt(0).toUpperCase() + type.slice(1) + " Report";
      exportToPDF(title, columns, rows, filename);
      toast.success("PDF downloaded!");
    } catch (err) {
      toast.error("Failed to export PDF");
      console.error(err);
    }
  };

  if (!data || data.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      {/* Excel */}
      <button
        onClick={handleExcelExport}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "0.4rem 0.75rem",
          borderRadius: "6px",
          border: "1px solid #d1fae5",
          backgroundColor: "#f0fdf4",
          color: "#166534",
          fontSize: "0.8rem",
          fontWeight: "500",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#dcfce7")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "#f0fdf4")
        }
      >
        📊 Excel
      </button>

      {/* PDF */}
      <button
        onClick={handlePDFExport}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "0.4rem 0.75rem",
          borderRadius: "6px",
          border: "1px solid #fee2e2",
          backgroundColor: "#fef2f2",
          color: "#991b1b",
          fontSize: "0.8rem",
          fontWeight: "500",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#fecaca")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "#fef2f2")
        }
      >
        📄 PDF
      </button>
    </div>
  );
}

export default ExportButtons;
