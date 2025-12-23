/**
 * Parses JSON with Comments (JSONC) and trailing commas.
 * 
 * @param text JSONC string
 * @returns Parsed object
 */
export function parseJSONC(text: string): any {
  if (!text) return {};
  
  // 1. Strip comments
  // Matches strings first (to ignore comments inside strings), then line comments, then block comments
  let stripped = text.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? "" : m);
  
  // 2. Remove trailing commas
  // This is a naive regex approach. It removes commas before closing brackets/braces.
  // It might fail on complex nested structures with specific formatting, but often works for config files.
  // A proper parser is better, but this handles common cases.
  stripped = stripped.replace(/,(\s*[}\]])/g, '$1');
  
  return JSON.parse(stripped);
}
