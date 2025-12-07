/**
 * Executes shell commands for extension installation processes using Bun.spawn.
 * Provides unified command execution with proper error handling and exit code management.
 * Serves as the core execution engine for all installation command workflows.
 */

/**
 * Executes shell commands for extension installation processes using Bun.spawn.
 * Provides unified command execution with proper error handling and exit code management.
 * Serves as the core execution engine for all installation command workflows.
 */

import type { InstallationResult } from "./types";

export async function executeCommand(command: string, extensionId: string = ""): Promise<InstallationResult> {
  try {
    const process = Bun.spawn(["bash", "-c", command], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await process.exited;

    if (exitCode === 0) {
      return { success: true, extensionId };
    }

    return {
      success: false,
      error: {
        type: "COMMAND_FAILED",
        command,
        message: `Command failed with exit code ${exitCode}`,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        type: "UNKNOWN_ERROR",
        extensionId,
        message: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}
