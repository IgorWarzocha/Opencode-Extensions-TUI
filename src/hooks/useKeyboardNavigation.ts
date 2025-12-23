/**
 * Hook for handling keyboard navigation across the extension management interface.
 * Manages view switching, search input, category navigation, and install/uninstall actions.
 */
import { useKeyboard } from "@opentui/react";
import { useEffect, useRef } from "react";
import { CATEGORIES, type Category } from "../constants/categories";
import type { Extension } from "../types/extension";
import type { KeybindMode, KeybindStatus } from "../keybinds/keybind-types.js";
import {
  buildKeybindIndex,
  extractSequenceToken,
  formatEventChord,
  getKeybindSet,
  hasModifier,
  isDigitKey,
  isLeaderKey,
} from "../keybinds/keybinds.js";

export type View = "list" | "details" | "search";

type SequenceState = {
  buffer: string[];
  lastKeyAt: number;
  leaderActive: boolean;
  leaderAt: number;
  countBuffer: string;
};

type ActionId =
  | "quit"
  | "openSearch"
  | "openDetails"
  | "closeDetails"
  | "install"
  | "uninstall"
  | "refresh"
  | "openConfig"
  | "categoryPrev"
  | "categoryNext"
  | "moveUp"
  | "moveDown"
  | "moveTop"
  | "moveBottom"
  | "toggleKeybindMode";

const VIEW_ACTION_PRIORITY: Record<View, ActionId[]> = {
  list: [
    "openDetails",
    "install",
    "openSearch",
    "categoryPrev",
    "categoryNext",
    "moveUp",
    "moveDown",
    "moveTop",
    "moveBottom",
    "refresh",
    "uninstall",
    "openConfig",
    "toggleKeybindMode",
    "quit",
  ],
  details: [
    "closeDetails",
    "install",
    "openSearch",
    "refresh",
    "openConfig",
    "toggleKeybindMode",
    "quit",
  ],
  search: [
    "openDetails",
    "closeDetails",
    "toggleKeybindMode",
    "quit",
  ],
};

const SEQUENCE_TIMEOUT_MS = 600;
const LEADER_TIMEOUT_MS = 1000;

const resolveActionForView = (view: View, actions: ActionId[]): ActionId | null => {
  if (actions.length === 0) return null;
  for (const candidate of VIEW_ACTION_PRIORITY[view]) {
    if (actions.includes(candidate)) return candidate;
  }
  return actions[0] ?? null;
};

