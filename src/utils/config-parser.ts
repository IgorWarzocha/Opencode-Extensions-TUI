/**
 * Advanced JSONC parser/manipulator for Opencode configuration.
 * Handles extracting lists/objects and toggling comments while preserving formatting.
 */

export interface ConfigItem {
  key: string; // The plugin name or object key
  enabled: boolean;
  startLine: number; // 0-indexed line number in the raw text
  endLine: number;
  raw: string; // The full raw text of this entry
}

/**
 * Extracts items from a JSONC array (e.g., "plugin": [ ... ])
 */
export function parseArraySection(raw: string, sectionKey: string): ConfigItem[] {
  const lines = raw.split('\n');
  const items: ConfigItem[] = [];
  
  // 1. Find the section start "key": [
  const sectionRegex = new RegExp(`"${sectionKey}"\\s*:\\s*\\[`);
  let startRow = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line && sectionRegex.test(line) && !line.trim().startsWith('//')) {
      startRow = i;
      break;
    }
  }
  
  if (startRow === -1) return [];

  // 2. Scan content until ]
  let inSection = true;
  let i = startRow + 1;
  
  while (inSection && i < lines.length) {
    const line = lines[i] || "";
    const trimmed = line.trim();
    
    // Check for end of array
    if (trimmed.startsWith(']')) {
      inSection = false;
      break;
    }
    
    // Skip empty lines or pure comments that aren't commented-out strings
    if (!trimmed || (trimmed.startsWith('//') && !trimmed.includes('"'))) {
      i++;
      continue;
    }

    // Match string item: "item" or // "item"
    // Capture groups: 1=CommentPrefix, 2=Content
    const itemRegex = /^(\/\/)?\s*"([^"]+)"/;
    const match = trimmed.match(itemRegex);
    
    if (match) {
      const isCommented = !!match[1];
      const content = match[2] || "";
      
      items.push({
        key: content,
        enabled: !isCommented,
        startLine: i,
        endLine: i,
        raw: line
      });
    }
    i++;
  }
  
  return items;
}

/**
 * Shared logic to scan keys inside an object block.
 * @param lines All lines of the file
 * @param startLine The line index to start scanning from (inclusive)
 * @param initialDepth The brace depth at startLine. Usually 1 (inside the object).
 */
function scanObjectKeys(lines: string[], startLine: number, initialDepth: number = 1): ConfigItem[] {
    const items: ConfigItem[] = [];
    let depth = initialDepth;
    let i = startLine;

    while (i < lines.length) {
        const line = lines[i] || "";
        const trimmed = line.trim();

        // Check if we are closing the main object
        // If depth becomes 0, we stopped.
        // But we handle depth updates at the end of loop for non-keys.
        // Here we explicitly check for immediate closure if not a key.
        if (trimmed === '}' || (trimmed.startsWith('}') && depth === 1)) {
            break;
        }

        // Match Key definition: (//)? "key":
        const keyRegex = /^(\/\/)?\s*"([^"]+)"\s*:/;
        const match = trimmed.match(keyRegex);

        if (match) {
            // We found a key!
            const isCommented = !!match[1];
            const keyName = match[2] || "";
            const itemStart = i;

            // Find end of this item (by brace/bracket balance)
            let itemEnd = i;
            let localDepth = 0;
            let k = i;
            while(k < lines.length) {
                const kl = lines[k] || "";
                
                // Track depth for both objects and arrays
                // We strip strings to avoid counting braces inside strings
                const nonStringContent = kl.replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '""');
                
                localDepth += (nonStringContent.match(/{/g) || []).length;
                localDepth -= (nonStringContent.match(/}/g) || []).length;
                localDepth += (nonStringContent.match(/\[/g) || []).length;
                localDepth -= (nonStringContent.match(/\]/g) || []).length;
                
                if (localDepth <= 0) {
                    itemEnd = k;
                    break;
                }
                k++;
            }

            items.push({
                key: keyName,
                enabled: !isCommented,
                startLine: itemStart,
                endLine: itemEnd,
                raw: lines.slice(itemStart, itemEnd + 1).join('\n')
            });

            // Advance i
            i = itemEnd + 1;
            continue;
        }

        // Update depth for non-key lines (like random closing braces or comments)
        const nonStringContent = line.replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '""');
        const openBraces = (nonStringContent.match(/{/g) || []).length;
        const closeBraces = (nonStringContent.match(/}/g) || []).length;
        depth += (openBraces - closeBraces);
        
        if (depth <= 0) break;

        i++;
    }
    return items;
}

