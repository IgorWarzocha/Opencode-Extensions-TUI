/**
 * Layout utilities for computing responsive terminal layout and view modes.
 * Centralizes mode selection and sizing calculations for cards and lists.
 */

export type ViewMode = "wide" | "medium" | "narrow";

export interface LayoutContext {
  width: number;
  height: number;
  availableWidth: number;
  maxLine: number;
}

export interface LayoutResult {
  mode: ViewMode;
  cardHeight: number;
  listHeight: number;
  windowSize: number;
}

export function determineMode(maxLine: number): ViewMode {
  if (maxLine >= 100) return "wide";
  if (maxLine >= 50) return "medium";
  return "narrow";
}

export function calculateLayout(ctx: LayoutContext): LayoutResult {
  const mode = determineMode(ctx.maxLine);
  const cardHeight = mode === "wide" ? 3 : mode === "medium" ? 4 : 5;
  const listHeight = Math.max(4, ctx.height - 14);
  const windowSize = Math.max(1, Math.floor(listHeight / cardHeight));

  return {
    mode,
    cardHeight,
    listHeight,
    windowSize,
  };
}
