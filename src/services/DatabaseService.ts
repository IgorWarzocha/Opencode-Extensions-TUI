/**
 * Database service for managing extension data persistence and search functionality.
 * Provides SQLite-based storage with full-text search capabilities for extensions.
 */
import { Database } from "bun:sqlite";
import type { Extension, SkillInfo } from "../types/extension";
import { existsSync } from "fs";

let db: Database | null = null;
const DB_PATH = "extensions.db";

function parseSkillsData(dataStr: string | null): SkillInfo[] | undefined {
  if (!dataStr) return undefined;
  try {
    const parsed = JSON.parse(dataStr);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function rowToExtension(row: Record<string, unknown>): Extension {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    readme: row.readme as string,
    author: row.author as string,
    author_url: row.author_url as string | null,
    repository_url: row.repository_url as string,
    category: row.category as string,
    install_command: row.install_command as string | null,
    install_method: row.install_method as string | null,
    featured: Boolean(row.featured),
    data: parseSkillsData(row.data as string | null),
    status: "available",
  };
}

export class DatabaseService {
  static init() {
    if (db) return;
    if (!existsSync(DB_PATH)) return;
    db = new Database(DB_PATH);
  }

  static getAllExtensions(): Extension[] {
    if (!db) this.init();
    if (!db) return [];

    try {
      const rows = db.query(`SELECT * FROM extensions`).all() as Record<
        string,
        unknown
      >[];
      return rows.map(rowToExtension);
    } catch {
      return [];
    }
  }

  static search(query: string): Extension[] {
    if (!db) this.init();
    if (!db) return [];

    try {
      const rows = db
        .query(
          `
        SELECT e.* 
        FROM extensions e
        JOIN extensions_fts fts ON e.rowid = fts.rowid
        WHERE extensions_fts MATCH ?
        ORDER BY rank
      `,
        )
        .all(query) as Record<string, unknown>[];
      return rows.map(rowToExtension);
    } catch {
      return [];
    }
  }
}
