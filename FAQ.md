# OpenCode Extensions TUI - Developer FAQ

## Quick Start

**Setup & Run:**
```bash
# Prerequisites: Install Bun
curl -fsSL https://bun.sh/install | bash

# Clone and setup
git clone https://github.com/IgorWarzocha/Opencode-Extensions-TUI.git
cd Opencode-Extensions-TUI
bun install  # ~10 seconds

# Launch TUI!
bun dev
```

**Development Commands:**
- `bun dev` - Development with hot reload (watches `src/index.tsx`)
- `bun test` - Run tests (single test: `bun test path/to.test.ts`)
- `bun run src/index.tsx` - Run directly without watch mode

## Core Workflows

### 📥 Submission Workflow

**1. Users Submit Extensions**
- Create PR with JSON file in appropriate `submissions/` subfolder
- Follow schema defined in [extension type definition](src/types/extension.ts)
- See live examples:
  - [Agent example](extensions/Agents/opencode-agents-vite-react-convex.json)
  - [Plugin example](extensions/Plugins/Tarquinen_opencode-dynamic-context-pruning.json)

**Required JSON Schema:**
```json
{
  "id": "unique-extension-id",
  "name": "Display Name",
  "description": "Brief description", 
  "readme": "", // Leave empty - auto-fetched during processing
  "author": "AuthorName",
  "author_url": "https://github.com/author",
  "repository_url": "https://github.com/author/repo",
  "category": "Agents|Plugins|Tools|Commands|Themes|Bundles",
  "install_command": "install command or null",
  "install_method": "npm|drop|bash|agents|manual"
}
```

**2. Process Submissions**
```bash
# Fetch READMEs, convert categories, move to production
bun scripts/process-submissions.ts
```
- **What it does:**
  - Scans `submissions/*/` for JSON files
  - Fetches READMEs from GitHub (10s rate limiting between requests)
  - Converts singular → plural categories (agent → Agents, plugin → Plugins)
  - Moves processed files to `extensions/{category}/`
  - Removes original submission files
  - Handles failed fetches gracefully (empty README fallback)

**3. Rebuild Database**
```bash
# Update SQLite database with new extensions
bun scripts/build-database.ts
```
- **What it does:**
  - Reads all JSON from `extensions/*/` folders
  - Populates SQLite database ([extensions.db](extensions.db))
  - Builds full-text search indexes (FTS5)
  - Validates schema and relationships

### 🗂️ Category System

**Plural Categories (only these work):**
- `Agents/` - AI agents and specialized workflows
- `Plugins/` - OpenCode plugins and integrations
- `Tools/` - Standalone CLI tools and utilities
- `Commands/` - Custom commands and command extensions
- `Themes/` - Visual themes and color schemes
- `Bundles/` - Complete configuration packages

**Directory Structure:**
```
submissions/          # New PR submissions
├── Agents/           # AI agent submissions
├── Plugins/          # Plugin submissions
├── Tools/            # Tool submissions
├── Commands/         # Command submissions
├── Themes/           # Theme submissions
└── Bundles/          # Bundle submissions

extensions/           # Live production data
├── Agents/           # Processed agents
├── Plugins/          # Processed plugins
├── Tools/            # Processed tools
├── Commands/         # Processed commands
├── Themes/           # Processed themes
└── Bundles/          # Processed bundles
```

