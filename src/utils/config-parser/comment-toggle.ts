/**
 * Comment toggling helpers for JSONC lines and blocks.
 * These functions preserve indentation and avoid touching empty lines.
 */

import { splitLines } from "./line-utils.js";

const uncommentLine = (line: string): string => line.replace(/\/\/\s?/, "");

const commentLine = (line: string): string => {
  const indentMatch = line.match(/^\s*/);
  const indent = indentMatch ? indentMatch[0] : "";
  const content = line.slice(indent.length);
  if (content.startsWith("//")) return line;
  return `${indent}// ${content}`;
};

export const toggleLine = (raw: string, lineIndex: number, enable: boolean): string => {
  const lines = splitLines(raw);
  if (lineIndex < 0 || lineIndex >= lines.length) return raw;

  const line = lines[lineIndex] ?? "";
  const trimmed = line.trim();

  if (enable) {
    if (trimmed.startsWith("//")) {
      lines[lineIndex] = uncommentLine(line);
    }
  } else {
    lines[lineIndex] = commentLine(line);
  }

  return lines.join("\n");
};

export const toggleBlock = (
  raw: string,
  startLine: number,
  endLine: number,
  enable: boolean,
): string => {
  const lines = splitLines(raw);
  for (let i = startLine; i <= endLine; i++) {
    const line = lines[i] ?? "";
    if (line.trim().length === 0) continue;

    if (enable) {
      if (line.trim().startsWith("//")) {
        lines[i] = uncommentLine(line);
      }
    } else {
      lines[i] = commentLine(line);
    }
  }

  return lines.join("\n");
};
