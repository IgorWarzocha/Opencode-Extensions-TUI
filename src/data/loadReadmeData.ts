import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { readFile } from "fs/promises";
import type { Extension } from "../types/extension";

const __dirname = dirname(fileURLToPath(import.meta.url));
const detailsDir = join(__dirname, "..", "..", "opencode-directory", "details");

function parseYamlFrontmatter(content: string): { frontmatter: any; content: string } {
  const frontmatterRegex = /^\s*===FRONTMATTER===\s*\n([\s\S]*?)\n===FRONTMATTER===\s*\n?([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) return { frontmatter: {}, content };

  const frontmatterText = match[1];
  const frontmatter: any = {};

  if (frontmatterText) {
    frontmatterText.split("\n").forEach((line) => {
      const colonIndex = line.indexOf(":");
      if (colonIndex <= 0) return;

      const key = line.substring(0, colonIndex).trim();
      let value: string | string[] = line.substring(colonIndex + 1).trim();

      if (value.startsWith("\"") && value.endsWith("\"")) {
        value = value.slice(1, -1);
      } else if (value === '""') {
        value = "";
      } else if (!isNaN(Number(value))) {
        value = String(Number(value));
      } else if (value.startsWith("[") && value.endsWith("]")) {
        value = value
          .slice(1, -1)
          .split(",")
          .map((item: string) => item.trim().replace(/"/g, ""));
      }

      frontmatter[key] = value;
    });
  }

  return { frontmatter, content: match[2] || "" };
}

function repoPathCandidates(url: string | undefined | null): string[] {
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

function nameCandidates(value: string | undefined | null): string[] {
  if (!value) return [];
  const raw = value.trim();
  if (!raw) return [];
  const underscored = raw.replace(/[^A-Za-z0-9]+/g, "_");
  return Array.from(new Set([`${raw}.md`, `${underscored}.md`]));
}

async function readReadmeFile(filename: string): Promise<Partial<Extension> | null> {
  const filePath = join(detailsDir, filename);
  try {
    const content = await readFile(filePath, "utf8");
    const { frontmatter, content: readmeContent } = parseYamlFrontmatter(content);

    return {
      name: frontmatter.name || filename.replace(".md", ""),
      display_name: frontmatter.display_name || frontmatter.name || filename.replace(".md", ""),
      description: frontmatter.description || "",
      long_description: readmeContent || "",
      author: frontmatter.author || null,
      author_url: frontmatter.author_url || null,
      repository_url: frontmatter.repository_url || null,
      license: frontmatter.license || null,
      star_count: Number(frontmatter.star_count) || 0,
      download_count: Number(frontmatter.download_count) || 0,
      forks: Number(frontmatter.forks) || 0,
      language: frontmatter.language || null,
      install_command: frontmatter.install_command || null,
      curator_notes: frontmatter.curator_notes || null,
      keywords: Array.isArray(frontmatter.keywords)
        ? frontmatter.keywords
        : typeof frontmatter.keywords === "string"
          ? frontmatter.keywords.split(",").map((k: string) => k.trim())
          : [],
      homepage: frontmatter.homepage || frontmatter.repository_url || null,
      updated_at: frontmatter.updated_at || null,
      category: frontmatter.category || "",
    } as Partial<Extension>;
  } catch (error) {
    console.error(`Error reading README for ${filename}:`, error);
    return null;
  }
}

export async function loadReadmeData(
  extensionName: string,
  repositoryUrl?: string | null,
  displayName?: string | null
): Promise<Partial<Extension>> {
  const candidates = new Set<string>();

  nameCandidates(extensionName).forEach((c) => candidates.add(c));
  nameCandidates(displayName).forEach((c) => candidates.add(c));
  repoPathCandidates(repositoryUrl).forEach((slug) => {
    candidates.add(`${slug}.md`);
    const parts = slug.split("_");
    if (parts.length >= 2) {
      candidates.add(`${parts.slice(1).join("_")}.md`);
    }
  });

  for (const candidate of candidates) {
    const filePath = join(detailsDir, candidate);
    const fileHandle = Bun.file(filePath);
    if (await fileHandle.exists()) {
      const data = await readReadmeFile(candidate);
      if (data) return data;
    }
  }

  return {};
}
