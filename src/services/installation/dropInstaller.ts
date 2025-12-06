import type { Extension } from "../../types/extension";
import type { InstallationOptions, InstallationResult, StatusUpdateCallback } from "./types";
import { executeCommand } from "./commandRunner";

export async function installDrop(
  extension: Extension,
  options: InstallationOptions,
  onStatusUpdate?: StatusUpdateCallback
): Promise<InstallationResult> {
  if (!extension.repository_url) {
    return {
      success: false,
      error: {
        type: "COMMAND_FAILED",
        command: "drop-install",
        message: "Missing repository_url for drop installation",
      },
    };
  }

  const targetPath = options.targetPath ?? "./extensions";
  const command = `curl -s "${extension.repository_url}" | tar -xz -C "${targetPath}"`;

  const result = await executeCommand(command, extension.id);

  if (result.success) {
    onStatusUpdate?.(extension.id, "installed");
  }

  return result;
}