/**
 * Extracts keys from a JSONC object (e.g., "provider": { ... })
 */
export function parseObjectSection(raw: string, sectionKey: string): ConfigItem[] {
  const lines = raw.split('\n');
  
  // 1. Find section start "key": {
  const sectionRegex = new RegExp(`"${sectionKey}"\\s*:\\s*\\{`);
  let startRow = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line && sectionRegex.test(line) && !line.trim().startsWith('//')) {
      startRow = i;
      break;
    }
  }
  
  if (startRow === -1) return [];

  // 2. Scan keys starting from next line, depth 1
  return scanObjectKeys(lines, startRow + 1, 1);
}

// export function parseChildren(rawBlock: string, startLineOffset: number): ConfigItem[] {
/*    const lines = rawBlock.split('\n');
    // We assume the first line is the opening "key": {
    // We start scanning at line 1
    // We assume the lines we have are isolated, so we can treat them as a mini-file
    // BUT scanObjectKeys returns line numbers relative to the 'lines' array passed.
    // We need to adjust them by startLineOffset.
    
    // Also, scanObjectKeys checks for '}' to break.
    // If rawBlock is well-formed "key": { ... }, the last line is '}'.
    // So scanning from line 1 with initialDepth=1 should work perfectly.

    const items = scanObjectKeys(lines, 1, 1);

    // Adjust line numbers
    return items.map(item => ({
        ...item,
        startLine: item.startLine + startLineOffset,
        endLine: item.endLine + startLineOffset
    }));
}*/

export function toggleLine(raw: string, lineIndex: number, enable: boolean): string {
  const lines = raw.split('\n');
  if (lineIndex < 0 || lineIndex >= lines.length) return raw;
  
  const line = lines[lineIndex] || "";
  const trimmed = line.trim();
  
  if (enable) {
    // Uncomment: Remove leading // and maybe indentation fix
    // Simple: replace first // with nothing
    if (trimmed.startsWith('//')) {
        // Try to preserve indentation:  "  // "foo"" -> "  "foo""
        lines[lineIndex] = line.replace(/\/\/\s?/, '');
    }
  } else {
    // Comment: Add // to start of content (after indentation)
    // "  "foo"" -> "  // "foo""
    const indentMatch = line.match(/^\s*/);
    const indent = indentMatch ? indentMatch[0] : "";
    const content = line.slice(indent.length);
    if (!content.startsWith('//')) {
        lines[lineIndex] = `${indent}// ${content}`;
    }
  }
  
  return lines.join('\n');
}

/**
 * Toggles a block of lines (for objects)
 */
export function toggleBlock(raw: string, startLine: number, endLine: number, enable: boolean): string {
    const lines = raw.split('\n');
    for (let i = startLine; i <= endLine; i++) {
        const line = lines[i] || "";
        if (line.trim().length > 0) {
            const trimmed = line.trim();
             if (enable) {
                if (trimmed.startsWith('//')) {
                    lines[i] = line.replace(/\/\/\s?/, '');
                }
            } else {
                 const indentMatch = line.match(/^\s*/);
                 const indent = indentMatch ? indentMatch[0] : "";
                 const content = line.slice(indent.length);
                 if (!content.startsWith('//')) {
                     lines[i] = `${indent}// ${content}`;
                 }
            }
        }
    }
    return lines.join('\n');
}

export function removeItem(raw: string, startLine: number, endLine: number): string {
    const lines = raw.split('\n');
    lines.splice(startLine, (endLine - startLine) + 1);
    return lines.join('\n');
}
