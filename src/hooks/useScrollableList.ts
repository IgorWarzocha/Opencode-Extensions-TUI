import { useState } from "react";
import { useKeyboard } from "@opentui/react";

interface UseScrollableListProps<T> {
  items: T[];
  height: number;
  initialIndex?: number;
  onSelect?: (item: T) => void;
  onAction?: (action: string, item: T) => void;
}

interface UseScrollableListReturn {
  selectedIndex: number;
  scrollRow: number;
  setSelectedIndex: (index: number | ((prev: number) => number)) => void;
}

/**
 * Hook for managing vertical list navigation and scrolling.
 * Handles Up/Down arrow keys automatically.
 */
export function useScrollableList<T>({ items, height, initialIndex = 0, onSelect, onAction }: UseScrollableListProps<T>): UseScrollableListReturn {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [scrollRow, setScrollRow] = useState(0);

  // Auto-scroll logic
  if (selectedIndex < scrollRow) {
    setScrollRow(selectedIndex);
  } else if (selectedIndex >= scrollRow + height) {
    setScrollRow(selectedIndex - height + 1);
  }

  useKeyboard((key) => {
    if (items.length === 0) return;

    if (key.name === "up") {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.name === "down") {
      setSelectedIndex((prev) => Math.min(items.length - 1, prev + 1));
    } else if (key.name === "return" || key.name === "enter") {
      const item = items[selectedIndex];
      if (onSelect && item !== undefined) onSelect(item);
    } else {
        // Pass other keys to action handler
        const item = items[selectedIndex];
        if (onAction && key.name && item !== undefined) {
            onAction(key.name, item);
        }
    }
  });

  return { selectedIndex, scrollRow, setSelectedIndex };
}
