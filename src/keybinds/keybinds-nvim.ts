/**
 * NVIM keybind definitions for vim-style navigation across the app.
 * Keeps the same actions as OC mode while favoring hjkl and vim habits.
 */

import type { KeybindSet } from "./keybind-types.js";

export const nvimKeybinds: KeybindSet = {
  id: "nvim",
  label: "NVIM",
  actions: {
    quit: ["q", "ctrl+c"],
    openSearch: ["/"],
    openDetails: ["o"],
    closeDetails: ["h", "escape"],
    install: ["enter", "i"],
    uninstall: ["u"],
    refresh: ["r"],
    openConfig: ["ctrl+e"],
    categoryPrev: ["h"],
    categoryNext: ["l"],
    moveUp: ["k"],
    moveDown: ["j"],
    moveTop: ["g g"],
    moveBottom: ["shift+g"],
    toggleKeybindMode: ["ctrl+g"],
  },
  helpText: {
    list:
      "[j/k] Navigate  [gg/G] Top/Bottom  [Enter/i] Install  [o] Details  [h/l] Category  [/] Search  [r] Refresh  [u] Uninstall  [Ctrl+e] Config  [q] Quit",
    details: "[Enter/i] Install  [h/Esc] Back  [q] Quit",
    search: "[Enter] Back  [Esc] Cancel",
    modal: "[Enter] Execute • [Esc] Cancel",
  },
};
