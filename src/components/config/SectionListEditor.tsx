import { t, dim, bold, cyan } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useState, useEffect } from "react";
import { ocTheme } from "../../theme";
import { parseObjectSection, toggleBlock, removeItem, type ConfigItem } from "../../utils/config-parser";
import { ScopedJsonEditor } from "./ScopedJsonEditor";
import { parseJSONC } from "../../utils/json";

interface SectionListEditorProps {
  rawContent: string;
  sectionKey: string; // e.g., "provider" or "agent"
  onChange: (newRaw: string) => void;
  height: number;
}

export function SectionListEditor({ rawContent, sectionKey, onChange, height }: SectionListEditorProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollRow, setScrollRow] = useState(0);
  const [items, setItems] = useState<ConfigItem[]>([]);
  const [editingItem, setEditingItem] = useState<ConfigItem | null>(null);

  useEffect(() => {
    const parsed = parseObjectSection(rawContent, sectionKey);
    setItems(parsed);
  }, [rawContent, sectionKey]);

  // Adjust scroll
  if (selectedIndex < scrollRow) {
    setScrollRow(selectedIndex);
  } else if (selectedIndex >= scrollRow + height) {
    setScrollRow(selectedIndex - height + 1);
  }

  useKeyboard((key) => {
    if (editingItem) return; // Handled by ScopedJsonEditor

    if (key.name === "up") {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.name === "down") {
      setSelectedIndex((prev) => Math.min(Math.max(0, items.length - 1), prev + 1));
    }

    if (items.length === 0) return;
    const item = items[selectedIndex];
    if (!item) return;

    if (key.name === "e" || key.name === "d" || key.name === "space") {
        const newState = !item.enabled;
        const newRaw = toggleBlock(rawContent, item.startLine, item.endLine, newState);
        onChange(newRaw);
    } else if (key.name === "r" || key.name === "delete") {
        const newRaw = removeItem(rawContent, item.startLine, item.endLine);
        onChange(newRaw);
        setSelectedIndex(Math.min(selectedIndex, Math.max(0, items.length - 2)));
    } else if (key.name === "return" || key.name === "enter") {
        if (item.enabled) {
            setEditingItem(item);
        }
    } else if (key.name === "escape" && editingItem) {
        setEditingItem(null);
    }
  });

  const handleJsonSave = (newData: any) => {
      if (!editingItem) return;
      
      const lines = rawContent.split('\n');
      const startLine = lines[editingItem.startLine] || "";
      const indentMatch = startLine.match(/^\s*/);
      const indent = indentMatch ? indentMatch[0] : "    "; // default 4 spaces
      
      const jsonString = JSON.stringify(newData, null, 2);
      // Indent every line of jsonString
      // We assume jsonString starts at indent level 0 relative to itself
      const indentedJson = jsonString.split('\n').map((l, i) => i === 0 ? l : indent + l).join('\n');
      
      const keyPart = `"${editingItem.key}": `;
      const replacement = keyPart + indentedJson;
      
      const originalBlock = lines.slice(editingItem.startLine, editingItem.endLine + 1).join('\n');
      const hasComma = originalBlock.trim().endsWith(',');
      
      const replacementStr = replacement + (hasComma ? ',' : '');
      const finalBlock = indent + replacementStr;
      
      // Splice lines
      lines.splice(editingItem.startLine, (editingItem.endLine - editingItem.startLine) + 1, finalBlock);
      onChange(lines.join('\n'));
      setEditingItem(null);
  };

  if (editingItem) {
      let data = {};
      try {
          const wrapped = `{ ${editingItem.raw} }`;
          const obj = parseJSONC(wrapped);
          data = obj[editingItem.key];
      } catch (e) {
          data = { error: "Could not parse", raw: editingItem.raw };
      }

      return (
          <ScopedJsonEditor 
              data={data} 
              onSave={handleJsonSave} 
              label={`Edit ${editingItem.key}`} 
              height={height} 
          />
      );
  }

  return (
    <box flexDirection="column" flexGrow={1} padding={1} borderStyle="single" borderColor={ocTheme.border}>
      <box marginBottom={1} flexDirection="row" justifyContent="space-between">
        <text content={t`${bold(sectionKey)} (Parsed List)`} />
        <text content={t`${dim(`${items.length} items`)}`} />
      </box>
      
      <box flexDirection="column" height={height} overflow="hidden">
        {items.length === 0 && (
           <text content={t`${dim("No items found.")}`} />
        )}
        
        {items.slice(scrollRow, scrollRow + height).map((item, idx) => {
          const absoluteIdx = scrollRow + idx;
          const isSelected = absoluteIdx === selectedIndex;
          
          let display: string;
          if (!item.enabled) {
              display = `${item.key} (disabled)`;
          } else {
              display = item.key;
          }

          const cursor = isSelected ? bold(cyan("> ")) : "  ";
          const content = !item.enabled ? dim(display) : bold(display);
          
          return (
            <box key={absoluteIdx} height={1} flexDirection="row">
              <text content={t`${cursor}${content}`} />
            </box>
          );
        })}
      </box>

      <box marginTop={1}>
        <text content={t`${dim("e: Toggle • Enter: Edit JSON • r: Remove")}`} />
      </box>
    </box>
  );
}
