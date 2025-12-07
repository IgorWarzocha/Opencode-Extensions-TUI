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
  | { success: true; extensionId: string }
  | { success: false; error: InstallationError };

export type StatusUpdateCallback = (extensionId: string, status: "installed" | "available") => void;

export type InstallationMethod = "npm" | "drop" | "bash" | "agents" | "manual";

/**
 * Installation configuration options for flexible installation behavior.
 * Allows customization of installation process per extension requirements.
 */
export interface InstallationOptions {
  force?: boolean;
  global?: boolean;
  customCommand?: string;
  targetPath?: string;
}
