import { useState } from "react";

function useBulkSelect(allItems, pageItems) {
  const [selected, setSelected] = useState([]);

  const toggleOne = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  // Toggle only current PAGE items
  const toggleAll = () => {
    const pageIds = (pageItems || allItems).map((i) => i._id);
    const allPageSelected = pageIds.every((id) => selected.includes(id));
    if (allPageSelected) {
      setSelected((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelected((prev) => {
        const newSelected = [...prev];
        pageIds.forEach((id) => {
          if (!newSelected.includes(id)) newSelected.push(id);
        });
        return newSelected;
      });
    }
  };

  const clearSelected = () => setSelected([]);
  const isSelected = (id) => selected.includes(id);

  const currentPageItems = pageItems || allItems;
  const isAllSelected =
    currentPageItems.length > 0 &&
    currentPageItems.every((item) => selected.includes(item._id));

  return {
    selected,
    toggleOne,
    toggleAll,
    clearSelected,
    isSelected,
    isAllSelected,
  };
}

export default useBulkSelect;
