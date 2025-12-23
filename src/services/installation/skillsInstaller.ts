/**
 * Skills installer for copying skill folders from GitHub repositories.
 * Supports tree URLs with subdirectories using sparse checkout.
 */
import { join } from "path";
import { homedir, tmpdir } from "os";
import { mkdtemp, rm, readdir, cp, mkdir } from "fs/promises";
import { existsSync } from "fs";
import type { Extension } from "../../types/extension";
import type {
  InstallationOptions,
  InstallationResult,
  StatusUpdateCallback,
} from "./types";
import { executeCommand } from "./commandRunner";
import { getErrorMessage } from "./InstallationError";

interface ParsedGitHubUrl {
  owner: string;
  repo: string;
  branch?: string;
  subdir?: string;
}

/** Parses GitHub URLs including tree URLs with subdirectories */
function parseGitHubUrl(url: string): ParsedGitHubUrl | null {
  // Tree URL: https://github.com/owner/repo/tree/branch/subdir
  const treeMatch = url.match(
    /github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)(?:\/(.+))?/,
  );
  if (treeMatch) {
    const [, owner, repo, branch, subdir] = treeMatch;
    return { owner: owner!, repo: repo!, branch, subdir };
  }

  // Root URL: https://github.com/owner/repo
  const rootMatch = url.match(/github\.com\/([^/]+)\/([^/]+)\/?$/);
  if (rootMatch) {
    const [, owner, repo] = rootMatch;
    return { owner: owner!, repo: repo! };
  }

  return null;
}

/** Fetches available skills from a GitHub tree URL */
export async function fetchAvailableSkills(treeUrl: string): Promise<string[]> {
  const parsed = parseGitHubUrl(treeUrl);
  if (!parsed) throw new Error("Invalid GitHub URL");

  const tempDir = await mkdtemp(join(tmpdir(), "opencode-skills-"));
  const cloneUrl = `https://github.com/${parsed.owner}/${parsed.repo}.git`;
  const branchArg = parsed.branch ? `--branch ${parsed.branch}` : "";

  try {
    // Clone with sparse checkout if subdir specified
    if (parsed.subdir) {
      const cloneCmd = `git clone --depth 1 --filter=blob:none --sparse ${branchArg} "${cloneUrl}" "${tempDir}"`;
      const cloneResult = await executeCommand(cloneCmd, "skills-fetch");
      if (!cloneResult.success)
        throw new Error(getErrorMessage(cloneResult.error));

      const sparseCmd = `git -C "${tempDir}" sparse-checkout set "${parsed.subdir}"`;
      const sparseResult = await executeCommand(sparseCmd, "skills-fetch");
      if (!sparseResult.success)
        throw new Error(getErrorMessage(sparseResult.error));
    } else {
      const cloneCmd = `git clone --depth 1 ${branchArg} "${cloneUrl}" "${tempDir}"`;
      const cloneResult = await executeCommand(cloneCmd, "skills-fetch");
      if (!cloneResult.success)
        throw new Error(getErrorMessage(cloneResult.error));
    }

    // Skills are in the subdir (or root if no subdir)
    const skillsDir = parsed.subdir ? join(tempDir, parsed.subdir) : tempDir;
    if (!existsSync(skillsDir)) return [];

    const entries = await readdir(skillsDir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

/** Installs selected skills from a GitHub tree URL */
export async function installSkills(
  extension: Extension,
  options: InstallationOptions = {},
  onStatusUpdate?: StatusUpdateCallback,
): Promise<InstallationResult> {
  const { global = false, selectedSkills } = options;
  const treeUrl = extension.install_command ?? extension.repository_url;

  if (!treeUrl) {
    return {
      success: false,
      error: {
        type: "COMMAND_FAILED",
        command: "install",
        message: "No install URL provided",
      },
    };
  }

  if (!selectedSkills?.length) {
    return {
      success: false,
      error: {
        type: "COMMAND_FAILED",
        command: "install",
        message: "No skills selected",
      },
    };
  }

  const parsed = parseGitHubUrl(treeUrl);
  if (!parsed) {
    return {
      success: false,
      error: {
        type: "COMMAND_FAILED",
        command: "install",
        message: "Invalid GitHub URL",
      },
    };
  }

  const tempDir = await mkdtemp(join(tmpdir(), "opencode-skills-install-"));
  const cloneUrl = `https://github.com/${parsed.owner}/${parsed.repo}.git`;
  const branchArg = parsed.branch ? `--branch ${parsed.branch}` : "";

  try {
    // Clone with sparse checkout if subdir specified
    if (parsed.subdir) {
      const cloneCmd = `git clone --depth 1 --filter=blob:none --sparse ${branchArg} "${cloneUrl}" "${tempDir}"`;
      const cloneResult = await executeCommand(cloneCmd, extension.id);
      if (!cloneResult.success) return cloneResult;

      const sparseCmd = `git -C "${tempDir}" sparse-checkout set "${parsed.subdir}"`;
      const sparseResult = await executeCommand(sparseCmd, extension.id);
      if (!sparseResult.success) return sparseResult;
    } else {
      const cloneCmd = `git clone --depth 1 ${branchArg} "${cloneUrl}" "${tempDir}"`;
      const cloneResult = await executeCommand(cloneCmd, extension.id);
      if (!cloneResult.success) return cloneResult;
    }

    // Target directory
    const baseDir = global
      ? join(homedir(), ".config", "opencode", "skill")
      : join(process.cwd(), ".opencode", "skill");

    if (!existsSync(baseDir)) await mkdir(baseDir, { recursive: true });

    // Source directory (subdir or root)
    const sourceBase = parsed.subdir ? join(tempDir, parsed.subdir) : tempDir;

    // Copy selected skills
    const installed: string[] = [];
    const errors: string[] = [];

    for (const skillName of selectedSkills) {
      const src = join(sourceBase, skillName);
      const dst = join(baseDir, skillName);

      if (!existsSync(src)) {
        errors.push(`'${skillName}' not found`);
        continue;
      }

      try {
        await cp(src, dst, { recursive: true, force: true });
        installed.push(skillName);
      } catch (e) {
        errors.push(
          `${skillName}: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    if (!installed.length && errors.length) {
      return {
        success: false,
        error: {
          type: "UNKNOWN_ERROR",
          extensionId: extension.id,
          message: errors.join("; "),
        },
      };
    }

    onStatusUpdate?.(extension.id, "installed");
    return { success: true, extensionId: extension.id };
  } catch (error) {
    return {
      success: false,
      error: {
        type: "UNKNOWN_ERROR",
        extensionId: extension.id,
        message: error instanceof Error ? error.message : "Install failed",
      },
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}
