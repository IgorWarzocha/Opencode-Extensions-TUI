import terminalMarkdown from "terminal-markdown";

// Render markdown to ANSI/StyledText for terminal display
export function renderMarkdown(markdown: string): string {
  if (!markdown) return "";
  const width = Math.max(40, Math.min(process.stdout.columns || 80, 120));
  return terminalMarkdown(markdown, { width }).trimEnd();
}

export const markdownRenderer = {
  render: renderMarkdown,
};
