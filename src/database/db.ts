import { Database } from "bun:sqlite";
import type { Extension } from "../types/extension";

const db = new Database("extensions.sqlite");

export function initDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS extensions (
      id INTEGER PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      display_name TEXT,
      description TEXT NOT NULL,
      long_description TEXT,
      source TEXT NOT NULL,
      repository_url TEXT,
      package_name TEXT,
      version TEXT NOT NULL,
      author TEXT NOT NULL,
      author_url TEXT,
      homepage TEXT,
      license TEXT,
      keywords TEXT,
      category TEXT NOT NULL,
      download_count INTEGER DEFAULT 0,
      star_count INTEGER DEFAULT 0,
      created_at DATETIME,
      updated_at DATETIME,
      status TEXT CHECK(status IN ('available', 'installed', 'update_available')),
      install_path TEXT,
      dependencies TEXT,
      opencode_min_version TEXT,
      featured BOOLEAN DEFAULT FALSE,
      curated_rating INTEGER CHECK(curated_rating BETWEEN 1 AND 5),
      curator_notes TEXT,
      install_command TEXT,
      manifest_json TEXT
    );
  `);

  // Check if data exists
  const count = db.query("SELECT count(*) as count FROM extensions").get() as { count: number };
  
  if (count.count === 0) {
    console.log("Seeding database...");
    const insert = db.prepare(`
      INSERT INTO extensions (
        name, display_name, description, long_description, source, repository_url, 
        version, author, author_url, homepage, license, keywords, category, 
        download_count, star_count, created_at, updated_at, status, dependencies, 
        opencode_min_version, featured, curated_rating, curator_notes, install_command, manifest_json
      ) VALUES (
        $name, $display_name, $description, $long_description, $source, $repository_url,
        $version, $author, $author_url, $homepage, $license, $keywords, $category,
        $download_count, $star_count, $created_at, $updated_at, $status, $dependencies,
        $opencode_min_version, $featured, $curated_rating, $curator_notes, $install_command, $manifest_json
      )
    `);

    const sampleData = [
      {
        $name: 'opencode-github-helper',
        $display_name: 'GitHub Helper',
        $description: 'GitHub integration for OpenCode with PR management',
        $long_description: 'Full GitHub integration inside OpenCode. Create PRs, review code, manage issues directly from your terminal.',
        $source: 'github',
        $repository_url: 'https://github.com/devteam/opencode-github-helper',
        $version: '2.1.0',
        $author: 'devteam',
        $author_url: 'https://github.com/devteam',
        $homepage: 'https://github.com/devteam/opencode-github-helper#readme',
        $license: 'MIT',
        $keywords: JSON.stringify(["github", "opencode", "productivity", "pr"]),
        $category: 'Integrations',
        $download_count: 2300,
        $star_count: 156,
        $created_at: '2024-11-15',
        $updated_at: '2024-12-01',
        $status: 'available',
        $dependencies: '[]',
        $opencode_min_version: '1.0.0',
        $featured: true,
        $curated_rating: 5,
        $curator_notes: 'Essential GitHub integration - highest quality code',
        $install_command: 'bun install opencode-github-helper',
        $manifest_json: JSON.stringify({"main": "dist/index.js", "permissions": ["network.request"]})
      },
      {
        $name: 'monokai-dark-theme',
        $display_name: 'Monokai Dark',
        $description: 'Beautiful Monokai theme for OpenCode TUI',
        $long_description: 'A faithful recreation of the classic Monokai color scheme, optimized for high-contrast TUI environments.',
        $source: 'npm',
        $repository_url: 'https://github.com/themer/monokai',
        $version: '1.4.2',
        $author: 'themer',
        $author_url: 'https://github.com/themer',
        $homepage: null,
        $license: 'MIT',
        $keywords: JSON.stringify(["theme", "dark", "colors"]),
        $category: 'Themes',
        $download_count: 567,
        $star_count: 89,
        $created_at: '2024-10-01',
        $updated_at: '2024-11-20',
        $status: 'available',
        $dependencies: '[]',
        $opencode_min_version: '1.0.0',
        $featured: false,
        $curated_rating: 4,
        $curator_notes: 'Solid theme implementation',
        $install_command: 'bun install monokai-dark-theme',
        $manifest_json: null
      },
      {
        $name: 'json-formatter-pro',
        $display_name: 'JSON Formatter Pro',
        $description: 'Advanced JSON validation and formatting tool',
        $long_description: 'Format large JSON files with ease. Includes validation, sorting, and color highlighting.',
        $source: 'npm',
        $repository_url: 'https://github.com/utils/json-fmt',
        $version: '3.0.1',
        $author: 'json-wizard',
        $author_url: null,
        $homepage: null,
        $license: 'Apache-2.0',
        $keywords: JSON.stringify(["json", "formatter", "tool"]),
        $category: 'Tools',
        $download_count: 12000,
        $star_count: 450,
        $created_at: '2024-01-15',
        $updated_at: '2024-12-02',
        $status: 'installed',
        $dependencies: '[]',
        $opencode_min_version: '1.0.0',
        $featured: true,
        $curated_rating: 5,
        $curator_notes: 'Best in class JSON tool',
        $install_command: 'bun install json-formatter-pro',
        $manifest_json: null
      },
       {
        $name: 'react-snippets',
        $display_name: 'React Snippets',
        $description: 'Common React 19 patterns snippets',
        $long_description: 'Includes snippets for useActionState, Server Components, and more.',
        $source: 'github',
        $repository_url: 'https://github.com/react/snippets',
        $version: '1.0.0',
        $author: 'facebook',
        $author_url: 'https://github.com/facebook',
        $homepage: null,
        $license: 'MIT',
        $keywords: JSON.stringify(["react", "snippets", "code"]),
        $category: 'Tools',
        $download_count: 5000,
        $star_count: 300,
        $created_at: '2024-11-01',
        $updated_at: '2024-11-01',
        $status: 'available',
        $dependencies: '[]',
        $opencode_min_version: '1.0.0',
        $featured: false,
        $curated_rating: 4,
        $curator_notes: null,
        $install_command: 'bun install react-snippets',
        $manifest_json: null
      },
      {
        $name: 'git-lens-lite',
        $display_name: 'GitLens Lite',
        $description: 'Visualize git blame inline',
        $long_description: 'Lightweight version of GitLens for TUI. See who changed what line.',
        $source: 'github',
        $repository_url: 'https://github.com/git/lens',
        $version: '0.5.0',
        $author: 'git-guru',
        $author_url: null,
        $homepage: null,
        $license: 'GPL-3.0',
        $keywords: JSON.stringify(["git", "blame", "scms"]),
        $category: 'Integrations',
        $download_count: 890,
        $star_count: 120,
        $created_at: '2024-09-10',
        $updated_at: '2024-10-05',
        $status: 'available',
        $dependencies: '[]',
        $opencode_min_version: '1.0.0',
        $featured: false,
        $curated_rating: 3,
        $curator_notes: 'Good start, needs more features',
        $install_command: 'bun install git-lens-lite',
        $manifest_json: null
      }
    ];

    for (const data of sampleData) {
      insert.run(data);
    }
  }
}

export function getAllExtensions(): Extension[] {
  const rows = db.query("SELECT * FROM extensions ORDER BY name ASC").all() as any[];
  return rows.map(row => ({
    ...row,
    keywords: JSON.parse(row.keywords || '[]'),
    dependencies: JSON.parse(row.dependencies || '[]'),
    featured: Boolean(row.featured)
  }));
}

export function updateExtensionStatus(id: number, status: string) {
  db.run("UPDATE extensions SET status = ? WHERE id = ?", [status, id]);
}
