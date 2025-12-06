/**
 * Text manipulation utilities for consistent string formatting across the application.
 * Provides reusable functions for text truncation, number formatting, and display utilities.
 * Follows DRY principle by centralizing common text operations.
 */

/**
 * Truncates text to specified maximum length with ellipsis.
 * Handles edge cases for zero/negative lengths and single character limits.
 * 
 * @param text - The text to truncate
 * @param max - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed, or original text if under limit
 */
export function ellipsize(text: string, max: number): string {
  if (max <= 0) return '';
  if (text.length <= max) return text;
  if (max <= 1) return text.slice(0, max);
  return text.slice(0, max - 1) + '…';
}

/**
 * Formats numbers for display with abbreviated notation for large values.
 * Converts thousands to 'k' notation with one decimal place.
 * 
 * @param num - The number to format
 * @returns Formatted number string (e.g., 1500 -> '1.5k', 500 -> '500')
 */
export function formatCount(num: number | undefined | null): string {
  if (num === undefined || num === null) return "0";
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toString();
}