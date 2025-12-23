/**
 * Parses JSONC object sections into config items.
 * The parser tracks nested structures to capture full raw blocks per key.
 */

import type { ConfigItem } from "./types.js";
import { findBalancedBlockEnd, findSectionStart, getBraceDelta, splitLines } from "./line-utils.js";

const scanObjectKeys = (lines: string[], startLine: number, initialDepth = 1): ConfigItem[] => {
  const items: ConfigItem[] = [];
  let depth = initialDepth;
  let i = startLine;

  while (i < lines.length) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();

    if (trimmed === "}" || (trimmed.startsWith("}") && depth === 1)) {
      break;
    }

    const keyRegex = /^(\/\/)?\s*"([^"]+)"\s*:/;
    const match = trimmed.match(keyRegex);

    if (match) {
      const isCommented = !!match[1];
      const keyName = match[2] ?? "";
      const itemStart = i;
      const itemEnd = findBalancedBlockEnd(lines, itemStart);

      items.push({
        key: keyName,
        enabled: !isCommented,
        startLine: itemStart,
        endLine: itemEnd,
        raw: lines.slice(itemStart, itemEnd + 1).join("\n"),
      });

      i = itemEnd + 1;
      continue;
    }

    depth += getBraceDelta(line);
    if (depth <= 0) break;

    i++;
  }

  return items;
};

export const parseObjectSection = (raw: string, sectionKey: string): ConfigItem[] => {
  const lines = splitLines(raw);
  const startRow = findSectionStart(lines, sectionKey, "{");
  if (startRow === -1) return [];

  return scanObjectKeys(lines, startRow + 1, 1);
};
