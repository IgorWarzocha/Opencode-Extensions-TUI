#!/usr/bin/env bun
import { Database } from "bun:sqlite";
import { readFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

// Configuration
const EXTENSIONS_ROOT = "./extensions";
const DB_PATH = "extensions.db";

// Valid categories (plural form)
const CATEGORIES = ['Plugins', 'Agents', 'Tools', 'Commands', 'Themes', 'Bundles'];

// Helper to convert repo URL to raw content URL
function getRawReadmeUrl(repoUrl: string): string | null {
  if (!repoUrl) return null;

  if (repoUrl.includes("github.com")) {
    const rawBase = repoUrl.replace("github.com", "raw.githubusercontent.com");
    return `${rawBase}/main/README.md`;
  }
  return null;
}

async function loadReadme(extensionId: string, repoUrl: string): Promise<string> {
  const rawUrl = getRawReadmeUrl(repoUrl);
  
  if (!rawUrl) {
    return "";
  }

  try {
    let response = await fetch(rawUrl);
    
    if (!response.ok) {
      const masterUrl = rawUrl.replace("/main/", "/master/");
      response = await fetch(masterUrl);
    }

    if (!response.ok) {
      return "";
    }

    const text = await response.text();
    return text.trim();

  } catch {
    return "";
  }
}

async function main() {

  const db = new Database(DB_PATH);

  // Schema Setup
  db.exec(`
    DROP TABLE IF EXISTS extensions;
    DROP TABLE IF EXISTS categories;
    DROP TABLE IF EXISTS extensions_fts;

    CREATE TABLE extensions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      readme TEXT,
      author TEXT NOT NULL,
      author_url TEXT,
      repository_url TEXT NOT NULL,
      category TEXT NOT NULL,
      install_command TEXT,
      install_method TEXT,
      featured INTEGER DEFAULT 0
    );

    CREATE TABLE categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT
    );

    CREATE VIRTUAL TABLE extensions_fts USING fts5(
      name, description, readme, author
    );

    CREATE INDEX idx_extensions_category ON extensions(category);
    CREATE INDEX idx_extensions_author ON extensions(author);

    INSERT INTO categories (id, name, description) VALUES
    ('Plugins', 'Plugins', 'JavaScript/TypeScript plugins that hook into OpenCode events'),
    ('Agents', 'Agents', 'Specialized AI agents for specific tasks and workflows'),
    ('Tools', 'Tools', 'Custom tools for extended functionality'),
    ('Commands', 'Commands', 'Custom commands and command extensions'),
    ('Themes', 'Themes', 'Visual themes and color schemes for TUI'),
    ('Bundles', 'Bundles', 'Complete configuration packages and setups');
  `);

  const insertStmt = db.prepare(`
    INSERT INTO extensions (
      id, 
      name, 
      description, 
      readme, 
      author, 
      author_url, 
      repository_url, 
      category, 
      install_command, 
      install_method,
      featured
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);



  let totalCount = 0;

  for (const category of CATEGORIES) {
    const categoryDir = join(EXTENSIONS_ROOT, category);
    console.log(`🔍 Checking category: ${category} at ${categoryDir}`);
    
    if (!existsSync(categoryDir)) {
      console.log(`❌ Directory not found: ${categoryDir}`);
      continue;
    }

    const files = readdirSync(categoryDir).filter(f => f.endsWith(".json"));
    console.log(`📁 Found ${files.length} files in ${categoryDir}:`, files);
    
    for (const file of files) {
      try {
        const filePath = join(categoryDir, file);
        const raw = readFileSync(filePath, "utf-8");
        const ext = JSON.parse(raw);

        // Async load of readme
        const readme = await loadReadme(ext.id, ext.repository_url);

        insertStmt.run(
          ext.id,
          ext.name,
          ext.description,
          readme,
          ext.author,
          ext.author_url || null,
          ext.repository_url,
          ext.category,
          ext.install_command || null,
          ext.install_method || null,
          ext.featured ? 1 : 0
        );

        console.log(`  ✅ Loaded ${category}/${ext.id} (${readme.length} chars)`);
        totalCount++;

      } catch (e) {
        console.error(`  ❌ Failed to load ${file}:`, e);
      }
    }
  }

  // Populate FTS
  db.exec(`
    INSERT INTO extensions_fts(rowid, name, description, readme, author)
    SELECT rowid, name, description, readme, author FROM extensions
  `);

  console.log(`\n🎉 Database built successfully with ${totalCount} extensions.`);
  db.close();
}

if (import.meta.main) {
  main();
}