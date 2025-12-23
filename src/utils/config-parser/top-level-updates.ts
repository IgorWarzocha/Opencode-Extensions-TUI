/**
 * Updates top-level keys in JSONC while preserving formatting and comments.
 * This module keeps key replacement logic centralized for config editors.
 */

import { countMatches, getBraceAndBracketDelta, splitLines, stripStrings } from "./line-utils.js";

const buildValueString = (value: unknown, indent: string): string => {
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value, null, 2)
      .split("\n")
      .map((line, idx) => (idx === 0 ? line : indent + line))
      .join("\n");
  }
  return JSON.stringify(value);
};

const findTopLevelInsertLine = (lines: string[]): number => {
  let depth = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const nonStringContent = stripStrings(line);
    const opens = countMatches(nonStringContent, /\{/g);
    const closes = countMatches(nonStringContent, /\}/g);
    depth += opens - closes;
    if (depth === 0 && line.trim().startsWith("}")) {
      return i;
    }
  }
  return -1;
};

const ensureTrailingComma = (lines: string[], insertLine: number): void => {
  let prevLine = insertLine - 1;
  while (prevLine >= 0) {
    const line = (lines[prevLine] ?? "").trim();
    if (line && !line.startsWith("//")) {
      if (!line.endsWith(",") && !line.endsWith("{")) {
        lines[prevLine] = (lines[prevLine] ?? "") + ",";
      }
      break;
    }
    prevLine--;
  }
};

export const updateTopLevelKey = (raw: string, key: string, value: unknown): string => {
  const lines = splitLines(raw);
  const keyRegex = new RegExp(`^(\\s*)("${key}"\\s*:\\s*)(.*)$`);
  let found = false;
  let depth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();

    if (trimmed.startsWith("//")) continue;

    const depthDelta = getBraceAndBracketDelta(line);
    if (depth === 1) {
      const match = line.match(keyRegex);
      if (match) {
        const indent = match[1] ?? "";
        const keyPart = match[2] ?? "";
        const rest = match[3] ?? "";
        const valueStr = buildValueString(value, indent);
        const restTrimmed = rest.trim();

        if (restTrimmed.startsWith("{") || restTrimmed.startsWith("[")) {
          let localDepth = 0;
          let endLine = i;
          for (let j = i; j < lines.length; j++) {
            const jLine = lines[j] ?? "";
            localDepth += getBraceAndBracketDelta(jLine);
            if (localDepth <= 0) {
              endLine = j;
              break;
            }
          }

          const endLineContent = lines[endLine] ?? "";
          const hasComma = endLineContent.trim().endsWith(",");
          const replacement = `${indent}${keyPart}${valueStr}${hasComma ? "," : ""}`;
          lines.splice(i, endLine - i + 1, replacement);
        } else {
          const hasComma = rest.trim().endsWith(",");
          lines[i] = `${indent}${keyPart}${valueStr}${hasComma ? "," : ""}`;
        }

        found = true;
        break;
      }
    }

    depth += depthDelta;
  }

  if (!found) {
    const insertLine = findTopLevelInsertLine(lines);
    if (insertLine >= 0) {
      ensureTrailingComma(lines, insertLine);
      const valueStr = buildValueString(value, "  ");
      lines.splice(insertLine, 0, `  "${key}": ${valueStr}`);
    }
  }

  return lines.join("\n");
};

export const updateTopLevelKeys = (raw: string, updates: Record<string, unknown>): string => {
  let result = raw;
  for (const [key, value] of Object.entries(updates)) {
    result = updateTopLevelKey(result, key, value);
  }
  return result;
};
