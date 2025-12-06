/**
 * Theme utilities for consistent color and styling access across components.
 * Provides centralized theme access patterns and common styling helpers.
 * Follows DRY principle by eliminating repeated theme property access.
 */

import { ocTheme } from '../theme';

/**
 * Theme color getters for consistent access patterns.
 * Prevents direct theme property access and provides semantic naming.
 */
export const theme = {
  // Background colors
  background: ocTheme.background,
  panel: ocTheme.panel,
  menu: ocTheme.menu,
  element: ocTheme.element,

  // Border colors  
  border: ocTheme.border,
  borderActive: ocTheme.borderActive,

  // Text colors
  text: ocTheme.text,
  textMuted: ocTheme.textMuted,
  primary: ocTheme.primary,
  secondary: ocTheme.secondary,
  accent: ocTheme.accent,
  success: ocTheme.success,
  warning: ocTheme.warning,

  // Dynamic color getters
  getBorder: (isActive: boolean = false) => 
    isActive ? ocTheme.borderActive : ocTheme.border,
    
  getBackground: (isElement: boolean = false) => 
    isElement ? ocTheme.element : ocTheme.panel,
    
  getTextColor: (type: 'stat' | 'author' | 'license' | 'language' | 'updated' | 'default' = 'default') => {
    switch (type) {
      case 'stat': return ocTheme.warning;
      case 'author': return ocTheme.secondary;
      case 'license': return ocTheme.text;
      case 'language': return ocTheme.warning;
      case 'updated': return ocTheme.textMuted;
      default: return ocTheme.text;
    }
  }
} as const;