import type { Extension } from "../../types/extension";
import type { InstallationResult, StatusUpdateCallback } from "./types.js";

interface GithubTreeInfo {
  owner?: string;
  repo?: string;
  branch?: string;
  subdir?: string;
}

export function parseGithubTreeUrl(url: string): GithubTreeInfo | null {
  // Try matching specific tree/subdirectory
  // Format: https://github.com/owner/repo/tree/branch/subdir
  const treeMatch = url.match(/https?:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)/);
  if (treeMatch) {
    const [, owner, repo, branch, subdir] = treeMatch;
    return { owner, repo, branch, subdir };
  }

  // Try matching root repo
  // Format: https://github.com/owner/repo or https://github.com/owner/repo/
  const rootMatch = url.match(/https?:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/)?$/);
  if (rootMatch) {
    const [, owner, repo] = rootMatch;
    return { owner, repo };
  }

  return null;
}

export async function installAgent(
  extension: Extension,
  { force, global }: { force?: boolean; global?: boolean } = {},
  _onStatusUpdate?: StatusUpdateCallback
): Promise<InstallationResult> {
  const url = extension.install_command;
  if (!url) {
    return {
      success: false,
      error: {
        type: "COMMAND_FAILED",
        command: "agent-install",
        message: "No install command/URL provided",
      },
    };
  }

  const parsed = parseGithubTreeUrl(url);
  if (!parsed) {
    return {
      success: false,
      error: {
        type: "COMMAND_FAILED",
        command: "agent-install",
        message: "Invalid GitHub URL",
      },
    };
  }

  const { owner, repo, branch, subdir } = parsed;
  if (!owner || !repo) {
    return {
      success: false,
      error: {
        type: "COMMAND_FAILED",
        command: "agent-install",
        message: "Invalid GitHub URL: missing owner or repo",
      },
    };
  }
  const cloneUrl = `https://github.com/${owner!}/${repo!}.git`;
  const toolName = extension.name;

  // Determine source path within the clone
  // If subdir is present, we copy from there. If not, we copy from root of clone.
  const sourceDir = subdir || ".";
  
  // Construct Git Commands
  const gitCommands: string[] = [];
  const branchFlag = branch ? `--branch ${branch}` : "";

  if (subdir) {
    // Strategy A: Sparse Checkout (for subdirectories)
    // We strictly need the branch here, but the regex guarantees it if subdir is present
    gitCommands.push(
      `git clone --depth 1 --filter=blob:none --sparse ${branchFlag} ${cloneUrl} repo_clone`
    );
    gitCommands.push(`git -C repo_clone sparse-checkout set ${subdir}`);
  } else {
    // Strategy B: Shallow Clone (for full repo)
    gitCommands.push(`git clone --depth 1 ${branchFlag} ${cloneUrl} repo_clone`);
  }

  // File Operations
  const localAgentDir = "./.opencode/agent";
  const globalAgentDir = "$HOME/.config/opencode/agent";

  const readmeRename = toolName
    ? `if [ -f "repo_clone/${sourceDir}/README.md" ]; then mv "repo_clone/${sourceDir}/README.md" "repo_clone/${sourceDir}/${toolName}-README.md"; fi`
    : "";

  const copyAllFilesToRoot = `tar --exclude='.git' --exclude='.github' -C "repo_clone/${sourceDir}" -cf - . | tar -xf - -C ./`;

  const moveAgentMarkdownToGlobal = `mkdir -p "${globalAgentDir}" && if [ -d "${localAgentDir}" ]; then find "${localAgentDir}" -maxdepth 1 -type f -name '*.md' -print0 | xargs -0 -r -I{} mv "{}" "${globalAgentDir}/"; fi`;

  const cmd = [
    "bash",
    "-c",
    [
      ...gitCommands,
      readmeRename,
      // Step 1: Copy everything from the clone into the working directory (includes renamed README and .opencode/agent contents)
      copyAllFilesToRoot,
      // Step 2: Clean up clone
      "rm -rf repo_clone",
      // Step 3: If global, move only staged agent markdown files to the global agent directory
      ...(global ? [moveAgentMarkdownToGlobal] : []),
    ]
      .filter(Boolean)
      .join(" && "),
  ];



  try {
    const proc = Bun.spawn(cmd, { stdout: "pipe", stderr: "pipe" });
    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      const stderr = await new Response(proc.stderr).text();
      return {
        success: false,
        error: {
          type: "COMMAND_FAILED",
          command: "agent-install",
          message: stderr || `Exit code: ${exitCode}`,
        },
      };
    }

    return { success: true, extensionId: extension.id };
  } catch (err) {
    return {
      success: false,
      error: {
        type: "UNKNOWN_ERROR",
        extensionId: extension.id,
        message: err instanceof Error ? err.message : "Install failed",
      },
    };
  }
}
