import { t, dim, bold, cyan } from "@opentui/core";
import { useMemo, useState, useEffect } from "react";
import { ocTheme } from "../../theme";
import {
  parseObjectSection,
  toggleBlock,
  removeItem,
  addItem,
  type ConfigItem,
} from "../../utils/config-parser";
import { ScopedJsonEditor } from "./ScopedJsonEditor";
import { parseJSONC } from "../../utils/json";
import { useScrollableList } from "../../hooks/useScrollableList";
import { SchemaHelper } from "../../utils/SchemaHelper";

interface SectionListEditorProps {
  rawContent: string;
  sectionKey: string;
  onChange: (newRaw: string) => void;
  height: number;
  editingItem: ConfigItem | null;
  onEditItem: (item: ConfigItem | null) => void;
}

export function SectionListEditor({
  rawContent,
  sectionKey,
  onChange,
  height,
  editingItem,
  onEditItem,
}: SectionListEditorProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Simple, single-level parsing. No recursion/drill-down.
  const items = useMemo(() => {
    return parseObjectSection(rawContent, sectionKey);
  }, [rawContent, sectionKey]);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (showAddMenu) {
      setLoadingSuggestions(true);
      const existingKeys = items.map((i) => i.key);
      // SchemaHelper.getSuggestedKeys is now synchronous but relies on MetadataService which might be async-ish
      // Actually, let's keep getSuggestedKeys sync for simplicity, but maybe trigger a refresh?
      // Since MetadataService fetches on init, it might be instant.
      const keys = SchemaHelper.getSuggestedKeys(sectionKey, existingKeys);
      setSuggestions(keys);
      setLoadingSuggestions(false);
    }
  }, [showAddMenu, items, sectionKey]);

  const handleAction = (action: string, item: ConfigItem) => {
    if (showAddMenu) return; // Handled by add menu logic

    if (action === "e" || action === "d" || action === "space") {
      const newState = !item.enabled;
      const newRaw = toggleBlock(
        rawContent,
        item.startLine,
        item.endLine,
        newState,
      );
      onChange(newRaw);
    } else if (action === "r" || action === "delete") {
      const newRaw = removeItem(rawContent, item.startLine, item.endLine);
      onChange(newRaw);
    } else if (action === "return" || action === "enter") {
      if (item.enabled) {
        onEditItem(item);
      }
    } else if (action === "a" || action === "+") {
      setShowAddMenu(true);
    }
  };

  // Main list navigation
  const { selectedIndex, scrollRow } = useScrollableList({
    items: showAddMenu ? [] : items, // Disable main list nav when menu is open
    height: showAddMenu ? 0 : height, // Hacky way to disable logic? better to condition useKeyboard
    onAction: handleAction,
    onSelect: (item) => handleAction("enter", item),
  });

  // Add menu navigation
  const handleAddSelect = (key: string) => {
    // 1. Get template
    const template = SchemaHelper.getTemplate(sectionKey, key);
    // 2. Add item
    const newRaw = addItem(rawContent, sectionKey, key, template);
    onChange(newRaw);
    setShowAddMenu(false);

    // 3. Auto-open edit mode? Maybe user wants to check it first.
  };

  const { selectedIndex: addIndex, scrollRow: addScrollRow } =
    useScrollableList({
      items: showAddMenu ? suggestions : [],
      height: Math.min(suggestions.length, height - 4), // Reserve space for header
      onSelect: handleAddSelect,
      onAction: (action) => {
        if (action === "escape") setShowAddMenu(false);
      },
    });

  const handleJsonSave = (_newData: unknown, editorRawContent?: string) => {
    if (!editingItem) return;
    if (!editorRawContent) return; // Should always have editorRawContent with preserveRaw=true

    // Strategy: Parse both the original raw content and the new edited content
    // Merge them by replacing the provider block with the edited version
    // but preserve any commented entries that weren't touched

    const fileLines = rawContent.split("\n");

    // Extract the original provider block to preserve commented models
    const originalBlockStart = editingItem.startLine;
    const originalBlockEnd = editingItem.endLine;
    const originalBlock = fileLines
      .slice(originalBlockStart, originalBlockEnd + 1)
      .join("\n");

    // Parse the original block to get existing model IDs (both active and commented)
    // This helps preserve user's specific formatting and comments
    const originalLines = originalBlock.split("\n");
    const indent = originalLines[0]?.match(/^\s*/)?.[0] || "    ";

    // For now, use the simpler approach: replace with edited content
    // The key issue is that we need to ensure suggestions are commented out

    // Let's parse the edited content to verify it's valid
    try {
      const parsed = parseJSONC(editorRawContent);
      // The edited content is valid - use it directly
      // The user's edits include their changes, and model suggestions are already commented

      // We still need to preserve the indentation of the original entry
      const keyPart = `"${editingItem.key}": `;

      // Indent the edited content properly (first line no indent, rest with original indent)
      const indentedContent = editorRawContent
        .split("\n")
        .map((l, i) => (i === 0 ? l : indent + l))
        .join("\n");

      const replacement = keyPart + indentedContent;

      // Check if original block had a trailing comma
      const originalLastLine = originalLines[originalLines.length - 1] || "";
      const hasComma = originalLastLine.trim().endsWith(",");

      const replacementStr = replacement + (hasComma ? "," : "");
      const finalBlock = indent + replacementStr;

      fileLines.splice(
        editingItem.startLine,
        editingItem.endLine - editingItem.startLine + 1,
        finalBlock,
      );
      onChange(fileLines.join("\n"));
      onEditItem(null);
    } catch (e) {
      // If parsing failed, show error
      console.error("Invalid JSON in editor:", e);
      return;
    }
  };

  if (editingItem) {
    // Logic to prepare content for editor with suggestions
    let initialContent = "";
    try {
      // If we have raw content, try to use it directly to preserve comments?
      // BUT ScopedJsonEditor expects object if we use the old logic.
      // Wait, we want to inject suggestions.

      let currentObj: any = {};
      try {
        const wrapped = `{ ${editingItem.raw} }`;
        currentObj = parseJSONC(wrapped)[editingItem.key];
      } catch (e) {}

      // Use the new powerful generation
      initialContent = SchemaHelper.generateWithSuggestions(
        currentObj,
        sectionKey,
        editingItem.key,
      );
    } catch (e) {
      initialContent = editingItem.raw; // Fallback to raw if logic fails
    }

    return (
      <ScopedJsonEditor
        data={null} // We pass raw content now
        rawInitialContent={initialContent} // New prop for ScopedJsonEditor
        onSave={handleJsonSave}
        label={`Edit ${editingItem.key}`}
        height={height}
        preserveRaw={true}
      />
    );
  }

  // --- Render Add Menu ---
  if (showAddMenu) {
    return (
      <box
        flexDirection="column"
        flexGrow={1}
        padding={1}
        borderStyle="single"
        borderColor={ocTheme.accent}
      >
        <box marginBottom={1}>
          <text
            content={t`${bold("Add New Item")} ${loadingSuggestions ? "(Loading...)" : ""}`}
          />
        </box>
        <box flexDirection="column" height={height - 2} overflow="hidden">
          {suggestions.length === 0 && !loadingSuggestions && (
            <text content="No new items to add." />
          )}

          {suggestions.map((key, idx) => {
            if (idx < addScrollRow || idx >= addScrollRow + (height - 2))
              return null;
            const isSelected = idx === addIndex;
            const cursor = isSelected ? bold(cyan("> ")) : "  ";
            return (
              <box key={key} height={1} flexDirection="row">
                <text content={t`${cursor}${key}`} />
              </box>
            );
          })}
        </box>
        <box marginTop={1}>
          <text content={t`${dim("Enter: Add • Esc: Cancel")}`} />
        </box>
      </box>
    );
  }

  // --- Render Main List ---
  return (
    <box
      flexDirection="column"
      flexGrow={1}
      padding={1}
      borderStyle="single"
      borderColor={ocTheme.border}
    >
      <box marginBottom={1} flexDirection="row" justifyContent="space-between">
        <text content={t`${bold(sectionKey)} (Parsed List)`} />
        <text content={t`${dim(`${items.length} items`)}`} />
      </box>

      <box flexDirection="column" height={height} overflow="hidden">
        {items.length === 0 && <text content={t`${dim("No items found.")}`} />}

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
        <text
          content={t`${dim("e: Toggle • Enter: Edit • a: Add • r: Remove")}`}
        />
      </box>
    </box>
  );
}
