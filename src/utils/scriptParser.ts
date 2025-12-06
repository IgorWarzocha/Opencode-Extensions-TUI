/**
 * Utilities for parsing installation scripts and extracting URLs.
 * Handles common patterns like `curl -sSL <URL> | bash`.
 */

/**
 * Extracts the script URL from a curl-based install command.
 * Supports common patterns:
 * - `curl -sSL <URL> | bash`
 * - `curl -fsSL <URL> | sh`
 * - `curl <URL> | bash`
 * 
 * @param command - The install command string
 * @returns The extracted URL or null if no URL found
 */
export function extractScriptUrl(command: string): string | null {
  if (!command) return null;

  // Match curl commands with various flags followed by URL
  // Patterns: curl [-flags] "URL" or curl [-flags] URL
  const patterns = [
    // Quoted URL after curl with flags
    /curl\s+(?:-[\w]+\s+)*["']([^"']+)["']/,
    // Unquoted URL after curl with flags (captures until pipe or end)
    /curl\s+(?:-[\w]+\s+)*(https?:\/\/[^\s|]+)/,
    // URL directly after curl (no flags)
    /curl\s+(https?:\/\/[^\s|]+)/,
  ];

  for (const pattern of patterns) {
    const match = command.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Determines if a command is a curl-pipe-bash style installation.
 * These commands should show a preview before execution.
 * 
 * @param command - The install command string
 * @returns True if the command pipes curl output to a shell
 */
export function isCurlPipeInstall(command: string): boolean {
  if (!command) return false;
  
  // Match: curl ... | bash/sh/zsh
  return /curl\s+.*\|\s*(bash|sh|zsh)/.test(command);
}

/**
 * Fetches script content from a URL.
 * Returns the script text or an error message.
 * 
 * @param url - The URL to fetch
 * @returns Object with content or error
 */
export async function fetchScriptContent(
  url: string
): Promise<{ success: true; content: string } | { success: false; error: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'extensionstui/1.0',
        'Accept': 'text/plain, application/x-sh, */*',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const content = await response.text();
    return { success: true, content };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch script',
    };
  }
}
