/**
 * Markdown rendering helper. Currently unused in the app; kept as a thin
 * wrapper to avoid pulling in external dependencies. Returns the input
 * unchanged so downstream callers can decide rendering strategy.
 */
export function renderMarkdown(markdown: string): string {
  return markdown;
}

export default {
  render: renderMarkdown,
};

