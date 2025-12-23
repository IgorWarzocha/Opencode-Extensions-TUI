/**
 * Parses JSONC array sections into config items.
 * The scanner preserves raw line positions for toggle and edit operations.
 */

import type { ConfigItem } from "./types.js";
import { findSectionStart, splitLines } from "./line-utils.js";

export const parseArraySection = (raw: string, sectionKey: string): ConfigItem[] => {
  const lines = splitLines(raw);
  const items: ConfigItem[] = [];

  const startRow = findSectionStart(lines, sectionKey, "[");
  if (startRow === -1) return [];

  let i = startRow + 1;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();

    if (trimmed.startsWith("]")) {
      break;
    }

    if (!trimmed || (trimmed.startsWith("//") && !trimmed.includes('"'))) {
      i++;
      continue;
    }

    const itemRegex = /^(\/\/)?\s*"([^"]+)"/;
    const match = trimmed.match(itemRegex);

    if (match) {
      const isCommented = !!match[1];
      const content = match[2] ?? "";

      items.push({
        key: content,
        enabled: !isCommented,
        startLine: i,
        endLine: i,
        raw: line,
      });
    }

    i++;
  }

  return items;
};
