/**
 * Keybind lookup and matching utilities for app-level navigation.
 * Keeps leader handling and status text centralized for consistent UX.
 */

import type { KeyEvent, KeybindAction, KeybindMode, KeybindSet } from "./keybind-types.js";
import { ocKeybinds } from "./keybinds-oc.js";
import { nvimKeybinds } from "./keybinds-nvim.js";

export type KeybindIndex = {
  chordActions: Map<string, KeybindAction[]>;
  sequences: Array<{ action: KeybindAction; tokens: string[] }>;
};

const MODIFIER_KEYS = new Set(["ctrl", "alt", "shift", "meta"]);
const ENTER_ALIASES = new Set(["enter", "return"]);

const normalizeKeyName = (value: string): string => {
  const lowered = value.toLowerCase();
  if (ENTER_ALIASES.has(lowered)) return "enter";
  return lowered;
};

export const getKeyName = (event: KeyEvent): string => {
  const raw = event.name ?? event.sequence ?? "";
  return normalizeKeyName(raw);
};

const normalizeChord = (parts: string[]): string => {
  const modifiers: string[] = [];
  let key = "";
  for (const part of parts) {
    if (MODIFIER_KEYS.has(part)) {
      modifiers.push(part);
    } else if (part) {
      key = normalizeKeyName(part);
    }
  }
  modifiers.sort((a, b) => a.localeCompare(b));
  return [...modifiers, key].filter(Boolean).join("+");
};

export const formatEventChord = (event: KeyEvent): string | null => {
  const key = getKeyName(event);
  if (!key) return null;
  const parts: string[] = [];
  if (event.ctrl) parts.push("ctrl");
  if (event.alt) parts.push("alt");
  if (event.shift) parts.push("shift");
  if (event.meta) parts.push("meta");
  parts.push(key);
  return normalizeChord(parts);
};

const parseSequenceTokens = (binding: string): string[] => {
  const trimmed = binding.trim();
  if (trimmed.startsWith("<leader>")) {
    const rest = trimmed.replace("<leader>", "").trim();
    return ["<leader>", normalizeKeyName(rest)];
  }
  if (trimmed.includes(" ")) {
    return trimmed
      .split(" ")
      .map((token) => normalizeKeyName(token))
      .filter(Boolean);
  }
  return [normalizeKeyName(trimmed)];
};

export const getKeybindSet = (mode: KeybindMode): KeybindSet => {
  return mode === "nvim" ? nvimKeybinds : ocKeybinds;
};

export const getNextKeybindMode = (mode: KeybindMode): KeybindMode => {
  return mode === "nvim" ? "oc" : "nvim";
};

export const getStatusHelp = (view: "list" | "details" | "search" | "modal", keybinds: KeybindSet): string => {
  return keybinds.helpText[view];
};

export const buildKeybindIndex = (keybinds: KeybindSet): KeybindIndex => {
  const chordActions = new Map<string, KeybindAction[]>();
  const sequences: Array<{ action: KeybindAction; tokens: string[] }> = [];

  for (const [action, bindings] of Object.entries(keybinds.actions) as Array<[KeybindAction, string[]]>) {
    for (const binding of bindings) {
      const trimmed = binding.trim();
      if (!trimmed) continue;

      if (trimmed.includes("+") && !trimmed.includes(" ") && !trimmed.startsWith("<leader>")) {
        const chordKey = normalizeChord(trimmed.toLowerCase().split("+"));
        const existing = chordActions.get(chordKey) ?? [];
        chordActions.set(chordKey, [...existing, action]);
        continue;
      }

      sequences.push({ action, tokens: parseSequenceTokens(trimmed) });
    }
  }

  return { chordActions, sequences };
};

export const isLeaderKey = (event: KeyEvent, keybinds: KeybindSet): boolean => {
  if (!keybinds.leader) return false;
  const chord = formatEventChord(event);
  if (!chord) return false;
  const leaderChord = normalizeChord(keybinds.leader.toLowerCase().split("+"));
  return chord === leaderChord;
};

export const hasModifier = (event: KeyEvent): boolean => {
  return !!(event.ctrl || event.alt || event.shift || event.meta);
};

export const isDigitKey = (event: KeyEvent): boolean => {
  if (hasModifier(event)) return false;
  const key = getKeyName(event);
  return key.length === 1 && key >= "0" && key <= "9";
};

export const extractSequenceToken = (event: KeyEvent): string | null => {
  if (hasModifier(event)) return null;
  const key = getKeyName(event);
  if (!key) return null;
  return key;
};
