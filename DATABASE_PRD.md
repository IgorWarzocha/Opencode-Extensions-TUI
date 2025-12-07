# Extensions Database System PRD

## Executive Summary

Revamp the extension management system from JSON-file-based to Bun-native SQLite database, maintaining the PR-based contribution workflow while dramatically improving performance and scalability.

## Current State Problems

- **Performance**: Multiple JSON file reads on every app startup
- **Redundancy**: Both SQLite database (unused) and JSON files exist
- **No Persistence**: Installation status lost on restart
- **Scalability**: Not designed for infinite extension growth
- **Inconsistency**: Database functions exist but aren't used

## Proposed Architecture

### Core Design Principles

1. **Single Source of Truth**: SQLite database as runtime data store
2. **PR-Based Workflow**: JSON/Markdown files remain contribution format
3. **Automated Pipeline**: CI/CD converts source files to database
4. **Bun Native**: Leverage `bun:sqlite` for maximum performance
5. **Download-on-Demand**: Fresh database fetched during TUI initialization

### Data Flow

```
PR Submission → Security Analysis → Merge → CI/CD Pipeline → SQLite Generation → Published Asset → TUI Download
```

## Technical Architecture

### Phase 1: Database Schema Design

```sql
-- Core extensions table
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
  install_method TEXT
);

-- Categories for filtering
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

-- Full-text search
CREATE VIRTUAL TABLE extensions_fts USING fts5(
  name, description, readme, author
);

-- Indexes
CREATE INDEX idx_extensions_category ON extensions(category);
CREATE INDEX idx_extensions_author ON extensions(author);

-- Default Categories
INSERT INTO categories (id, name, description) VALUES
('plugin', 'Plugin', 'JavaScript/TypeScript plugins that hook into OpenCode events'),
('agent', 'Agent', 'Specialized AI agents for specific tasks and workflows'),
('tool', 'Tool', 'Custom tools for extended functionality'),
('command', 'Command', 'Custom commands and command extensions'),
('theme', 'Theme', 'Visual themes and color schemes for TUI'),
('bundle', 'Bundle', 'Complete configuration packages and setups');
```

### Phase 2: Build Pipeline

#### Database Builder Script
```typescript
// scripts/build-database.ts
import { Database } from "bun:sqlite";
import { loadExtensionsFromJson } from "../src/data/loadExtensionsFromReadme.ts";

const db = new Database("extensions.db");

// Create schema
db.exec(`
  -- Schema creation here
`);

// Import data from JSON files
const extensions = await loadExtensionsFromJson();
const stmt = db.prepare(`
  INSERT INTO extensions (id, name, description, readme, author, author_url, repository_url, category, install_command, install_method)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const ext of extensions) {
  stmt.run(ext.id, ext.name, ext.description, ext.readme, ext.author, ext.author_url, ext.repository_url, ext.category, ext.install_command, ext.install_method);
}

db.close();
```

#### GitHub Actions Workflow
```yaml
# .github/workflows/build-database.yml
name: Build Extension Database

on:
  push:
    branches: [main]
  pull_request:
    types: [closed]

jobs:
  build:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action == 'closed' && github.event.pull_request.merged == true)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        
      - name: Build Database
        run: bun run scripts/build-database.ts
        
      - name: Generate Version Info
        run: |
          echo "DB_VERSION=$(git rev-parse --short HEAD)" >> $GITHUB_ENV
          echo "DB_TIMESTAMP=$(date -u +%Y%m%d%H%M%S)" >> $GITHUB_ENV
          
      - name: Upload Database Asset
        uses: actions/upload-release-asset@v1
        with:
          upload_url: https://uploads.github.com/repos/your-org/extensionstui/releases/1
          asset_path: ./extensions.db
          asset_name: extensions-${{ env.DB_VERSION }}-${{ env.DB_TIMESTAMP }}.db
          asset_content_type: application/x-sqlite3
```

### Phase 3: TUI Integration

#### Database Service
```typescript
// src/services/database.ts
import { Database } from "bun:sqlite";

export class ExtensionDatabase {
  private db: Database | null = null;
  private version: string | null = null;
  
  async initialize(): Promise<void> {
    // Download latest database
    await this.downloadLatestDatabase();
    
    // Open database
    this.db = new Database("extensions.db");
    
    // Database is ready to use
  }
  
  async downloadLatestDatabase(): Promise<void> {
    // Fetch latest release from GitHub API
    const response = await fetch("https://api.github.com/repos/your-org/extensionstui/releases/latest");
    const release = await response.json();
    
    // Download database asset
    const dbAsset = release.assets.find((asset: any) => asset.name.endsWith('.db'));
    const dbResponse = await fetch(dbAsset.browser_download_url);
    const dbBuffer = await dbResponse.arrayBuffer();
    
    // Save to local file
    await Bun.write("extensions.db", dbBuffer);
  }
  
