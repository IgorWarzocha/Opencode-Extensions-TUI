# OpenCode Extensions TUI

🚀 **A beautiful terminal interface for discovering and managing OpenCode extensions**

![Terminal UI](https://img.shields.io/badge/Terminal-Interface-green) ![OpenCode](https://img.shields.io/badge/OpenCode-Extensions-blue) ![Cross Platform](https://img.shields.io/badge/Platform-Linux%20%7C%20macOS%20%7C%20Windows-lightgrey)

## ✨ What is this?

OpenCode Extensions TUI is a fast, keyboard-driven terminal application that lets you browse, search, and manage OpenCode extensions right from your command line. No browser needed!

Perfect for developers who live in the terminal and want to quickly discover new tools and extensions for their OpenCode setup.

## 🎯 Key Features

- **⚡ Lightning Fast** - Instant search and navigation
- **🎨 Beautiful Interface** - Clean, responsive terminal UI
- **🔍 Smart Search** - Find extensions by name, description, or category
- **📂 Organized Browsing** - Navigate through curated categories
- **⌨️ Keyboard Only** - Full control without touching your mouse
- **📊 Rich Information** - See downloads, stars, and detailed descriptions
- **🔄 Live Updates** - Refresh to get the latest extension data

## 🚀 Quick Start

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

That's it! You're now browsing extensions in your terminal. 🎉

## 🎮 How to Use

### Navigation

| Key | What it does |
|-----|--------------|
| `↑` `↓` or `w` `s` | Move up/down through extensions |
| `←` `→` or `a` `d` | Switch between categories |
| `Tab` | Quick category cycling |
| `Enter` | Install/uninstall selected extension |
| `i` | Show detailed information |
| `/` | Start searching |
| `r` | Refresh extension data |
| `q` | Quit the application |

### Search Mode

Press `/` to search:
- Start typing to filter extensions instantly
- `Enter` to apply search
- `Escape` to cancel and go back

### Views

1. **📋 List View** - Browse all extensions with key info
2. **📖 Details View** - Press `i` for full extension details
3. **🔍 Search View** - Press `/` to find specific extensions

## 🎨 What You'll See

Each extension card shows:
- **Name & Author** - Who made it
- **⭐ Stars & 📥 Downloads** - Community popularity
- **🏷️ Category** - What type of extension it is
- **📝 Description** - What it does
- **✅ Status** - Available or already installed

## 🛠️ For Developers

Want to contribute or modify the TUI?

```bash
# Development with hot reload
bun dev

# Run directly
bun run src/index.tsx
```

Built with React 19, OpenTUI, and TypeScript. See [AGENTS.md](./AGENTS.md) for development guidelines.

## 🤝 Contributing

Found a bug or have an idea? 

1. Open an [Issue](https://github.com/IgorWarzocha/Opencode-Extensions-TUI/issues)
2. Fork and create a Pull Request
3. Join the OpenCode community!

## 📚 More About OpenCode

- [OpenCode Main Project](https://github.com/opencode-org)
- [Extension Repository](https://github.com/opencode-org/extensions)
- [OpenCode Community](https://discord.gg/opencode)

---

**Made with ❤️ for the terminal-loving developer community**

*If you like this, give it a ⭐ on GitHub!*
