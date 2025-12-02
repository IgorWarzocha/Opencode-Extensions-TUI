import { SyntaxStyle, parseColor } from "@opentui/core";
import { ocTheme } from "../theme";

export function createSyntaxStyle() {
  return SyntaxStyle.fromStyles({
    // Markdown specific styles
    "markup.heading": { fg: parseColor(ocTheme.primary), bold: true },
    "markup.heading.1": { fg: parseColor(ocTheme.primary), bold: true, underline: true },
    "markup.heading.2": { fg: parseColor(ocTheme.accent), bold: true },
    "markup.heading.3": { fg: parseColor(ocTheme.secondary), bold: true },
    "markup.heading.4": { fg: parseColor(ocTheme.success), bold: true },
    "markup.heading.5": { fg: parseColor(ocTheme.warning), bold: true },
    "markup.heading.6": { fg: parseColor(ocTheme.textMuted), bold: true },
    
    "markup.bold": { fg: parseColor(ocTheme.text), bold: true },
    "markup.italic": { fg: parseColor(ocTheme.text), italic: true },
    "markup.strong": { fg: parseColor(ocTheme.text), bold: true },
    
    "markup.link": { fg: parseColor(ocTheme.secondary), underline: true },
    "markup.link.label": { fg: parseColor(ocTheme.secondary), underline: true },
    "markup.link.url": { fg: parseColor(ocTheme.textMuted), underline: true },
    
    "markup.list": { fg: parseColor(ocTheme.accent) },
    "markup.quote": { fg: parseColor(ocTheme.textMuted), italic: true },
    
    "markup.raw": { fg: parseColor(ocTheme.warning) },
    "markup.raw.block": { fg: parseColor(ocTheme.text), bg: parseColor(ocTheme.element) },
    "markup.raw.inline": { fg: parseColor(ocTheme.warning) },
    
    "punctuation.special": { fg: parseColor(ocTheme.borderActive) },
    
    // General code highlighting (fallback for code blocks)
    keyword: { fg: parseColor(ocTheme.primary), bold: true },
    string: { fg: parseColor(ocTheme.success) },
    comment: { fg: parseColor(ocTheme.textMuted), italic: true },
    function: { fg: parseColor(ocTheme.secondary) },
    number: { fg: parseColor(ocTheme.warning) },
    operator: { fg: parseColor(ocTheme.accent) },
    class: { fg: parseColor(ocTheme.primary) },
    constant: { fg: parseColor(ocTheme.warning) },
    variable: { fg: parseColor(ocTheme.text) },
    property: { fg: parseColor(ocTheme.text) },
    
    default: { fg: parseColor(ocTheme.text) },
  });
}
