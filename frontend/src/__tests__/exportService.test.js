import { describe, test, expect } from "vitest";
import {
  prepareExpenseData,
  prepareIncomeData,
  prepareSavingData,
} from "../services/exportService";

const row = {
  title: "Rent",
  amount: 125000,
  type: "expense",
  category: "Bills",
  date: "2026-10-02T00:00:00.000Z",
  notes: "",
};

describe("export data preparation", () => {
  test("expense rows use Indian number format, readable type, date and '-' for empty notes", () => {
    expect(prepareExpenseData([row])).toEqual([
      {
        Title: "Rent",
        Amount: "Rs. 1,25,000",
        Type: "Expense",
        Category: "Bills",
        Date: "2 Oct 2026",
        Notes: "-",
      },
    ]);
    expect(prepareExpenseData([{ ...row, type: "income" }])[0].Type).toBe("Income");
  });

  test("income and saving rows share the same shape without Type", () => {
    const withNotes = { ...row, notes: "Oct" };
    for (const prep of [prepareIncomeData, prepareSavingData]) {
      const [out] = prep([withNotes]);
      expect(Object.keys(out)).toEqual(["Title", "Amount", "Category", "Date", "Notes"]);
      expect(out.Notes).toBe("Oct");
    }
  });
});
