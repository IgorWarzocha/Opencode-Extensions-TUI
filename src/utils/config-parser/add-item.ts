/**
 * Adds a new item to a JSONC object section while preserving formatting.
 * The helper locates the section block and inserts the entry before the closing brace.
 */

import { findSectionStart, getBraceDelta, splitLines } from "./line-utils.js";

export const addItem = (raw: string, sectionKey: string, key: string, value: unknown): string => {
  const lines = splitLines(raw);
  const startRow = findSectionStart(lines, sectionKey, "{");

  if (startRow === -1) {
    return raw;
  }

  let depth = 1;
  let insertLine = -1;

  for (let i = startRow + 1; i < lines.length; i++) {
    const line = lines[i] ?? "";
    depth += getBraceDelta(line);
    if (depth === 0) {
      insertLine = i;
      break;
    }
  }

  if (insertLine === -1) return raw;

  const indent = "    ";
  const jsonString = JSON.stringify(value, null, 2);
  const indentedValue = jsonString
    .split("\n")
    .map((line, index) => (index === 0 ? line : indent + line))
    .join("\n");
  const newEntry = `\n${indent}"${key}": ${indentedValue}`;

  let needsComma = false;
  let k = insertLine - 1;
  while (k > startRow) {
    const line = (lines[k] ?? "").trim();
    if (line && !line.startsWith("//")) {
      if (!line.endsWith(",") && !line.endsWith("{")) {
        needsComma = true;
      }
      break;
    }
    k--;
  }

  if (needsComma && k >= 0) {
    lines[k] = (lines[k] ?? "") + ",";
  }

  lines.splice(insertLine, 0, newEntry);

  return lines.join("\n");
};