  searchExtensions(query: string): Extension[] {
    if (!this.db) throw new Error("Database not initialized");
    
    const stmt = this.db.prepare(`
      SELECT e.* FROM extensions e
      JOIN extensions_fts fts ON e.rowid = fts.rowid
      WHERE extensions_fts MATCH ?
      ORDER BY rank
    `);
    
    return stmt.all(query) as Extension[];
  }
  
  getExtensionsByCategory(category: string): Extension[] {
    if (!this.db) throw new Error("Database not initialized");
    
    const stmt = this.db.prepare("SELECT * FROM extensions WHERE category = ?");
    return stmt.all(category) as Extension[];
  }
  
  getAllExtensions(): Extension[] {
    if (!this.db) throw new Error("Database not initialized");
    
    const stmt = this.db.prepare("SELECT * FROM extensions ORDER BY name");
    return stmt.all() as Extension[];
  }
}
```

#### Updated Hook
```typescript
// src/hooks/useExtensionData.ts
import { useState, useEffect } from "react";
import { ExtensionDatabase } from "../services/database";

export function useExtensionData() {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db] = useState(() => new ExtensionDatabase());
  
  useEffect(() => {
    async function loadData() {
      try {
        await db.initialize();
        const allExtensions = db.getAllExtensions();
        setExtensions(allExtensions);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load extensions");
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [db]);
  
  const searchExtensions = (query: string) => {
    if (!query.trim()) return extensions;
    return db.searchExtensions(query);
  };
  
  return {
    extensions,
    loading,
    error,
    searchExtensions,
    getExtensionsByCategory: db.getExtensionsByCategory.bind(db)
  };
}
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Design and implement database schema
- [ ] Create database build script
- [ ] Set up basic GitHub Actions workflow
- [ ] Test database generation from existing JSON files

### Phase 2: Integration (Week 2)
- [ ] Implement database service layer
- [ ] Update TUI to use database instead of JSON
- [ ] Add database download functionality
- [ ] Implement version checking and updates

### Phase 3: Pipeline (Week 3)
- [ ] Complete CI/CD pipeline with security analysis integration
- [ ] Add automated testing for database generation
- [ ] Implement rollback mechanisms
- [ ] Performance testing and optimization

### Phase 4: Migration (Week 4)
- [ ] Final testing and validation
- [ ] Documentation updates
- [ ] Deployment to production
- [ ] Remove old JSON-based code

## Security Analysis Integration

### Docker Container Integration
```yaml
# In CI/CD pipeline
- name: Security Analysis
  run: |
    docker run --rm \
      -v $PWD/opencode-directory:/data \
      ghcr.io/your-org/security-analyzer:latest \
      analyze /data --output security-report.json
      
- name: Check Security Results
  run: |
    node scripts/check-security.js security-report.json
```

### Security Checks
- Dependency vulnerability scanning
- Code pattern analysis
- Malware detection
- License compliance checking

## Performance Benefits

- **Startup Time**: 50-80% reduction (single DB read vs multiple JSON files)
- **Search Performance**: Full-text search with FTS5 (10-100x faster)
- **Memory Usage**: 60-70% reduction (no need to keep all JSON in memory)
- **Scalability**: Handles 10,000+ extensions efficiently
- **Network Efficiency**: Single compressed database download vs multiple file requests

## Migration Strategy

### Pre-Migration
1. Backup existing JSON files
2. Create database schema migration scripts
3. Test build pipeline with existing data

### Migration
1. Generate initial database from current JSON files
2. Deploy new TUI version with database support
3. Switch CI/CD pipeline to generate database
4. Remove old JSON loading code

### Post-Migration
1. Monitor performance improvements
2. Validate data consistency
3. Update documentation

## Success Metrics

- **Performance**: App startup time < 2 seconds
- **Scalability**: Handle 10,000+ extensions without degradation
- **Reliability**: 99.9% database download success rate
- **Developer Experience**: PR to database generation < 5 minutes

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Database download failure | High | Implement fallback to cached version |
| Build pipeline failure | Medium | Manual database generation scripts |
| Data corruption | High | Database integrity checks, rollback capability |
| Performance regression | Medium | Benchmarking, performance monitoring |

## Future Considerations

- **Incremental Updates**: Delta updates instead of full database download
- **Caching Strategy**: Local database caching with TTL
- **Offline Support**: Graceful degradation with cached data
- **Analytics**: Usage tracking and popular extension metrics
- **API Integration**: Direct database sync from external sources