## TUI Navigation & Usage

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` `↓` or `w` `s` | Move up/down through extensions |
| `←` `→` or `a` `d` or `j` `k` | Switch between categories |
| `Tab` | Quick category cycling |
| `Enter` | Install selected extension |
| `u` | Uninstall selected extension |
| `i` | Show detailed information |
| `/` | Start searching |
| `r` | Refresh extension data |
| `q` | Quit application |

### TUI Views

1. **List View** - Browse all extensions with key info
2. **Details View** - Press `i` for full README and metadata
3. **Search View** - Press `/` for instant filtering
4. **Installation Modals** - Interactive dialogs for install options

### Search Mode
- Press `/` to start searching
- Start typing to filter extensions instantly
- `Enter` to apply search, `Escape` to cancel

### Installation Flow
1. Select extension → Press `Enter`
2. **NPM Extensions**: Choose local/global scope
3. **Bash Scripts**: Preview before execution
4. **GitHub Agents**: Direct from repo installation
5. **Drop Extensions**: File-based installation

## Database Architecture

### SQLite Structure
- **Database file:** [extensions.db](extensions.db) (136KB)
- **Schema details:** See [DatabaseService](src/services/DatabaseService.ts)
- **Full-text search:** FTS5 enabled for instant discovery

### Database Tables
- `extensions` - Core extension metadata with READMEs
- `categories` - Category definitions (plural names)
- `extensions_fts` - Full-text search data for fast queries

## Development Guidelines

### TypeScript & Runtime
- **TS 5.9 strict mode**: `verbatimModuleSyntax`, `noUncheckedIndexedAccess`, `moduleResolution: "bundler"`
- **Runtime**: React 19 + OpenTUI on Bun ESM, JSX from `@opentui/react`
- **Imports**: ESM with extensions, `import type` for types, avoid default barrels

### Code Style Standards
- **Components**: lowercase OpenTUI elements (`<box>`), PascalCase components, kebab-case files
- **Types**: no `any`, use `unknown` then narrow, prefer `type` aliases + discriminated unions
- **Syntax**: avoid enums/namespaces/ctor params, use `satisfies` operator
- **Error handling**: guard with `??`, surface actionable messages, avoid throwing for control flow

### Architecture Pattern
- **Entry point**: `src/index.tsx` → `src/App.tsx`
- **State management**: React hooks (`useState`, `useEffect`, `useKeyboard`)
- **Data flow**: SQLite database → TUI components (no runtime GitHub fetching)
- **Styling**: `ocTheme` + `t()` helpers, terminal-friendly spacing

## Edge Cases & Troubleshooting

### Submission Processing Issues

**README Fetching Failures:**
- Script retries 3 times with exponential backoff (1s, 2s, 4s delays)
- Falls back to empty README if GitHub completely unreachable
- Rate limiting: 10s delays between GitHub API calls
- Can process ~6 submissions per hour safely

**Invalid Categories:**
- Submissions with invalid categories are rejected during processing
- Valid categories: [see constants](src/constants/categories.ts) (plural forms only)
- Automatic conversion: singular → plural during processing

**Duplicate Extension IDs:**
- Database enforces unique `id` field constraint
- Processing fails gracefully with error message
- Check existing extensions before submitting new ones

### Database & Search Issues

**Empty Database Results:**
- Run `bun scripts/build-database.ts` to regenerate
- Verify `extensions/*/` folders contain JSON files
- Check SQLite file permissions and disk space

**Search Not Working:**
- FTS tables may be corrupted or missing
- Run database build script to regenerate all indexes
- Search works on name, description, and README content

**Database Schema Updates:**
- Run `bun scripts/build-database.ts` after any schema changes
- Current schema supports full-text search and plural categories

### Performance Considerations

**Large README Files:**
- READMEs stored as markdown text in database
- No explicit size limits (current implementation)
- Consider truncation for very large files (>1MB) if performance issues

**GitHub Rate Limits:**
- Unauthenticated GitHub API: 60 requests/hour
- Processing script enforces 10s delays (safe margin)
- Batch processing: ~6 submissions per hour maximum

**Installation Performance:**
- NPM installations respect network conditions
- Bash scripts run with user preview
- Drop installations are instant file operations

## Installation Methods Deep Dive

### Supported Install Types

**`npm`** - NPM Package Installation
- Chooses between local (`npm install`) or global (`npm install -g`)
- Respects package.json scripts and dependencies
- Shows progress and error handling

**`drop`** - File Drop Installation  
- Direct file/directory placement in OpenCode config
- Instant (no network operations)
- Perfect for local extensions

**`bash`** - Bash Script Execution
- Shows script preview before execution
- Runs with proper error handling
- Captures output and progress

**`agents`** - Agent Directory Placement
- Copies to `~/.config/opencode/agent/`
- Automatically updates OpenCode agent registry
- Instant availability in OpenCode

**`manual`** - Manual Installation
- Shows installation instructions
- No automated steps
- User handles complex setup manually

### Installation Flow Details
1. User selects extension in TUI → Press `Enter`
2. System reads `install_method` from extension JSON
3. Appropriate installer service handles the process
4. Real-time status updates and error reporting
5. OpenCode configuration updated if needed

## Contributing & Maintenance

### PR Process for Extensions
1. Fork repository to your GitHub account
2. Add extension JSON to appropriate `submissions/{category}/` folder
3. Test schema compliance against [Extension interface](src/types/extension.ts)
4. Submit Pull Request with descriptive title
5. Maintainers review and run processing pipeline
6. Database rebuilt and deployed to production

### Schema Validation Checklist
- All required fields present in JSON
- `id` is unique (check existing extensions)
- `category` matches one of: Agents, Plugins, Tools, Commands, Themes, Bundles
- `install_method` is valid: npm, drop, bash, agents, manual
- `repository_url` is valid and accessible
- `author_url` is valid (if provided)

### Development Environment Setup
- **Hot reload development**: `bun dev` (watches `src/index.tsx`)
- **Testing**: `bun test` for unit tests, `bun test path/to.test.ts` for specific file
- **Formatting**: `bun run prettier:write` (run from project root)
- **Type checking**: Strict TS 5.9 with verbatim modules

### Key Architecture Files
- **Scripts**: [process-submissions.ts](scripts/process-submissions.ts), [build-database.ts](scripts/build-database.ts)
- **Services**: [DatabaseService.ts](src/services/DatabaseService.ts), [InstallationService.ts](src/services/installation/InstallationService.ts)
- **Types**: [extension.ts](src/types/extension.ts), [ui.ts](src/types/ui.ts)
- **Components**: Organized in `src/components/`, `src/detail/`
- **Configuration**: [AGENTS.md](AGENTS.md) for development guidelines

## Automation & AI Bot Future

### 🤖 Automated Submission Pipeline

**The system is designed for full automation with AI bots:**

**Automated Repo Review:**
- AI bots can analyze GitHub repositories before accepting submissions
- Automatic code quality, security, and compatibility checks
- Prevent malicious or low-quality extensions from entering ecosystem
- Bot-generated validation reports and risk assessments

**Automated Submission Creation:**
- Bots monitor external sources (GitHub topics, package registries, forums)
- Auto-generate JSON submissions from discovered projects
- Extract metadata, READMEs, and installation methods automatically
- Create PRs with validated extension data

**Database Automation:**
- Automated database updates from submission processing
- Bot-managed database backups and versioning
- Cloud-hosted database files for distributed access
- Automatic schema migrations and compatibility checks

### 🔄 Bot Integration Points

**Current Bot-Ready Components:**
- **[process-submissions.ts](scripts/process-submissions.ts)** - Designed for automated execution
- **[build-database.ts](scripts/build-database.ts)** - Scriptable database rebuilding
- **[JSON schema](src/types/extension.ts)** - Machine-readable validation rules
- **SQLite database** - Bot-manageable with standard tools

**Potential Bot Workflows:**
1. **Discovery Bot** - Monitors GitHub, npm, forums for new extensions
2. **Validation Bot** - Reviews code quality, security, compatibility
3. **Submission Bot** - Auto-creates PRs with validated extensions
4. **Database Bot** - Manages database updates and deployments
5. **Maintenance Bot** - Handles broken links, updates, deprecations

### ☁️ Cloud Distribution

**Staged Database Files:**
- SQLite databases can be hosted on CDN or cloud storage
- TUI can fetch latest database from remote location
- Eliminates need for local database rebuilding
- Supports multiple database versions and rollback capabilities

**Automated Deployment Pipeline:**
- GitHub Actions can auto-build and deploy databases
- Bots trigger deployments when new submissions are processed
- Distributed database files across global CDN network
- Version-controlled database releases with automatic updates

### 🛡️ Security & Quality Automation

**AI-Powered Code Review:**
- Automatic malware and security vulnerability scanning
- Code quality analysis and best practices validation
- Dependency analysis for known vulnerabilities
- Compatibility testing with OpenCode API versions

**Quality Scoring:**
- Bot-generated quality metrics and scoring
- Automated testing of installation procedures
- Performance benchmarking and resource usage analysis
- User sentiment analysis from GitHub issues and reviews

**This automation vision transforms the extension ecosystem from manual curation to an intelligent, self-managing platform that can scale to thousands of extensions while maintaining quality and security standards.**

---

**Need More Help?** 
- Review existing [extension examples](extensions/) for working patterns
- Check [type definitions](src/types/extension.ts) for detailed schema requirements
- See [development guidelines](AGENTS.md) for code style and architecture