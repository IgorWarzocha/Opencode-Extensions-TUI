/**
 * OC (opencode-style) keybind definitions for the extension browser.
 * Aligns with opencode defaults where possible while retaining current app shortcuts.
 */

import type { KeybindSet } from "./keybind-types.js";

export const ocKeybinds: KeybindSet = {
  id: "oc",
  label: "OC",
  leader: "ctrl+x",
  actions: {
    quit: ["ctrl+c", "ctrl+q", "<leader>q"],
    openSearch: ["/", "ctrl+f"],
    openDetails: ["o"],
    closeDetails: ["escape", "backspace"],
    install: ["enter"],
    uninstall: ["u", "delete"],
    refresh: ["r"],
    openConfig: ["<leader>e", "ctrl+e"],
    categoryPrev: ["left", "shift+tab"],
    categoryNext: ["right", "tab"],
    moveUp: ["up"],
    moveDown: ["down"],
    moveTop: ["home"],
    moveBottom: ["end"],
    toggleKeybindMode: ["ctrl+g", "<leader>k"],
  },
  helpText: {
    list:
      "[↑/↓] Navigate  [Enter] Install  [o] Details  [←/→] Category  [/] Search  [r] Refresh  [u] Uninstall  [Ctrl+e] Config  [Ctrl+c] Quit  [Ctrl+x] Leader",
    details: "[Enter] Install  [Esc] Back  [Ctrl+c] Quit",
    search: "[Enter] Back  [Esc] Cancel",
    modal: "[Enter] Execute • [Esc] Cancel",
  },
};
