/**
 * Handles NPM-based extension installation using package manager commands.
 * Executes npm install commands for extensions with package.json configurations.
 * Provides status updates and error handling for npm installation workflows.
 */

import type { Extension } from "../../types/extension";
import type { InstallationOptions, InstallationResult, StatusUpdateCallback } from "./types.js";
import { executeCommand } from "./commandRunner.js";

export async function installNpm(
  extension: Extension,
  _options: InstallationOptions,
  onStatusUpdate?: StatusUpdateCallback
): Promise<InstallationResult> {
  const command = extension.install_command ?? `npm install ${extension.name}`;

  const result = await executeCommand(command, extension.id);

  if (result.success) {
    onStatusUpdate?.(extension.id, "installed");
  }

  return result;
}

