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
 * Extracts keys from a JSONC object (e.g., "provider": { ... })
 * This is more complex because values are objects spanning multiple lines.
 */
export function parseObjectSection(raw: string, sectionKey: string): ConfigItem[] {
  const lines = raw.split('\n');
  const items: ConfigItem[] = [];
  
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

  // 2. Scan keys
  let depth = 1;
  let i = startRow + 1;
  
  while (i < lines.length) {
    const line = lines[i] || "";
    const trimmed = line.trim();
    
    // Check if we are closing the main object
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
        
        // Find end of this item (by brace balance or comma)
        let itemEnd = i;
        
        // Scan forward to find end
        let localDepth = 0;
        let k = i;
        while(k < lines.length) {
            const kl = lines[k] || "";
            localDepth += (kl.match(/{/g) || []).length;
            localDepth -= (kl.match(/}/g) || []).length;
            
            if (localDepth <= 0 && k > i) {
                // If we are back to 0 depth (or less), we closed the object
                itemEnd = k;
                break;
            }
            if (localDepth === 0 && !kl.includes('{') && k === i) {
                // Single line value
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
    
    // Update depth for non-key lines (like random closing braces)
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    depth += (openBraces - closeBraces);
    if (depth <= 0) break;
    
    i++;
  }
  
  return items;
}

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
