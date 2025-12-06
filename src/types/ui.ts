/**
 * UI-related type definitions for consistent interface usage across components.
 * Centralizes layout modes and dimension types for type safety.
 * Follows DRY principle by providing shared type definitions.
 */

/**
 * Layout mode based on available terminal width.
 * Determines how extension cards and layouts are displayed.
 */
export type ViewMode = 'wide' | 'medium' | 'narrow';

/**
 * Terminal and layout dimensions for responsive design.
 * Used for calculating component sizes and positions.
 */
export interface LayoutDimensions {
  width: number;
  height: number;
  availableWidth: number;
  maxLine: number;
}

/**
 * Layout calculation results for component positioning.
 * Includes mode, dimensions, and sizing parameters.
 */
export interface LayoutResult {
  mode: ViewMode;
  dimensions: LayoutDimensions;
  cardHeight: number;
  sidebarWidth: number;
}