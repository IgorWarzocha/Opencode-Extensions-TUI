/**
 * Database service for managing extension data persistence and search functionality.
 * Provides SQLite-based storage with full-text search capabilities for extensions.
 */
import { Database } from "bun:sqlite";
import type { Extension } from "../types/extension";
import { existsSync } from "fs";

// Database singleton
let db: Database | null = null;

const DB_PATH = "extensions.db";

export class DatabaseService {
  static init() {
    if (db) return;
    
    if (!existsSync(DB_PATH)) {
      console.warn("Database file not found at", DB_PATH);
      return;
    }
    
    db = new Database(DB_PATH);
  }

  static getAllExtensions(): Extension[] {
    if (!db) this.init();
    if (!db) return [];

    try {
      const rows = db.query(`
        SELECT * FROM extensions
      `).all() as any[];

      return rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        readme: row.readme,
        author: row.author,
        author_url: row.author_url,
        repository_url: row.repository_url,
        category: row.category,
        install_command: row.install_command,
        install_method: row.install_method,
        featured: Boolean(row.featured),
        status: "available"
      }));
    } catch (error) {
      console.error("Failed to fetch extensions from DB:", error);
      return [];
    }
  }

  static search(query: string): Extension[] {
    if (!db) this.init();
    if (!db) return [];

    try {
      const rows = db.query(`
        SELECT e.* 
        FROM extensions e
        JOIN extensions_fts fts ON e.rowid = fts.rowid
        WHERE extensions_fts MATCH ?
        ORDER BY rank
      `).all(query) as any[];

      return rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        readme: row.readme,
        author: row.author,
        author_url: row.author_url,
        repository_url: row.repository_url,
        category: row.category,
        install_command: row.install_command,
        install_method: row.install_method,
        featured: Boolean(row.featured),
        status: "available"
      }));
    } catch (error) {
      console.error("Search failed:", error);
      return [];
    }
  }
}
