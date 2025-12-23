/**
 * Keybind type definitions for mapping keyboard input to app actions.
 * These types keep keybind configuration data-driven and easy to edit.
 */

export type KeybindMode = "oc" | "nvim";

export type KeybindAction =
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

export type KeybindSet = {
  id: KeybindMode;
  label: string;
  leader?: string;
  actions: Record<KeybindAction, string[]>;
  helpText: {
    list: string;
    details: string;
    search: string;
    modal: string;
  };
};

export type KeyEvent = {
  name?: string;
  sequence?: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
};

export type KeybindStatus = {
  leaderActive: boolean;
  sequence: string[];
  count: number | null;
};
