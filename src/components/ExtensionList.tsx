/**
 * Extension list rendering with windowed view based on terminal height.
 * Responsible only for slicing and displaying cards with selection state.
 */

import type { MouseEvent } from "@opentui/core";
import { MouseButton } from "@opentui/core";
import type { Extension } from "../types/extension";
import type { ViewMode } from "../utils/layout";
import { ExtensionCard } from "./ExtensionCard";

interface ExtensionListProps {
  extensions: Extension[];
  selectedIndex: number;
  windowSize: number;
  mode: ViewMode;
  maxLine: number;
  setSelectedIndex: (updater: number | ((prev: number) => number)) => void;
  onOpenDetails?: (extension: Extension) => void;
  isInteractive?: boolean;
}

export function ExtensionList({
  extensions,
  selectedIndex,
  windowSize,
  mode,
  maxLine,
  setSelectedIndex,
  onOpenDetails,
  isInteractive = true,
}: ExtensionListProps) {
  if (extensions.length === 0) {
    return <text>No extensions found.</text>;
  }

  const visibleWindow = Math.max(1, Math.min(windowSize, extensions.length));
  const half = Math.floor(visibleWindow / 2);
  const listStart = Math.max(0, Math.min(selectedIndex - half, extensions.length - visibleWindow));
  const visibleExtensions = extensions.slice(listStart, listStart + visibleWindow);
  const maxIndex = extensions.length - 1;

  const clampIndex = (index: number) => Math.max(0, Math.min(maxIndex, index));

  const handleScroll = (event: MouseEvent) => {
    if (!isInteractive) return;
    const scroll = event.scroll;
    if (!scroll) return;
    const delta = Math.max(1, scroll.delta);
    setSelectedIndex((prev) => {
      if (scroll.direction === "up") {
        return clampIndex(prev - delta);
      }
      if (scroll.direction === "down") {
        return clampIndex(prev + delta);
      }
      return prev;
    });
  };

  return (
    <box flexDirection="column" flexGrow={1} flexShrink={1} onMouseScroll={handleScroll}>
      {visibleExtensions.map((ext, idx) => {
        const absoluteIndex = listStart + idx;
        return (
          <ExtensionCard
            key={ext.id}
            extension={ext}
            isSelected={absoluteIndex === selectedIndex}
            mode={mode}
            maxLine={maxLine}
            onMouseDown={(event) => {
              if (!isInteractive) return;
              if (event.button !== MouseButton.LEFT) return;
              setSelectedIndex(absoluteIndex);
              if (absoluteIndex === selectedIndex && onOpenDetails) {
                onOpenDetails(ext);
              }
            }}
          />
        );
      })}
    </box>
  );
}
