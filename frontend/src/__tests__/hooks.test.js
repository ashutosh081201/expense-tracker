import { describe, test, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useSearch from "../hooks/useSearch";
import usePagination from "../hooks/usePagination";
import useBulkSelect from "../hooks/useBulkSelect";

const items = Array.from({ length: 23 }, (_, i) => ({
  _id: `id${i}`,
  title: i % 2 ? `Lunch ${i}` : `Fuel ${i}`,
  category: i % 2 ? "Food" : "Fuel",
  amount: i * 100,
}));

describe("useSearch", () => {
  test("empty query returns everything", () => {
    const { result } = renderHook(() => useSearch(items, ["title"]));
    expect(result.current.filtered).toHaveLength(23);
  });

  test("case-insensitive match across the given fields only", () => {
    const fields = ["title", "category"];
    const { result } = renderHook(() => useSearch(items, fields));
    act(() => result.current.setSearchQuery("  FOOD "));
    // whitespace-only queries are ignored, but padded queries are not trimmed
    expect(result.current.filtered).toHaveLength(0);
    act(() => result.current.setSearchQuery("food"));
    expect(result.current.filtered).toHaveLength(11);
    act(() => result.current.setSearchQuery("   "));
    expect(result.current.filtered).toHaveLength(23);
  });

  test("numbers are searchable via toString", () => {
    const { result } = renderHook(() => useSearch(items, ["amount"]));
    act(() => result.current.setSearchQuery("2200"));
    expect(result.current.filtered.map((i) => i._id)).toEqual(["id22"]);
  });
});

describe("usePagination", () => {
  test("splits into pages of 10 and moves between them", () => {
    const { result } = renderHook(() => usePagination(items, 10));
    expect(result.current.totalPages).toBe(3);
    expect(result.current.paginated[0]._id).toBe("id0");
    act(() => result.current.setCurrentPage(3));
    expect(result.current.paginated.map((i) => i._id)).toEqual(["id20", "id21", "id22"]);
    act(() => result.current.resetPage());
    expect(result.current.currentPage).toBe(1);
  });

  test("empty list has zero pages", () => {
    const { result } = renderHook(() => usePagination([], 10));
    expect(result.current.totalPages).toBe(0);
    expect(result.current.paginated).toEqual([]);
  });
});

describe("useBulkSelect", () => {
  const page1 = items.slice(0, 10);
  const page2 = items.slice(10, 20);

  test("toggleOne adds and removes", () => {
    const { result } = renderHook(() => useBulkSelect(items, page1));
    act(() => result.current.toggleOne("id3"));
    expect(result.current.isSelected("id3")).toBe(true);
    act(() => result.current.toggleOne("id3"));
    expect(result.current.selected).toEqual([]);
  });

  test("toggleAll selects/deselects only the current page and keeps other pages", () => {
    const { result, rerender } = renderHook(({ page }) => useBulkSelect(items, page), {
      initialProps: { page: page1 },
    });
    act(() => result.current.toggleAll());
    expect(result.current.selected).toHaveLength(10);
    expect(result.current.isAllSelected).toBe(true);

    rerender({ page: page2 });
    expect(result.current.isAllSelected).toBe(false);
    act(() => result.current.toggleAll());
    expect(result.current.selected).toHaveLength(20);

    act(() => result.current.toggleAll()); // deselect page 2 only
    expect(result.current.selected).toEqual(page1.map((i) => i._id));

    act(() => result.current.clearSelected());
    expect(result.current.selected).toEqual([]);
  });
});
