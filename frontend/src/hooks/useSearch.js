import { useState, useMemo } from "react";

function useSearch(items, searchFields) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((item) =>
      searchFields.some((field) =>
        item[field]?.toString().toLowerCase().includes(query),
      ),
    );
  }, [items, searchQuery, searchFields]);

  return { searchQuery, setSearchQuery, filtered };
}

export default useSearch;
