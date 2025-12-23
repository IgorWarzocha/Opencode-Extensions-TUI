import { t, dim, bold, cyan } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useState, useEffect } from "react";
import { ocTheme } from "../../theme";
import { parseArraySection, toggleLine, removeItem, type ConfigItem } from "../../utils/config-parser";

interface PluginEditorProps {
  rawContent: string;
  onChange: (newRaw: string) => void;
  height: number;
}

export function PluginEditor({ rawContent, onChange, height }: PluginEditorProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollRow, setScrollRow] = useState(0);
  const [items, setItems] = useState<ConfigItem[]>([]);

  useEffect(() => {
    const parsed = parseArraySection(rawContent, "plugin");
    setItems(parsed);
  }, [rawContent]);

  const list = items;

  // Adjust scroll when selection changes
  if (selectedIndex < scrollRow) {
    setScrollRow(selectedIndex);
  } else if (selectedIndex >= scrollRow + height) {
    setScrollRow(selectedIndex - height + 1);
  }

  useKeyboard((key) => {
    // Navigation
    if (key.name === "up") {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.name === "down") {
      setSelectedIndex((prev) => Math.min(Math.max(0, list.length - 1), prev + 1));
    } 
    
    // Actions
    if (list.length === 0) return;
    const item = list[selectedIndex];
    if (!item) return;

    if (key.name === "e" || key.name === "d" || key.name === "space") {
        const newState = !item.enabled;
        const newRaw = toggleLine(rawContent, item.startLine, newState);
        onChange(newRaw);
    } else if (key.name === "r" || key.name === "delete") {
        const newRaw = removeItem(rawContent, item.startLine, item.endLine);
        onChange(newRaw);
        setSelectedIndex(Math.min(selectedIndex, Math.max(0, list.length - 2)));
    }
  });

  return (
    <box flexDirection="column" flexGrow={1} padding={1} borderStyle="single" borderColor={ocTheme.border}>
      <box marginBottom={1} flexDirection="row" justifyContent="space-between">
        <text content={t`${bold("Plugins (Parsed from Raw)")}`} />
        <text content={t`${dim(`${list.length} entries`)}`} />
      </box>
      
      <box flexDirection="column" height={height} overflow="hidden">
        {list.length === 0 && (
           <text content={t`${dim("No plugins found in config.")}`} />
        )}
        
        {list.slice(scrollRow, scrollRow + height).map((plugin, idx) => {
          const absoluteIdx = scrollRow + idx;
          const isSelected = absoluteIdx === selectedIndex;
          
          let display: string;
          if (!plugin.enabled) {
              display = `${plugin.key} (disabled)`;
          } else {
              display = plugin.key;
          }

          // Apply styling
          const cursor = isSelected ? bold(cyan("> ")) : "  ";
          const content = !plugin.enabled ? dim(display) : bold(display);
          
          return (
            <box key={absoluteIdx} height={1} flexDirection="row">
              <text content={t`${cursor}${content}`} />
            </box>
          );
        })}
      </box>

      <box marginTop={1}>
        <text content={t`${dim("e/space: Toggle • d: Disable • r: Remove")}`} />
      </box>
    </box>
  );
}
