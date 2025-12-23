import { t, dim, bold, cyan } from "@opentui/core";
import { ocTheme } from "../../theme";
import { toggleLine, removeItem, type ConfigItem, parseArraySection } from "../../utils/config-parser";
import { useScrollableList } from "../../hooks/useScrollableList";
import { useState, useEffect } from "react";

interface PluginEditorProps {
  rawContent: string;
  onChange: (newRaw: string) => void;
  height: number;
}

export function PluginEditor({ rawContent, onChange, height }: PluginEditorProps) {
  const [items, setItems] = useState<ConfigItem[]>([]);

  useEffect(() => {
    setItems(parseArraySection(rawContent, "plugin"));
  }, [rawContent]);

  const handleAction = (action: string, item: ConfigItem) => {
    if (action === "e" || action === "d" || action === "space") {
      const newState = !item.enabled;
      const newRaw = toggleLine(rawContent, item.startLine, newState);
      onChange(newRaw);
    } else if (action === "r" || action === "delete") {
      const newRaw = removeItem(rawContent, item.startLine, item.endLine);
      onChange(newRaw);
    }
  };

  const { selectedIndex, scrollRow } = useScrollableList({
    items,
    height,
    onAction: handleAction,
    onSelect: (item) => handleAction("space", item)
  });

  return (
    <box flexDirection="column" flexGrow={1} padding={1} borderStyle="single" borderColor={ocTheme.border}>
      <box marginBottom={1} flexDirection="row" justifyContent="space-between">
        <text content={t`${bold("Plugins (Parsed from Raw)")}`} />
        <text content={t`${dim(`${items.length} entries`)}`} />
      </box>
      
      <box flexDirection="column" height={height} overflow="hidden">
        {items.length === 0 && (
           <text content={t`${dim("No plugins found in config.")}`} />
        )}
        
        {items.slice(scrollRow, scrollRow + height).map((plugin, idx) => {
          const absoluteIdx = scrollRow + idx;
          const isSelected = absoluteIdx === selectedIndex;
          
          let display: string;
          if (!plugin.enabled) {
              display = `${plugin.key} (disabled)`;
          } else {
              display = plugin.key;
          }

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
