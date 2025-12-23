/**
 * Installation service for managing extension installation and uninstallation operations.
 * Delegates to method-specific installers (npm, drop, bash, agents) and handles status updates.
 */
/**
 * Installation service for managing extension installation and uninstallation operations.
 * Delegates to method-specific installers (npm, drop, bash, agents) and handles status updates.
 */
import type { Extension } from "../../types/extension";
import type {
  InstallationOptions,
  InstallationResult,
  StatusUpdateCallback,
} from "./types.js";
import { installNpm } from "./npmInstaller.js";
import { installDrop } from "./dropInstaller.js";
import { installBash } from "./bashInstaller.js";
import { installAgent } from "./agentInstaller.js";
import { installSkills } from "./skillsInstaller.js";
import { executeCommand } from "./commandRunner.js";

/**
 * Installation service for managing extension installation and uninstallation.
 * Delegates to method-specific installers for clarity and maintainability.
 */
export class InstallationService {
  async install(
    extension: Extension,
    options: InstallationOptions = {},
    onStatusUpdate?: StatusUpdateCallback,
  ): Promise<InstallationResult> {
    try {
      if (extension.status === "installed") {
        return {
          success: false,
          error: { type: "ALREADY_INSTALLED", extensionId: extension.id },
        };
      }

      const installMethod = extension.install_method ?? "npm";

      switch (installMethod) {
        case "npm":
          return installNpm(extension, options, onStatusUpdate);
        case "drop":
          return installDrop(extension, options, onStatusUpdate);
        case "bash":
          return installBash(extension, options, onStatusUpdate);
        case "agents":
          return installAgent(extension, options, onStatusUpdate);
        case "skills":
          return installSkills(extension, options, onStatusUpdate);
        default:
          return {
            success: false,
            error: {
              type: "COMMAND_FAILED",
              command: "install",
              message: `Unknown install method: ${installMethod}`,
            },
          };
      }
    } catch (error) {
      return {
        success: false,
        error: {
          type: "UNKNOWN_ERROR",
          extensionId: extension.id,
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  async uninstall(
    extension: Extension,
    onStatusUpdate?: StatusUpdateCallback,
  ): Promise<InstallationResult> {
    try {
      if (extension.status !== "installed") {
        return {
          success: false,
          error: { type: "EXTENSION_NOT_FOUND", extensionId: extension.id },
        };
      }

      const installPath = extension.install_path;
      if (!installPath) {
        return {
          success: false,
          error: {
            type: "COMMAND_FAILED",
            command: "uninstall",
            message: "No installation path found",
          },
        };
      }

      const command = `rm -rf "${installPath}"`;
      const result = await executeCommand(command, extension.id);

      if (result.success) {
        onStatusUpdate?.(extension.id, "available");
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: {
          type: "UNKNOWN_ERROR",
          extensionId: extension.id,
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }
}
