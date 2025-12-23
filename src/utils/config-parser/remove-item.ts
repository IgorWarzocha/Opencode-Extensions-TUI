/**
 * Removes a contiguous item block from JSONC content.
 * Keeps the rest of the content untouched while preserving line order.
 */

import { splitLines } from "./line-utils.js";

export const removeItem = (raw: string, startLine: number, endLine: number): string => {
  const lines = splitLines(raw);
  lines.splice(startLine, endLine - startLine + 1);
  return lines.join("\n");
};
