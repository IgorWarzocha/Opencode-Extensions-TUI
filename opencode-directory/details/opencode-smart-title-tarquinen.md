
===FRONTMATTER===
name: "Tarquinen_opencode-smart-title"
display_name: "Smart Title"
description: "Auto-generate meaningful session titles for OpenCode conversations using AI"
long_description: ""
author: "Tarquinen"
author_url: "https://github.com/Tarquinen"
repository_url: "https://github.com/Tarquinen/opencode-smart-title"
license: "MIT"
star_count: 0
download_count: 0
forks: 0
language: "TypeScript"
updated_at: "2024-12-02"
keywords: ["opencode", "session-titles", "ai-generated", "plugin", "conversation-management"]
category: "Plugin"
install_command: "npm install @tarquinen/opencode-smart-title"
curator_notes: null
version: null
homepage: "https://github.com/Tarquinen/opencode-smart-title"
===FRONTMATTER===


# Smart Title Plugin

Auto-generates meaningful session titles for your OpenCode conversations using AI.

## What It Does

- Watches your conversation and generates short, descriptive titles
- Updates automatically when the session becomes idle (you stop typing)
- Uses OpenCode's unified auth - no API keys needed
- Works with any authenticated AI provider

## Installation

```bash
npm install @tarquinen/opencode-smart-title
```

Add to `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["@tarquinen/opencode-smart-title"]
}
```

## Configuration

The plugin supports both global and project-level configuration:

- **Global:** `~/.config/opencode/smart-title.jsonc` - Applies to all sessions
- **Project:** `.opencode/smart-title.jsonc` - Overrides global config

The plugin creates a default global config on first run.

```jsonc
{
  // Enable or disable the plugin
  "enabled": true,

  // Enable debug logging
  "debug": false,

  // Optional: Use a specific model (otherwise uses smart fallbacks)
  // "model": "anthropic/claude-haiku-4-5",

  // Update title every N idle events (1 = every time you pause)
  "updateThreshold": 1
}
```

## License

MIT











