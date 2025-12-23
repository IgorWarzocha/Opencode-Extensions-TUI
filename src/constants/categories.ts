/**
 * Application constants for extension categories and UI configuration.
 * Centralizes category definitions to maintain consistency across components.
 * Follows DRY principle by providing single source of truth for categories.
 */

/**
 * Array of available extension categories for filtering and display.
 * Used throughout the application for consistent category handling.
 */
export const CATEGORIES = [
  "All",
  "Featured",
  "Plugins",
  "Agents",
  "Commands",
  "Tools",
  "Skills",
  "Themes",
  "Bundles",
] as const;

/**
 * Type definition for category values derived from CATEGORIES array.
 * Provides type safety for category-related operations.
 */
export type Category = (typeof CATEGORIES)[number];
