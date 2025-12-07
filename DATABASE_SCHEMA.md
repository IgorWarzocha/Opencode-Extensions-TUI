# Database Schema

## Core Tables

### extensions
```sql
CREATE TABLE extensions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  readme TEXT, <= direct import from the repo, this will need to be parsed into markdown
  author TEXT NOT NULL,
  author_url TEXT,
  repository_url TEXT NOT NULL,
  category TEXT NOT NULL,
  install_command TEXT,
  install_method TEXT,
);
```

### categories
```sql
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);
```

### Full-text search
```sql
CREATE VIRTUAL TABLE extensions_fts USING fts5(
  name, description, readme, author
);
```

## Indexes
```sql
CREATE INDEX idx_extensions_category ON extensions(category);
CREATE INDEX idx_extensions_author ON extensions(author);
```

## Default Categories
```sql
INSERT INTO categories (id, name, description) VALUES
('plugin', 'Plugin', 'JavaScript/TypeScript plugins that hook into OpenCode events'),
('agent', 'Agent', 'Specialized AI agents for specific tasks and workflows'),
('tool', 'Tool', 'Custom tools for extended functionality'),
('command', 'Command', 'Custom commands and command extensions'),
('theme', 'Theme', 'Visual themes and color schemes for TUI'),
('bundle', 'Bundle', 'Complete configuration packages and setups');
```
