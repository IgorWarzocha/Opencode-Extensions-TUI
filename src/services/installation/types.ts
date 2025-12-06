/**
 * Installation-related type definitions for extension management operations.
 * Provides type safety for installation, uninstallation, and status updates.
 * Follows single responsibility principle by isolating installation logic types.
 */

import type { InstallationError } from "./InstallationError";
export type { InstallationError } from "./InstallationError";

/**
 * Result type for installation operations.
 * Discriminated union for success/failure handling with proper error types.
 */
export type InstallationResult = 
  | { success: true; extensionId: number }
  | { success: false; error: InstallationError };


/**
 * Status update callback type for extension state changes.
 * Provides type safety for status update operations.
 */
export type StatusUpdateCallback = (extensionId: number, status: 'installed' | 'available') => void;

/**
 * Installation method types for different installation approaches.
 * Supports npm, drop-in, and bash-based installations.
 */
export type InstallationMethod = 'npm' | 'drop' | 'bash' | 'manual';

/**
 * Installation configuration options for flexible installation behavior.
 * Allows customization of installation process per extension requirements.
 */
export interface InstallationOptions {
  force?: boolean;
  global?: boolean;
}