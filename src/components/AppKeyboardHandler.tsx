/**
 * Wrapper component that wires keyboard navigation configuration once.
 * Renders nothing; only registers the navigation hook.
 */

import type { Extension } from "../types/extension";
import type { Category } from "../constants/categories";
import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation";
import type { KeybindMode, KeybindStatus } from "../keybinds/keybind-types.js";

export type View = "list" | "details" | "search";

export interface AppKeyboardHandlerProps {
  keybindMode: KeybindMode;
  onToggleKeybindMode: () => void;
  onKeybindStatusChange?: (status: KeybindStatus) => void;
  view: View;
  setView: (view: View) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedCategory: Category;
  setSelectedCategory: (cat: Category) => void;
  selectedIndex: number;
  setSelectedIndex: (updater: (prev: number) => number) => void;
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

export function AppKeyboardHandler(props: AppKeyboardHandlerProps) {
  useKeyboardNavigation(props);
  return null;
}
