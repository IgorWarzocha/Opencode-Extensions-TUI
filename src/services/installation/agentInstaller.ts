/**
 * Installs agent extensions from GitHub repositories using git cloning and file operations.
 * Handles sparse checkout for specific subdirectories and supports global/local installation modes.
 * Provides comprehensive GitHub URL parsing and temporary directory management for agent setups.
 */

/**
 * Installs agent extensions from GitHub repositories using git cloning and file operations.
 * Handles sparse checkout for specific subdirectories and supports global/local installation modes.
 * Provides comprehensive GitHub URL parsing and temporary directory management for agent setups.
 */

import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import type { Extension } from "../../types/extension";
import type { InstallationResult, StatusUpdateCallback } from "./types.js";

interface GithubTreeInfo {
  owner?: string;
  repo?: string;
  branch?: string;
  subdir?: string;
}

interface CommandOutcome {
  ok: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
}

const LOCAL_AGENT_DIR = ".opencode/agent";
const HOME_DIR = process.env.HOME ?? "";
const GLOBAL_AGENT_DIR = HOME_DIR ? join(HOME_DIR, ".config", "opencode", "agent") : "";

export function parseGithubTreeUrl(url: string): GithubTreeInfo | null {
  // Try matching specific tree/subdirectory
  // Format: https://github.com/owner/repo/tree/branch/subdir
  const treeMatch = url.match(/https?:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)/);
  if (treeMatch) {
    const [, owner, repo, branch, subdir] = treeMatch;
    return { owner, repo, branch, subdir } satisfies GithubTreeInfo;
  }

  // Try matching root repo
  // Format: https://github.com/owner/repo or https://github.com/owner/repo/
  const rootMatch = url.match(/https?:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/)?$/);
  if (rootMatch) {
    const [, owner, repo] = rootMatch;
    return { owner, repo } satisfies GithubTreeInfo;
  }

  return null;
}

async function runShell(command: string, cwd?: string): Promise<CommandOutcome> {
  const proc = Bun.spawn(["bash", "-c", command], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });

  const exitCode = await proc.exited;
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();

  return { ok: exitCode === 0, exitCode, stdout, stderr } satisfies CommandOutcome;
}

function failure(message: string, command: string, extensionId?: string): InstallationResult {
  return {
    success: false,
    error: {
      type: "COMMAND_FAILED",
      command,
      message,
      ...(extensionId ? { extensionId } : {}),
    },
  };
}

export async function installAgent(
  extension: Extension,
  { force, global }: { force?: boolean; global?: boolean } = {},
  onStatusUpdate?: StatusUpdateCallback
): Promise<InstallationResult> {
  void force; // reserved for future use
  const url = extension.install_command;
  if (!url) {
    return failure("No install command/URL provided", "agent-install", extension.id);
  }

  const parsed = parseGithubTreeUrl(url);
  if (!parsed || !parsed.owner || !parsed.repo) {
    return failure("Invalid GitHub URL", "agent-install", extension.id);
  }

  const { owner, repo, branch, subdir } = parsed;
  const cloneUrl = `https://github.com/${owner}/${repo}.git`;
  const branchFlag = branch ? `--branch ${branch}` : "";

  const workDir = await mkdtemp(join(tmpdir(), "opencode-agent-"));
  const cloneDir = join(workDir, "repo_clone");
  const destinationDir = process.cwd();

  try {
    const cloneCmd = subdir
      ? `git clone --depth 1 --filter=blob:none --sparse ${branchFlag} ${cloneUrl} "${cloneDir}"`
      : `git clone --depth 1 ${branchFlag} ${cloneUrl} "${cloneDir}"`;

    let result = await runShell(cloneCmd);
    if (!result.ok) {
      return failure(result.stderr || `git clone failed (${result.exitCode})`, cloneCmd, extension.id);
    }

    if (subdir) {
      const sparseCmd = `git -C "${cloneDir}" sparse-checkout set "${subdir}"`;
      result = await runShell(sparseCmd);
      if (!result.ok) {
        return failure(result.stderr || `sparse checkout failed (${result.exitCode})`, sparseCmd, extension.id);
      }
    }

    const sourceDir = subdir ? join(cloneDir, subdir) : cloneDir;
    if (extension.name) {
      const renameCmd = `if [ -f "${sourceDir}/README.md" ]; then mv "${sourceDir}/README.md" "${sourceDir}/${extension.name}-README.md"; fi`;
      const renameResult = await runShell(renameCmd);
      if (!renameResult.ok) {
        return failure(renameResult.stderr || `README rename failed (${renameResult.exitCode})`, renameCmd, extension.id);
      }
    }

    const copyCmd = `tar --exclude='.git' --exclude='.github' -C "${sourceDir}" -cf - . | tar -xf - -C "${destinationDir}"`;
    result = await runShell(copyCmd);
    if (!result.ok) {
      return failure(result.stderr || `File copy failed (${result.exitCode})`, copyCmd, extension.id);
    }

    if (global && GLOBAL_AGENT_DIR) {
      const moveCmd = `mkdir -p "${GLOBAL_AGENT_DIR}" && if [ -d "${LOCAL_AGENT_DIR}" ]; then find "${LOCAL_AGENT_DIR}" -maxdepth 1 -type f -name '*.md' -print0 | xargs -0 -r -I{} mv "{}" "${GLOBAL_AGENT_DIR}/"; fi`;
      result = await runShell(moveCmd, destinationDir);
      if (!result.ok) {
        return failure(result.stderr || `Global move failed (${result.exitCode})`, moveCmd, extension.id);
      }
    }

    onStatusUpdate?.(extension.id, "installed");
    return { success: true, extensionId: extension.id } satisfies InstallationResult;
  } catch (err) {
    return {
      success: false,
      error: {
        type: "UNKNOWN_ERROR",
        extensionId: extension.id,
        message: err instanceof Error ? err.message : "Install failed",
      },
    };
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
