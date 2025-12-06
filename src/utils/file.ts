/**
 * File system utilities for consistent path resolution and file handling across the application.
 * Provides reusable functions for generating file path candidates and resolving file locations.
 * Follows DRY principle by centralizing common file operations.
 */

import { join } from "path";

/**
 * Generates file path candidates from a repository URL.
 * Extracts owner and repository name to create normalized file paths.
 * 
 * @param url - Repository URL to extract path candidates from
 * @returns Array of possible file path candidates
 */
export function repoPathCandidates(url: string | undefined | null): string[] {
  if (!url) return [];
  try {
    const u = new URL(url);
    const parts = u.pathname.replace(/^\//, "").split("/");
    if (parts.length < 2) return [];
    const owner = parts[0];
    const repo = parts.slice(1).join("/");
    const base = `${owner}_${repo}`;
    const normalized = base.replace(/[^A-Za-z0-9]+/g, "_");
    return [base, normalized];
  } catch (_) {
    return [];
  }
}

/**
 * Generates file name candidates from an extension name.
 * Creates both raw and underscored versions for flexible file matching.
 * 
 * @param value - Extension name to generate candidates for
 * @returns Array of possible file name candidates
 */
export function nameCandidates(value: string | undefined | null): string[] {
  if (!value) return [];
  const raw = value.trim();
  if (!raw) return [];
  const underscored = raw.replace(/[^A-Za-z0-9]+/g, "_");
  return Array.from(new Set([`${raw}.md`, `${underscored}.md`]));
}

/**
 * Resolves file paths by testing multiple candidates against a base directory.
 * Returns the first existing file path from the candidate list.
 * 
 * @param baseDir - Base directory to search in
 * @param candidates - Array of file path candidates to test
 * @returns First existing file path or null if none found
 */
export async function resolveFilePaths(
  baseDir: string, 
  candidates: string[]
): Promise<string | null> {
  for (const candidate of candidates) {
    const filePath = join(baseDir, candidate);
    const fileHandle = Bun.file(filePath);
    if (await fileHandle.exists()) {
      return filePath;
    }
  }
  return null;
}