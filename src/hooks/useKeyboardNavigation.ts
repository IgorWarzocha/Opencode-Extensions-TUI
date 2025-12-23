/**
 * Hook for handling keyboard navigation across the extension management interface.
 * Manages view switching, search input, category navigation, and install/uninstall actions.
 */
import { useKeyboard } from "@opentui/react";
import { useRef, useEffect } from "react";
import { appendFileSync } from "fs";
import { CATEGORIES, type Category } from "../constants/categories";
import type { Extension } from "../types/extension";

const DEBUG_FILE = "/tmp/extensionstui-debug.log";
function debug(msg: string, data?: unknown) {
  const line = `[${new Date().toISOString()}] ${msg}${data ? " " + JSON.stringify(data) : ""}\n`;
  appendFileSync(DEBUG_FILE, line);
}

export type View = "list" | "details" | "search";

export interface KeyboardNavigationConfig {
  view: View;
  setView: (next: View) => void;
  searchQuery: string;
  setSearchQuery: (next: string) => void;
  selectedCategory: Category;
  setSelectedCategory: (next: Category) => void;
  selectedIndex: number;
  setSelectedIndex: (next: (prev: number) => number) => void;
  filteredExtensions: Extension[];
  currentExtension?: Extension | null;
  detailsExtension?: Extension | null;
  setDetailsExtension: (ext: Extension | null) => void;
  onInstall: (ext: Extension) => Promise<void>;
  onUninstall: (ext: Extension) => Promise<void>;
  reloadExtensions: () => Promise<void>;
  onOpenConfig: () => void;
  /** When true, keyboard navigation is blocked (e.g., modal is open) */
  isBlocked?: boolean;
}

export function useKeyboardNavigation(config: KeyboardNavigationConfig) {
  // Use a ref to always access the latest config, avoiding stale closures
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  });

  useKeyboard(async (key) => {
    const {
      view,
      setView,
      searchQuery,
      setSearchQuery,
      selectedCategory,
      setSelectedCategory,
      selectedIndex,
      setSelectedIndex,
      filteredExtensions,
      currentExtension,
      detailsExtension,
      setDetailsExtension,
      onInstall,
      onUninstall,
      reloadExtensions,
      onOpenConfig,
      isBlocked,
    } = configRef.current;

    // Skip all navigation when blocked (e.g., modal is open)
    if (isBlocked) return;

    // selectedIndex is read via callbacks above; keep for completeness
    void selectedIndex;

    if (view === "search") {
      if (key.name === "return") {
        setView("list");
      } else if (key.name === "backspace") {
        setSearchQuery(searchQuery.slice(0, -1));
      } else if (key.sequence && key.sequence.length === 1) {
        setSearchQuery(searchQuery + key.sequence);
      } else if (key.name === "escape") {
        setView("list");
      }
      return;
    }

    if (view === "details") {
      if (key.name === "q") {
        process.exit(0);
      }
      if (key.name === "i" || key.name === "escape") {
        setView("list");
        return;
      }
      if (key.name === "return" && detailsExtension && detailsExtension.status === "available") {
        await onInstall(detailsExtension);
      }
      return;
    }

    if (key.name === "a" || key.name === "j" || key.name === "left") {
      const currentCatIndex = CATEGORIES.indexOf(selectedCategory);
      const prevCatIndex = (currentCatIndex - 1 + CATEGORIES.length) % CATEGORIES.length;
      const prevCat = CATEGORIES[prevCatIndex] ?? "All";
      setSelectedCategory(prevCat);
      setSelectedIndex(() => 0);
      return;
    }
    if (key.name === "d" || key.name === "k" || key.name === "right") {
      const currentCatIndex = CATEGORIES.indexOf(selectedCategory);
      const nextCatIndex = (currentCatIndex + 1) % CATEGORIES.length;
      const nextCat = CATEGORIES[nextCatIndex] ?? "All";
      setSelectedCategory(nextCat);
      setSelectedIndex(() => 0);
      return;
    }

    switch (key.name) {
      case "q":
        process.exit(0);
      case "s":
      case "l":
      case "down":
        setSelectedIndex((prev) => Math.min(prev + 1, filteredExtensions.length - 1));
        break;
      case "w":
      case "o":
      case "up":
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "tab": {
        const currentCatIndex = CATEGORIES.indexOf(selectedCategory);
        const nextCatIndex = (currentCatIndex + 1) % CATEGORIES.length;
        const nextCat = CATEGORIES[nextCatIndex] ?? "All";
        setSelectedCategory(nextCat);
        setSelectedIndex(() => 0);
        break;
      }
      case "i":
        if (view === "list") {
          setDetailsExtension(currentExtension ?? null);
          setView("details");
        } else {
          setView("list");
        }
        break;
      case "return":
        debug("Enter pressed", {
          hasCurrentExtension: !!currentExtension,
          extensionName: currentExtension?.name,
          extensionStatus: currentExtension?.status,
          installMethod: currentExtension?.install_method,
          installCommand: currentExtension?.install_command,
        });
        if (currentExtension && currentExtension.status === "available") {
          debug("Calling onInstall...");
          await onInstall(currentExtension);
          debug("onInstall completed");
        } else {
          debug("Skipped install - condition not met");
        }
        break;
      case "u":
        if (currentExtension && currentExtension.status === "installed") {
          await onUninstall(currentExtension);
        }
        break;
      case "r":
        await reloadExtensions();
        break;
      case "/":
        setView("search");
        break;
      case "e":
        if (key.ctrl) {
           onOpenConfig();
        }
        break;
      default:
        break;
    }
  });
}
