/**
 * JSON/JSONC utilities using Prettier for formatting and validation.
 * Provides proper error messages with line/column info and preserves comments.
 */

import * as prettier from "prettier";

export type JsonParseResult =
  | { success: true; data: unknown }
  | { success: false; error: string; line: number; column: number };

export type JsonFormatResult =
  | { success: true; formatted: string }
  | { success: false; error: string; line: number; column: number };

/**
 * Formats JSONC content using Prettier.
 * Preserves comments and fixes formatting issues.
 *
 * @param text JSONC string to format
 * @returns Formatted string or error with location
 */
export async function formatJSONC(text: string): Promise<JsonFormatResult> {
  try {
    const formatted = await prettier.format(text, {
      parser: "jsonc",
      tabWidth: 2,
      useTabs: false,
    });
    return { success: true, formatted };
  } catch (e) {
    if (e instanceof SyntaxError && "loc" in e) {
      const loc = e.loc as { start: { line: number; column: number } };
      return {
        success: false,
        error: e.message.split("\n")[0] ?? "Syntax error",
        line: loc.start.line,
        column: loc.start.column,
      };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
      line: 1,
      column: 1,
    };
  }
}

/**
 * Validates JSONC content using Prettier's parser.
 * Does not modify content, just checks for errors.
 *
 * @param text JSONC string to validate
 * @returns Success or error with location
 */
export async function validateJSONC(text: string): Promise<JsonParseResult> {
  try {
    // Use prettier.format as validation - if it succeeds, JSON is valid
    await prettier.format(text, { parser: "jsonc" });
    // Parse to get the data
    const data = parseJSONCSync(text);
    return { success: true, data };
  } catch (e) {
    if (e instanceof SyntaxError && "loc" in e) {
      const loc = e.loc as { start: { line: number; column: number } };
      return {
        success: false,
        error: e.message.split("\n")[0] ?? "Syntax error",
        line: loc.start.line,
        column: loc.start.column,
      };
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : "Unknown error",
      line: 1,
      column: 1,
    };
  }
}

/**
 * Synchronous JSONC parser (strips comments and trailing commas).
 * Use for quick parsing when you don't need validation.
 */
export function parseJSONCSync(text: string): any {
  if (!text || !text.trim()) return {};

  // Strip comments (preserve strings)
  let stripped = text.replace(
    /\\"|"(?:\\"|[^"])*"|(\/{2}.*|\/\*[\s\S]*?\*\/)/g,
    (m, g) => (g ? "" : m)
  );
  // Strip trailing commas
  stripped = stripped.replace(/,(\s*[}\]])/g, "$1");

  return JSON.parse(stripped);
}

/**
 * Legacy sync parseJSONC for backward compatibility.
 * @deprecated Use parseJSONCSync or validateJSONC instead
 */
export function parseJSONC(text: string): any {
  return parseJSONCSync(text);
}

/**
 * Formats a JSON error for display.
 */
export function formatJsonError(
  result: JsonParseResult | JsonFormatResult
): string {
  if (result.success) return "";
  return `Ln ${result.line}, Col ${result.column}: ${result.error}`;
}
