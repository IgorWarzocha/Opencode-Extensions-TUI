/**
 * Resolves README content for an extension from the opencode-directory details folder.
 * Uses frontmatter parsing shared with loadExtensionsFromReadme and returns partial Extension data.
 */
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFile } from "fs/promises";
import type { Extension } from "../types/extension";
import { repoPathCandidates, nameCandidates, resolveFilePaths } from "../utils/file";
import { parseReadmeFrontmatter } from "./readmeFrontmatter";

const __dirname = dirname(fileURLToPath(import.meta.url));
const detailsDir = join(__dirname, "..", "..", "opencode-directory", "details");

async function readReadmeFile(filename: string): Promise<Partial<Extension> | null> {
  const filePath = join(detailsDir, filename);
  try {
    const content = await readFile(filePath, "utf8");
    const { frontmatter, body } = parseReadmeFrontmatter(content);

    return {
      name: frontmatter.name ?? filename.replace(".md", ""),
      display_name: frontmatter.display_name ?? frontmatter.name ?? filename.replace(".md", ""),
      description: frontmatter.description ?? "",
      long_description: body,
      author: frontmatter.author ?? null,
      author_url: frontmatter.author_url ?? null,
      repository_url: frontmatter.repository_url ?? "",
      license: frontmatter.license ?? null,
      star_count: frontmatter.star_count ?? 0,
      download_count: frontmatter.download_count ?? 0,
      forks: frontmatter.forks ?? 0,
      language: frontmatter.language ?? null,
      install_command: frontmatter.install_command ?? null,
      install_method: frontmatter.install_method ?? null,
      curator_notes: frontmatter.curator_notes ?? null,
      keywords: frontmatter.keywords ?? [],
      homepage: frontmatter.homepage ?? frontmatter.repository_url ?? null,
      updated_at: frontmatter.updated_at ?? null,
      category: frontmatter.category ?? "",
    } satisfies Partial<Extension>;
  } catch (error) {
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

  const resolvedFilePath = await resolveFilePaths(detailsDir, Array.from(candidates));
  if (resolvedFilePath) {
    const filename = resolvedFilePath.split("/").pop() ?? "";
    const data = await readReadmeFile(filename);
    if (data) return data;
  }

  return {};
}
