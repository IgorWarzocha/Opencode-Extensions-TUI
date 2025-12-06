import type { InstallationResult } from "./types";

export async function executeCommand(command: string, extensionId: number = 0): Promise<InstallationResult> {
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
