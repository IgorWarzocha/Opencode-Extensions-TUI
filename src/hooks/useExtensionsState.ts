/**
 * Extension state management hook for filtering and view selection.
 * Provides category/search filtering, selection, and status updates in one place.
 */
import { useEffect, useMemo, useState } from "react";
import type { Category } from "../constants/categories";
import type { Extension, ExtensionStatus } from "../types/extension";

type View = "list" | "details" | "search";

export function useExtensionsState(initialExtensions: Extension[]) {
  const [extensions, setExtensions] = useState<Extension[]>(initialExtensions);
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<View>("list");
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setExtensions(initialExtensions);
  }, [initialExtensions]);

  const filteredExtensions = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return extensions.filter((ext) => {
      const matchesCategory =
        selectedCategory === "All" ||
        ext.category === selectedCategory ||
        (selectedCategory === "Featured" && ext.featured);
      const desc = ext.description?.toLowerCase() ?? "";
      const matchesSearch =
        ext.name.toLowerCase().includes(query) ||
        desc.includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [extensions, searchQuery, selectedCategory]);

  useEffect(() => {
    if (selectedIndex >= filteredExtensions.length) {
      setSelectedIndex(Math.max(0, filteredExtensions.length - 1));
    }
  }, [filteredExtensions.length, selectedIndex]);

  const currentExtension = filteredExtensions[selectedIndex];

  const updateExtensionStatus = (extensionId: number, status: ExtensionStatus) => {
    setExtensions((prev) =>
      prev.map((ext) => (ext.id === extensionId ? { ...ext, status } : ext))
    );
  };

  return {
    extensions,
    setExtensions,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    view,
    setView,
    selectedIndex,
    setSelectedIndex,
    filteredExtensions,
    currentExtension,
    updateExtensionStatus,
  };
}
