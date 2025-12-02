#!/usr/bin/env bun
import { markdownRenderer } from './src/utils/markdown.ts';

async function testMarkdown() {
  const testMarkdown = `# Test Heading

This is a **bold** text and *italic* text.

## Code Example

\`\`\`javascript
console.log('Hello World');
\`\`\`

- Item 1
- Item 2

[Link text](https://example.com)
`;

  console.log('Testing markdown renderer...');
  const result = await markdownRenderer.render(testMarkdown);
  console.log('Result:');
  console.log(result);
  console.log('Length:', result.length);
}

testMarkdown().catch(console.error);