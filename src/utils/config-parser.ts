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

/**
 * Updates a top-level key in JSONC while preserving comments and formatting.
 * If the key doesn't exist, it will be added before the closing brace.
 * 
 * @param raw The raw JSONC content
 * @param key The key to update (e.g., "theme", "model")
 * @param value The new value (will be JSON.stringify'd)
 * @returns Updated JSONC string
 */
export function updateTopLevelKey(raw: string, key: string, value: unknown): string {
  const lines = raw.split('\n');
  
  // Find the key: "key": value pattern at top level (depth 0 inside root object)
  const keyRegex = new RegExp(`^(\\s*)("${key}"\\s*:\\s*)(.*)$`);
  let found = false;
  let depth = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();
    
    // Skip commented lines for depth tracking
    if (trimmed.startsWith('//')) continue;
    
    // Track depth (we only want top-level keys, i.e., depth === 1)
    const nonStringContent = line.replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '""');
    const opens = (nonStringContent.match(/{/g) ?? []).length + (nonStringContent.match(/\[/g) ?? []).length;
    const closes = (nonStringContent.match(/}/g) ?? []).length + (nonStringContent.match(/]/g) ?? []).length;
    
    // Check for key at depth 1 (inside root object)
    if (depth === 1) {
      const match = line.match(keyRegex);
      if (match) {
        // Found the key! Now we need to find where this value ends
        const indent = match[1] ?? "";
        const keyPart = match[2] ?? "";
        const rest = match[3] ?? "";
        
        // Simple values end on the same line (string, number, boolean, null)
        // Complex values (objects, arrays) need brace matching
        const valueStr = typeof value === 'object' && value !== null
          ? JSON.stringify(value, null, 2).split('\n').map((l, idx) => idx === 0 ? l : indent + l).join('\n')
          : JSON.stringify(value);
        
        // Check if the rest starts an object/array
        const restTrimmed = rest.trim();
        if (restTrimmed.startsWith('{') || restTrimmed.startsWith('[')) {
          // Complex value - find end by brace matching
          let localDepth = 0;
          let endLine = i;
          for (let j = i; j < lines.length; j++) {
            const jLine = lines[j] ?? "";
            const jNonString = jLine.replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '""');
            localDepth += (jNonString.match(/{/g) ?? []).length + (jNonString.match(/\[/g) ?? []).length;
            localDepth -= (jNonString.match(/}/g) ?? []).length + (jNonString.match(/]/g) ?? []).length;
            if (localDepth <= 0) {
              endLine = j;
              break;
            }
          }
          
          // Check if there's a trailing comma
          const endLineContent = lines[endLine] ?? "";
          const hasComma = endLineContent.trim().endsWith(',');
          
          // Replace lines from i to endLine
          const replacement = `${indent}${keyPart}${valueStr}${hasComma ? ',' : ''}`;
          lines.splice(i, endLine - i + 1, replacement);
        } else {
          // Simple value - replace just this line
          const hasComma = rest.trim().endsWith(',');
          lines[i] = `${indent}${keyPart}${valueStr}${hasComma ? ',' : ''}`;
        }
        
        found = true;
        break;
      }
    }
    
    depth += opens - closes;
  }
  
  if (!found) {
    // Key doesn't exist, add it before the closing brace
    // Find the last closing brace at depth 0
    let insertLine = -1;
    depth = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      const nonStringContent = line.replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '""');
      const opens = (nonStringContent.match(/{/g) ?? []).length;
      const closes = (nonStringContent.match(/}/g) ?? []).length;
      depth += opens - closes;
      if (depth === 0 && line.trim().startsWith('}')) {
        insertLine = i;
        break;
      }
    }
    
    if (insertLine >= 0) {
      // Check if previous non-empty line needs a comma
      let prevLine = insertLine - 1;
      while (prevLine >= 0) {
        const pl = (lines[prevLine] ?? "").trim();
        if (pl && !pl.startsWith('//')) {
          if (!pl.endsWith(',') && !pl.endsWith('{')) {
            lines[prevLine] = (lines[prevLine] ?? "") + ",";
          }
          break;
        }
        prevLine--;
      }
      
      const valueStr = typeof value === 'object' && value !== null
        ? JSON.stringify(value, null, 2).split('\n').map((l, idx) => idx === 0 ? l : "  " + l).join('\n')
        : JSON.stringify(value);
      lines.splice(insertLine, 0, `  "${key}": ${valueStr}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Updates multiple top-level keys in JSONC while preserving comments.
 * More efficient than calling updateTopLevelKey multiple times.
 */
export function updateTopLevelKeys(raw: string, updates: Record<string, unknown>): string {
  let result = raw;
  for (const [key, value] of Object.entries(updates)) {
    result = updateTopLevelKey(result, key, value);
  }
  return result;
}

export function addItem(raw: string, sectionKey: string, key: string, value: unknown): string {
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
  
  if (startRow === -1) {
    // If section doesn't exist, we assume it needs to be created or fail gracefully.
    // For now, return raw to avoid breaking.
    return raw;
  }

  // 2. Find the closing brace of this section
  let depth = 1;
  let i = startRow + 1;
  let insertLine = -1;

  while(i < lines.length) {
      const line = lines[i] || "";
      const nonStringContent = line.replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '""');
      
      const closeBraces = (nonStringContent.match(/}/g) || []).length;
      const openBraces = (nonStringContent.match(/{/g) || []).length;
      
      depth += (openBraces - closeBraces);
      
      if (depth === 0) {
          // Found closing brace at this line
          insertLine = i;
          break;
      }
      i++;
  }

  if (insertLine === -1) return raw;

  // 3. Prepare insertion
  const indent = "    "; // 4 spaces for section items
  const jsonString = JSON.stringify(value, null, 2);
  const indentedValue = jsonString.split('\n').map((l, i) => i === 0 ? l : indent + l).join('\n');
  const newEntry = `\n${indent}"${key}": ${indentedValue}`;
  
  // Check if previous line needs a comma
  let k = insertLine - 1;
  let needsComma = false;
  while(k > startRow) {
      const line = (lines[k] || "").trim();
      if (line && !line.startsWith('//')) {
          if (!line.endsWith(',') && !line.endsWith('{')) {
              needsComma = true;
          }
          break;
      }
      k--;
  }
  
  if (needsComma && k >= 0) {
      lines[k] = (lines[k] || "") + ",";
  }
  
  lines.splice(insertLine, 0, newEntry);
  
  return lines.join('\n');
}
