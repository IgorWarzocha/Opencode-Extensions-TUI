import { renderMarkdown } from './src/utils/markdown';

const testMarkdown = `
# Test Header

This is **bold text** and this is *italic text*.

## Lists

- First item
- Second item
  - Nested item
  - Another nested item

1. Numbered item one
2. Numbered item two

## Code

Here is some \`inline code\` and a code block:

\`\`\`javascript
const test = "hello world";
console.log(test);
\`\`\`

## Links

[GitHub](https://github.com) and **bold links** work too.
`;

console.log('=== MARKDOWN RENDERING TEST ===');
console.log(renderMarkdown(testMarkdown));
console.log('=== END TEST ===');