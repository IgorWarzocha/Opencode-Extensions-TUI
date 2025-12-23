/**
 * Hook for managing extension state including filtering, selection, and view navigation.
 * Handles category filtering, search functionality, and maintains selected extension index.
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

  const categoryMap: Record<Category, string | null> = {
    All: null,
    Featured: null, // handled specially
    Plugins: "Plugins",
    Agents: "Agents",
    Commands: "Commands",
    Tools: "Tools",
    Skills: "Skills",
    Themes: "Themes",
    Bundles: "Bundles",
  };

  const filteredExtensions = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const targetCategory = categoryMap[selectedCategory];
    const isFeatured = selectedCategory === "Featured";

    return extensions.filter((ext) => {
      const matchesCategory =
        targetCategory === null || ext.category === targetCategory;
      const matchesFeatured = !isFeatured || ext.featured;
      const desc = ext.description?.toLowerCase() ?? "";
      const matchesSearch =
        ext.name.toLowerCase().includes(query) || desc.includes(query);
      return matchesCategory && matchesFeatured && matchesSearch;
    });
  }, [extensions, searchQuery, selectedCategory]);

  useEffect(() => {
    if (selectedIndex >= filteredExtensions.length) {
      setSelectedIndex(Math.max(0, filteredExtensions.length - 1));
    }
  }, [filteredExtensions.length, selectedIndex]);

  const currentExtension = filteredExtensions[selectedIndex];

  const updateExtensionStatus = (
    extensionId: string,
    status: ExtensionStatus,
  ) => {
    setExtensions((prev) =>
      prev.map((ext) =>
        String(ext.id) === String(extensionId) ? { ...ext, status } : ext,
      ),
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
