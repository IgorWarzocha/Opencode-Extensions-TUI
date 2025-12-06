/**
 * Extension list rendering with windowed view based on terminal height.
 * Responsible only for slicing and displaying cards with selection state.
 */

import type { Extension } from "../types/extension";
import type { ViewMode } from "../utils/layout";
import { ExtensionCard } from "./ExtensionCard";

interface ExtensionListProps {
  extensions: Extension[];
  selectedIndex: number;
  windowSize: number;
  mode: ViewMode;
  maxLine: number;
}

export function ExtensionList({ extensions, selectedIndex, windowSize, mode, maxLine }: ExtensionListProps) {
  if (extensions.length === 0) {
    return <text>No extensions found.</text>;
  }

  const visibleWindow = Math.max(1, Math.min(windowSize, extensions.length));
  const half = Math.floor(visibleWindow / 2);
  const listStart = Math.max(0, Math.min(selectedIndex - half, extensions.length - visibleWindow));
  const visibleExtensions = extensions.slice(listStart, listStart + visibleWindow);

  return (
    <box flexDirection="column" flexGrow={1} flexShrink={1}>
      {visibleExtensions.map((ext, idx) => {
        const absoluteIndex = listStart + idx;
        return (
          <ExtensionCard
            key={ext.id}
            extension={ext}
            isSelected={absoluteIndex === selectedIndex}
            mode={mode}
            maxLine={maxLine}
          />
        );
      })}
    </box>
  );
}