export interface KeyboardNavigationConfig {
  keybindMode: KeybindMode;
  onToggleKeybindMode: () => void;
  onKeybindStatusChange?: (status: KeybindStatus) => void;
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

const buildStatus = (state: SequenceState): KeybindStatus => {
  return {
    leaderActive: state.leaderActive,
    sequence: state.buffer,
    count: state.countBuffer ? Math.max(parseInt(state.countBuffer, 10), 1) : null,
  };
};

const statusEquals = (a: KeybindStatus, b: KeybindStatus): boolean => {
  if (a.leaderActive !== b.leaderActive) return false;
  if (a.count !== b.count) return false;
  if (a.sequence.length !== b.sequence.length) return false;
  return a.sequence.every((value, index) => value === b.sequence[index]);
};

export function useKeyboardNavigation(config: KeyboardNavigationConfig) {
  const configRef = useRef(config);
  const stateRef = useRef<SequenceState>({
    buffer: [],
    lastKeyAt: 0,
    leaderActive: false,
    leaderAt: 0,
    countBuffer: "",
  });
  const statusRef = useRef<KeybindStatus>(buildStatus(stateRef.current));

  useEffect(() => {
    configRef.current = config;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const { onKeybindStatusChange } = configRef.current;
      if (!onKeybindStatusChange) return;

      const now = Date.now();
      const state = stateRef.current;
      let changed = false;

      if (state.leaderActive && now - state.leaderAt > LEADER_TIMEOUT_MS) {
        state.leaderActive = false;
        changed = true;
      }

      if (now - state.lastKeyAt > SEQUENCE_TIMEOUT_MS && state.buffer.length > 0) {
        state.buffer = [];
        state.countBuffer = "";
        changed = true;
      }

      if (changed) {
        const nextStatus = buildStatus(state);
        if (!statusEquals(nextStatus, statusRef.current)) {
          statusRef.current = nextStatus;
          onKeybindStatusChange(nextStatus);
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  useKeyboard(async (key) => {
    const {
      keybindMode,
      onToggleKeybindMode,
      onKeybindStatusChange,
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

    if (isBlocked) return;
    void selectedIndex;

    const keybinds = getKeybindSet(keybindMode);
    const keybindIndex = buildKeybindIndex(keybinds);
    const now = Date.now();
    const state = stateRef.current;

    const updateStatus = () => {
      if (!onKeybindStatusChange) return;
      const nextStatus = buildStatus(state);
      if (!statusEquals(nextStatus, statusRef.current)) {
        statusRef.current = nextStatus;
        onKeybindStatusChange(nextStatus);
      }
    };

    const clearState = () => {
      state.buffer = [];
      state.countBuffer = "";
      state.leaderActive = false;
    };

    const handleAction = async (action: ActionId, count: number) => {
      if (action === "toggleKeybindMode") {
        onToggleKeybindMode();
        return;
      }

      if (action === "openConfig") {
        onOpenConfig();
        return;
      }

      if (action === "quit") {
        process.exit(0);
        return;
      }

      if (view === "search") {
        if (action === "openDetails" || action === "closeDetails") {
          setView("list");
        }
        return;
      }

      if (action === "openDetails") {
        if (view === "list") {
          setDetailsExtension(currentExtension ?? null);
          setView("details");
        }
        return;
      }

      if (action === "closeDetails") {
        if (view === "details") {
          setView("list");
        }
        return;
      }

      if (action === "install") {
        const target = view === "details" ? detailsExtension : currentExtension;
        if (target && target.status === "available") {
          await onInstall(target);
        }
        return;
      }

      if (action === "uninstall") {
        if (currentExtension && currentExtension.status === "installed") {
          await onUninstall(currentExtension);
        }
        return;
      }

      if (action === "refresh") {
        await reloadExtensions();
        return;
      }

      if (action === "openSearch") {
        setView("search");
        return;
      }

      if (action === "categoryPrev") {
        const currentCatIndex = CATEGORIES.indexOf(selectedCategory);
        const prevCatIndex = (currentCatIndex - 1 + CATEGORIES.length) % CATEGORIES.length;
        const prevCat = CATEGORIES[prevCatIndex] ?? "All";
        setSelectedCategory(prevCat);
        setSelectedIndex(() => 0);
        return;
      }

      if (action === "categoryNext") {
        const currentCatIndex = CATEGORIES.indexOf(selectedCategory);
        const nextCatIndex = (currentCatIndex + 1) % CATEGORIES.length;
        const nextCat = CATEGORIES[nextCatIndex] ?? "All";
        setSelectedCategory(nextCat);
        setSelectedIndex(() => 0);
        return;
      }

      if (action === "moveUp") {
        setSelectedIndex((prev) => Math.max(prev - count, 0));
        return;
      }

      if (action === "moveDown") {
        setSelectedIndex((prev) => Math.min(prev + count, filteredExtensions.length - 1));
        return;
      }

      if (action === "moveTop") {
        setSelectedIndex(() => 0);
        return;
      }

      if (action === "moveBottom") {
        setSelectedIndex(() => Math.max(filteredExtensions.length - 1, 0));
        return;
      }
    };

    if (now - state.lastKeyAt > SEQUENCE_TIMEOUT_MS) {
      state.buffer = [];
    }

    if (state.leaderActive && now - state.leaderAt > LEADER_TIMEOUT_MS) {
      state.leaderActive = false;
    }

    if (isLeaderKey(key, keybinds)) {
      state.leaderActive = true;
      state.leaderAt = now;
      state.buffer = [];
      state.lastKeyAt = now;
      updateStatus();
      return;
    }

    if (view === "search") {
      if (key.name === "escape") {
        setView("list");
        clearState();
        state.lastKeyAt = now;
        updateStatus();
        return;
      }
      if (key.name === "return" || key.name === "enter") {
        setView("list");
        clearState();
        state.lastKeyAt = now;
        updateStatus();
        return;
      }
      if (key.name === "backspace") {
        setSearchQuery(searchQuery.slice(0, -1));
        state.lastKeyAt = now;
        return;
      }
      if (!hasModifier(key) && key.sequence && key.sequence.length === 1) {
        setSearchQuery(searchQuery + key.sequence);
        state.lastKeyAt = now;
        return;
      }
    }

    if (isDigitKey(key) && !state.leaderActive && state.buffer.length === 0) {
      state.countBuffer += key.sequence ?? key.name ?? "";
      state.lastKeyAt = now;
      updateStatus();
      return;
    }

    const leaderToken = state.leaderActive ? "<leader>" : null;

    const chord = formatEventChord(key);
    if (chord && hasModifier(key)) {
      const actions = keybindIndex.chordActions.get(chord) ?? [];
      const resolved = resolveActionForView(view, actions as ActionId[]);
      const count = state.countBuffer ? Math.max(parseInt(state.countBuffer, 10), 1) : 1;
      clearState();
      state.lastKeyAt = now;
      updateStatus();
      if (resolved) {
        await handleAction(resolved, count);
      }
      return;
    }

    const token = extractSequenceToken(key);
    if (!token) {
      clearState();
      state.lastKeyAt = now;
      updateStatus();
      return;
    }

    const nextBuffer = [...state.buffer];
    if (leaderToken && nextBuffer.length === 0) {
      nextBuffer.push(leaderToken);
    }
    nextBuffer.push(token);

    const possibleSequences = keybindIndex.sequences.filter((sequence) => {
      return sequence.tokens.slice(0, nextBuffer.length).every((value, index) => value === nextBuffer[index]);
    });

    if (possibleSequences.length === 0) {
      clearState();
      state.lastKeyAt = now;
      updateStatus();
      return;
    }

    const completed = possibleSequences.filter((sequence) => sequence.tokens.length === nextBuffer.length);
    if (completed.length === 0) {
      state.buffer = nextBuffer;
      state.lastKeyAt = now;
      updateStatus();
      return;
    }

    const actions = completed.map((sequence) => sequence.action) as ActionId[];
    const resolved = resolveActionForView(view, actions);
    const count = state.countBuffer ? Math.max(parseInt(state.countBuffer, 10), 1) : 1;

    clearState();
    state.lastKeyAt = now;
    updateStatus();

    if (resolved) {
      await handleAction(resolved, count);
    }
  });
}
