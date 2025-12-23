/**
 * Line utilities for JSONC parsing and editing.
 * These helpers normalize string stripping and depth calculations across parsers.
 */

const STRING_PATTERN = /"[^"\\]*(?:\\.[^"\\]*)*"/g;

export const splitLines = (raw: string): string[] => raw.split("\n");

export const stripStrings = (line: string): string => line.replace(STRING_PATTERN, '""');

export const countMatches = (line: string, pattern: RegExp): number => (line.match(pattern) ?? []).length;

export const getBraceDelta = (line: string): number => {
  const content = stripStrings(line);
  return countMatches(content, /\{/g) - countMatches(content, /\}/g);
};

export const getBraceAndBracketDelta = (line: string): number => {
  const content = stripStrings(line);
  const opens = countMatches(content, /\{/g) + countMatches(content, /\[/g);
  const closes = countMatches(content, /\}/g) + countMatches(content, /\]/g);
  return opens - closes;
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const findSectionStart = (
  lines: string[],
  sectionKey: string,
  opener: "{" | "[",
): number => {
  const sectionRegex = new RegExp(`"${escapeRegExp(sectionKey)}"\\s*:\\s*\\${opener}`);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line && sectionRegex.test(line) && !line.trim().startsWith("//")) {
      return i;
    }
  }
  return -1;
};

export const findBalancedBlockEnd = (lines: string[], startLine: number): number => {
  let depth = 0;
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i] ?? "";
    depth += getBraceAndBracketDelta(line);
    if (depth <= 0) return i;
  }
  return lines.length - 1;
};
