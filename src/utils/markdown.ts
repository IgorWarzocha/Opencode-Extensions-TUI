import { bold, italic, dim, underline } from '@opentui/core';

// Convert markdown to OpenTUI template literal format
export function renderMarkdown(markdown: string): string {
  if (!markdown) return '';
  
  let result = markdown;
  
  // Bold text: **text** -> ${bold('text')}
  result = result.replace(/\*\*(.+?)\*\*/g, (_, content) => {
    return `\${bold('${content}')}`;
  });
  
  // Italic text: *text* -> ${italic('text')}
  result = result.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, (_, content) => {
    return `\${italic('${content}')}`;
  });
  
  // Inline code: `code` -> ${dim('code')}
  result = result.replace(/`([^`\n]+)`/g, (_, content) => {
    return `\${dim('${content}')}`;
  });
  
  // Links: [text](url) -> ${underline('text')}${dim('(url)')}
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    return `\${underline('${text}')}\${dim('(${url})')}`;
  });
  
  // Unordered lists: - item -> • item
  result = result.replace(/^- (.+)$/gm, '• $1');
  
  // Ordered lists: 1. item -> 1. item (keep numbering)
  result = result.replace(/^\d+\. (.+)$/gm, (match) => match);
  
  // Blockquotes: > text -> │ text
  result = result.replace(/^> (.+)$/gm, '│ $1');
  
  // Code blocks: ```lang\ncode\n``` -> keep as is for now
  result = result.replace(/```(\w*)\n([\s\S]*?)\n```/g, (_, lang, code) => {
    return `\`\`\`${lang}\n${code}\n\`\`\``;
  });
  
  // Horizontal rules: --- -> ─────────────────────────────────
  result = result.replace(/^---$/gm, '────────────────────────────────');
  
  return result.trim();
}

export const markdownRenderer = {
  render: renderMarkdown,
};