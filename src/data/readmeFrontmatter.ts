/**
 * Shared parser for README frontmatter blocks delimited by ===FRONTMATTER=== markers.
 * Produces a typed frontmatter object and markdown body for downstream loaders.
 * Normalizes numeric and array-like values while ignoring unknown keys.
 */
import type { InstallMethod } from "../types/extension";

export const FRONTMATTER_KEYS = [
  "name",
  "display_name",
  "description",
  "author",
  "author_url",
  "repository_url",
  "license",
  "star_count",
  "download_count",
  "forks",
  "language",
  "install_command",
  "install_method",
  "curator_notes",
  "keywords",
  "homepage",
  "updated_at",
  "category",
  "package_name",
  "version",
  "created_at",
] as const satisfies readonly string[];

type FrontmatterKey = (typeof FRONTMATTER_KEYS)[number];

type Frontmatter = Partial<{
  name: string;
  display_name: string;
  description: string;
  author: string;
  author_url: string;
  repository_url: string;
  license: string;
  star_count: number;
  download_count: number;
  forks: number;
  language: string;
  install_command: string;
  install_method: InstallMethod;
  curator_notes: string;
  keywords: string[];
  homepage: string;
  updated_at: string;
  category: string;
  package_name: string;
  version: string;
  created_at: string;
}>;

function isFrontmatterKey(value: string): value is FrontmatterKey {
  return (FRONTMATTER_KEYS as readonly string[]).includes(value);
}

function isInstallMethod(value: string): value is InstallMethod {
  return value === "npm" || value === "drop" || value === "bash";
}

function parseKeywords(raw: string): string[] {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/"/g, ""))
      .filter((item) => item.length > 0);
  }
  return trimmed.length > 0 ? trimmed.split(",").map((item) => item.trim()).filter(Boolean) : [];
}

function parseString(raw: string): string {
  if (raw === '""') return "";
  if (raw.startsWith("\"") && raw.endsWith("\"")) {
    return raw.slice(1, -1);
  }
  return raw;
}

function parseValue(key: FrontmatterKey, rawValue: string): Frontmatter[FrontmatterKey] | undefined {
  switch (key) {
    case "star_count":
    case "download_count":
    case "forks": {
      const numeric = Number(rawValue);
      return Number.isFinite(numeric) ? numeric : undefined;
    }
    case "keywords":
      return parseKeywords(rawValue);
    case "install_method":
      return isInstallMethod(rawValue) ? rawValue : undefined;
    default:
      return parseString(rawValue);
  }
}

export function parseReadmeFrontmatter(content: string): { frontmatter: Frontmatter; body: string } {
  const frontmatterRegex = /^\s*===FRONTMATTER===\s*\n([\s\S]*?)\n===FRONTMATTER===\s*\n?([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const frontmatterText = match[1];
  const body = match[2] ?? "";
  const frontmatter: Frontmatter = {};

  if (frontmatterText) {
    frontmatterText.split("\n").forEach((line) => {
      const colonIndex = line.indexOf(":");
      if (colonIndex <= 0) return;

      const key = line.substring(0, colonIndex).trim();
      const rawValue = line.substring(colonIndex + 1).trim();

      if (!isFrontmatterKey(key)) return;

      const parsed = parseValue(key, rawValue);
      if (parsed !== undefined) {
        frontmatter[key] = parsed as Frontmatter[FrontmatterKey];
      }
    });
  }

  return { frontmatter, body };
}
