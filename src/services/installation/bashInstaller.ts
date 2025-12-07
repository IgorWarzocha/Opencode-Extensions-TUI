/**
 * Executes custom bash commands for extension installation workflows.
 * Supports flexible installation through user-defined or extension-provided shell commands.
 * Provides error handling and status updates for bash-based installation processes.
 */

/**
 * Executes custom bash commands for extension installation workflows.
 * Supports flexible installation through user-defined or extension-provided shell commands.
 * Provides error handling and status updates for bash-based installation processes.
 */

import type { Extension } from "../../types/extension";
import type { InstallationOptions, InstallationResult, StatusUpdateCallback } from "./types.js";
import { executeCommand } from "./commandRunner.js";

export async function installBash(
  extension: Extension,
  options: InstallationOptions,
  onStatusUpdate?: StatusUpdateCallback
): Promise<InstallationResult> {
  const command = options.customCommand ?? extension.install_command;

  if (!command) {
    return {
      success: false,
      error: {
        type: "COMMAND_FAILED",
        command: "bash-install",
        message: "No install command provided",
      },
    };
  }

  const result = await executeCommand(command, extension.id);

  if (result.success) {
    onStatusUpdate?.(extension.id, "installed");
  }

  return result;
}
