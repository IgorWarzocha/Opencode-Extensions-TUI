# OpenCode Extensions TUI

**A powerful terminal interface for discovering and managing OpenCode extensions**

> **Community Project**: This is a community-driven project and is not an official SST/Opencode initiative.

> **Beyond Demo**: This has evolved beyond a UI demo and now includes real installation capabilities, persistent storage, and extension lifecycle management.

![OpenCode Extensions TUI Screenshot](./v1.png)

## What is this?

OpenCode Extensions TUI is a comprehensive terminal application that lets you discover, install, and manage OpenCode extensions right from your command line. No browser needed!

Perfect for developers who live in the terminal and want complete control over their OpenCode extension ecosystem with real installation capabilities and persistent state management.

## Key Features

- **Installation Capabilities** - Install extensions via npm, bash scripts, or direct download
- **Persistent Storage** - SQLite database tracks installation status and metadata
- **Skills Support** - Install and manage skill bundles from the OpenCode ecosystem
- **Configuration Editor** - Full-featured modal editor with JSONC support for OpenCode config
- **Dual Keybind Modes** - Toggle between OC (OpenCode-style) and NVIM (vim-style) navigation
- **Multiple Installation Methods** - Supports npm packages, bash scripts, GitHub agents, and skill bundles
- **Interactive Installation Flows** - Modal dialogs for installation options and script previews
- **Lightning Fast** - Instant search and navigation
- **Beautiful Interface** - Clean, responsive terminal UI
- **Smart Search** - Find extensions by name, description, or category
- **Organized Browsing** - Navigate through curated categories
- **Keyboard Only** - Full control without touching your mouse
- **Rich Information** - See downloads, stars, and detailed descriptions
- **Live Updates** - Refresh to get the latest extension data
- **Status Tracking** - Installation/uninstallation status with error handling

## Quick Start

### Prerequisites

You need [Bun](https://bun.sh/) installed (it's like npm but way faster):

```bash
curl -fsSL https://bun.sh/install | bash
```

### Installation & Running

```bash
# Clone the repository
git clone https://github.com/IgorWarzocha/Opencode-Extensions-TUI.git
cd Opencode-Extensions-TUI

# Install dependencies (takes ~10 seconds)
bun install

# Launch the TUI!
bun dev
```

That's it! You're now browsing extensions in your terminal.

## How to Use

### Navigation (OC Mode)

| Key                          | What it does                    |
| ---------------------------- | ------------------------------- |
| `↑` `↓`                      | Move up/down through extensions |
| `←` `→` or `Shift+Tab` `Tab` | Switch between categories       |
| `Enter`                      | Install selected extension      |
| `o`                          | Open details view               |
| `u` or `Delete`              | Uninstall selected extension    |
| `/` or `Ctrl+f`              | Start searching                 |
| `r`                          | Refresh extension data          |
| `Ctrl+e`                     | Open configuration editor       |
| `Home` / `End`               | Jump to top/bottom of list      |
| `Ctrl+x` then `q`            | Quit the application            |
| `Ctrl+c` or `Ctrl+q`         | Quit immediately                |

### Navigation (NVIM Mode)

Press `Ctrl+g` to toggle between OC and NVIM modes.

| Key             | What it does                    |
| --------------- | ------------------------------- |
| `j` `k`         | Move up/down through extensions |
| `h` `l`         | Switch between categories       |
| `g` `g`         | Jump to top of list             |
| `Shift+g`       | Jump to bottom of list          |
| `Enter` or `i`  | Install selected extension      |
| `o`             | Open details view               |
| `u`             | Uninstall selected extension    |
| `/`             | Start searching                 |
| `r`             | Refresh extension data          |
| `Ctrl+e`        | Open configuration editor       |
| `q` or `Ctrl+c` | Quit the application            |

### Search Mode

Press `/` to search:

- Start typing to filter extensions instantly
- `Enter` to apply search
- `Escape` to cancel and go back

### Installation

Press `Enter` on any extension to install:

- **NPM Extensions**: Choose between local or global installation scope
- **Bash Scripts**: Preview installation scripts before execution
- **GitHub Agents**: Install directly from GitHub repositories
- **Skill Bundles**: Select specific skills to install from bundles
- **Drop Extensions**: Direct file-based installation

### Configuration Editor

Press `Ctrl+e` to open the configuration editor modal with 8 sections:

- **Core Settings** - Theme, username, default agent, share mode
- **Plugins** - Manage installed plugins
- **Agents** - Configure agent settings
- **Providers** - Enable/disable LLM providers
- **MCP Servers** - Model Context Protocol server configuration
- **Skills** - Manage installed skills (local/global scope)
- **Keybindings** - Edit keyboard shortcuts
- **Raw JSON** - Direct JSONC editing with validation

Use `Ctrl+Up/Down` to navigate sections in the config editor.

### Extension Categories

- **All** - Browse all extensions
- **Featured** - Curated featured extensions
- **Plugins** - OpenCode plugins and integrations
- **Agents** - AI agents and specialized workflows
- **Commands** - Custom commands and command extensions
- **Tools** - Standalone CLI tools and utilities
- **Skills** - Skill bundles for OpenCode
- **Themes** - Visual themes and color schemes
- **Bundles** - Complete configuration packages

### Views

1. **List View** - Browse all extensions with key info
2. **Details View** - Press `o` for full extension details
3. **Search View** - Press `/` to find specific extensions
4. **Installation Modals** - Interactive dialogs for installation options
5. **Configuration Editor** - Press `Ctrl+e` for full config management

## What You'll See

Each extension card shows:

- **Name & Author** - Who made it
- **Stars & Downloads** - Community popularity
- **Category** - What type of extension it is
- **Description** - What it does
- **Status** - Available or marked as installed

**Note**: Extension data is loaded from local SQLite database. Installation status is persisted in the database.

## For Developers

Want to contribute or modify the TUI?

```bash
# Development with hot reload
bun dev

# Run directly
bun run src/index.tsx
```

Built with React 19, OpenTUI, and TypeScript. See [AGENTS.md](./AGENTS.md) for development guidelines.

## Contributing

Found a bug or have an idea?

**Currently in Peer Review Stage** - We welcome community feedback on UX consistency, keyboard shortcuts, and workflow improvements!

1. **Read [CONTRIBUTING.md](./CONTRIBUTING.md)** - Guidelines for contributions and current focus areas
2. **Check [FAQ.md](./FAQ.md)** - Detailed workflows and technical documentation
3. **Open an [Issue](https://github.com/IgorWarzocha/Opencode-Extensions-TUI/issues)** - Report bugs or suggest improvements
4. **Fork and create a Pull Request** - Submit your changes
5. **Join the OpenCode community!**

## More About OpenCode

- [OpenCode Official Site](https://opencode.ai/)
- [OpenCode GitHub](https://github.com/sst/opencode)
- [OpenCode Documentation](https://opencode.ai/docs/)
- [GitHub Discussions](https://github.com/sst/opencode/discussions)

---

Made for the terminal-loving developer community

If you like this, give it a star on GitHub!
