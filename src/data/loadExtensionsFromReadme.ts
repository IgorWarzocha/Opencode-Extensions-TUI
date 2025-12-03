import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { readFile, readdir } from "fs/promises";
import type { Extension } from "../types/extension";

const __dirname = dirname(fileURLToPath(import.meta.url));
const detailsDir = join(__dirname, "..", "..", "opencode-directory", "details");

function parseYamlFrontmatter(content: string): { frontmatter: any; content: string } {
  const frontmatterRegex = /^\s*===FRONTMATTER===\s*\n([\s\S]*?)\n===FRONTMATTER===\s*\n?([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, content };
  }

  const frontmatterText = match[1];
  const frontmatter: any = {};

  if (frontmatterText) {
    frontmatterText.split("\n").forEach((line) => {
      const colonIndex = line.indexOf(":");
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();

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
      }
    });
  }

  return { frontmatter, content: match[2] || "" };
}

async function readReadmeFile(filename: string): Promise<Extension | null> {
  const filePath = join(detailsDir, filename);
  try {
    const content = await readFile(filePath, "utf8");
    const { frontmatter, content: readmeContent } = parseYamlFrontmatter(content);

    return {
      id: 0,
      name: frontmatter.name || filename.replace(".md", ""),
      display_name: frontmatter.display_name || frontmatter.name || filename.replace(".md", ""),
      package_name: frontmatter.name || null,
      description: frontmatter.description || "",
      long_description: readmeContent || "",
      author: frontmatter.author || null,
      author_url: frontmatter.author_url || null,
      repository_url: frontmatter.repository_url || "",
      version: frontmatter.version || null,
      category: frontmatter.category || "",
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
      created_at: null,
      updated_at: frontmatter.updated_at || null,
      status: "available",
      install_path: null,
      dependencies: [],
      opencode_min_version: null,
      featured: false,
      curated_rating: null,
      manifest_json: null,
      source: "readme",
      githubData: null,
    } as Extension;
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return null;
  }
}

export async function loadExtensionsFromReadme(): Promise<Extension[]> {
  const files = await readdir(detailsDir);
  const markdownFiles = files.filter((f) => f.endsWith(".md") && !f.endsWith(".md.content"));

  const extensions = await Promise.all(
    markdownFiles.map(async (filename, index) => {
      const ext = await readReadmeFile(filename);
      if (ext) {
        ext.id = index + 1;
        return ext;
      }
      return null;
    })
  );

  return extensions.filter((ext): ext is Extension => ext !== null);
}

// Backwards compatibility export
export async function loadExtensions(): Promise<Extension[]> {
  return loadExtensionsFromReadme();
}
