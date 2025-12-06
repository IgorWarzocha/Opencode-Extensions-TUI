/**
 * Loads extension metadata from README markdown files stored under opencode-directory/details.
 * Parses frontmatter using the shared parser and normalizes values into the Extension shape.
 * Provides a compatibility export matching the legacy loadExtensions signature.
 */
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFile, readdir } from "fs/promises";
import type { Extension } from "../types/extension";
import { parseReadmeFrontmatter } from "./readmeFrontmatter";

const __dirname = dirname(fileURLToPath(import.meta.url));
const detailsDir = join(__dirname, "..", "..", "opencode-directory", "details");

function buildExtensionFromFrontmatter(
  filename: string,
  frontmatter: ReturnType<typeof parseReadmeFrontmatter>["frontmatter"],
  body: string
): Extension {
  const baseName = filename.replace(".md", "");

  return {
    id: 0,
    name: frontmatter.name ?? baseName,
    display_name: frontmatter.display_name ?? frontmatter.name ?? baseName,
    package_name: frontmatter.package_name ?? null,
    description: frontmatter.description ?? "",
    long_description: body,
    author: frontmatter.author ?? null,
    author_url: frontmatter.author_url ?? null,
    repository_url: frontmatter.repository_url ?? "",
    version: frontmatter.version ?? null,
    category: frontmatter.category ?? "",
    license: frontmatter.license ?? null,
    star_count: frontmatter.star_count ?? 0,
    download_count: frontmatter.download_count ?? 0,
    forks: frontmatter.forks ?? 0,
    language: frontmatter.language ?? null,
    created_at: frontmatter.created_at ?? null,
    updated_at: frontmatter.updated_at ?? null,
    status: "available",
    install_path: null,
    dependencies: [],
    opencode_min_version: null,
    featured: false,
    curated_rating: null,
    curator_notes: frontmatter.curator_notes ?? null,
    install_command: frontmatter.install_command ?? null,
    install_method: frontmatter.install_method ?? null,
    manifest_json: null,
    source: "readme",
    githubData: null,
    homepage: frontmatter.homepage ?? null,
    keywords: frontmatter.keywords ?? [],
  } satisfies Extension;
}

async function readReadmeFile(filename: string): Promise<Extension | null> {
  const filePath = join(detailsDir, filename);
  try {
    const content = await readFile(filePath, "utf8");
    const { frontmatter, body } = parseReadmeFrontmatter(content);
    return buildExtensionFromFrontmatter(filename, frontmatter, body);
  } catch (error) {
    return null;
  }
}

export async function loadExtensionsFromReadme(): Promise<Extension[]> {
  const files = await readdir(detailsDir);
  const markdownFiles = files.filter((f) => f.endsWith(".md") && !f.endsWith(".md.content"));

  const extensions = await Promise.all(
    markdownFiles.map(async (filename, index) => {
      const ext = await readReadmeFile(filename);
      if (!ext) return null;
      return { ...ext, id: index + 1 } satisfies Extension;
    })
  );

  return extensions.filter((ext): ext is Extension => ext !== null);
}

// Backwards compatibility export
export async function loadExtensions(): Promise<Extension[]> {
  return loadExtensionsFromReadme();
}
