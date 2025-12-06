import type { Extension } from "../../types/extension";
import type { InstallationOptions, InstallationResult, StatusUpdateCallback } from "./types.js";
import { executeCommand } from "./commandRunner.js";

export async function installNpm(
  extension: Extension,
  _options: InstallationOptions,
  onStatusUpdate?: StatusUpdateCallback
): Promise<InstallationResult> {
  const packageName = extension.package_name || extension.name;
  const command = `npm install ${packageName}`;

  const result = await executeCommand(command, extension.id);

  if (result.success) {
    onStatusUpdate?.(extension.id, "installed");
  }

  return result;
}

