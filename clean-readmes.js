#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const detailsDir = '/home/igorw/Work/extensionstui/opencode-directory/details';

function extractMetadata(content) {
  const lines = content.split('\n');
  const metadata = {};
  
  lines.forEach(line => {
    if (line.startsWith('**Description:**')) {
      metadata.description = line.replace('**Description:**', '').trim();
    } else if (line.startsWith('**Repository:**')) {
      const urlMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (urlMatch) {
        metadata.repository_url = urlMatch[2];
      }
    } else if (line.startsWith('**Author:**')) {
      const authorMatch = line.match(/\[([^\]]+)\]\(([^)]+)\) \(([^)]+)\)/);
      if (authorMatch) {
        metadata.author = authorMatch[1];
        metadata.author_url = authorMatch[2];
      }
    } else if (line.startsWith('**Language:**')) {
      metadata.language = line.replace('**Language:**', '').trim();
    } else if (line.startsWith('**License:**')) {
      metadata.license = line.replace('**License:**', '').trim();
    } else if (line.startsWith('**Stars:**')) {
      const starsMatch = line.match(/\*\*Stars:\*\* (\d+)/);
      if (starsMatch) {
        metadata.star_count = parseInt(starsMatch[1]);
      }
    } else if (line.startsWith('**Topics:**')) {
      const topics = line.match(/`([^`]+)`/g);
      if (topics) {
        metadata.keywords = topics.map(t => t.replace(/`/g, ''));
      }
    }
  });
  
  return metadata;
}

function findReadmeStart(lines) {
  return lines.findIndex(line => line.includes('## README'));
}

function findLastSeparator(lines) {
  let lastIndex = -1;
  lines.forEach((line, index) => {
    if (line.trim() === '---') {
      lastIndex = index;
    }
  });
  return lastIndex;
}

function processReadme(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  // Extract metadata from headers
  const headerContent = lines.slice(0, lines.findIndex(line => line.includes('---'))).join('\n');
  const metadata = extractMetadata(headerContent);
  
  // Find actual README content
  const readmeStart = findReadmeStart(lines);
  if (readmeStart === -1) return;
  
  const readmeLines = lines.slice(readmeStart + 1);
  const lastSeparator = findLastSeparator(readmeLines);
  
  let actualContent;
  if (lastSeparator > 0) {
    actualContent = readmeLines.slice(0, lastSeparator).join('\n').trim();
  } else {
    actualContent = readmeLines.join('\n').trim();
  }
  
  // Create YAML frontmatter
  const yamlFrontmatter = `---
name: ${path.basename(filePath, '.md')}
description: ${metadata.description || ''}
repository_url: ${metadata.repository_url || ''}
author: ${metadata.author || ''}
author_url: ${metadata.author_url || ''}
language: ${metadata.language || ''}
license: ${metadata.license || ''}
star_count: ${metadata.star_count || 0}
keywords: [${metadata.keywords ? metadata.keywords.map(k => `"${k}"`).join(', ') : ''}]
---

`;
  
  // Write cleaned file
  const cleanedContent = yamlFrontmatter + actualContent;
  fs.writeFileSync(filePath, cleanedContent, 'utf8');
  
  console.log(`Processed: ${path.basename(filePath)}`);
}

// Process all README files
fs.readdirSync(detailsDir).forEach(file => {
  if (file.endsWith('.md')) {
    processReadme(path.join(detailsDir, file));
  }
});

console.log('README cleanup complete!');