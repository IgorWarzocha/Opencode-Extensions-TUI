
===FRONTMATTER===
name: "zenobi-us_opencode-background"
display_name: "Background Processes Plugin"
description: "Opencode plugin to manage and communicate with background tasks"
long_description: ""
author: "zenobi-us"
author_url: "https://github.com/zenobi-us"
repository_url: "https://github.com/zenobi-us/opencode-background"
license: "MIT"
star_count: 0
download_count: 0
forks: 0
language: "TypeScript"
updated_at: "2024-12-02"
keywords: ["opencode", "background-processes", "process-management", "plugin", "automation"]
category: "Plugin"
install_command: null
curator_notes: null
version: null
homepage: "https://github.com/zenobi-us/opencode-background"
===FRONTMATTER===


# OpenCode Background Processes Plugin

A flexible background process management plugin for OpenCode, offering robust process tracking and lifecycle management.

[![asciicast](https://asciinema.org/a/FhwMJK48sUyKzoBe366YuhqS7.svg)](https://asciinema.org/a/FhwMJK48sUyKzoBe366YuhqS7)

## Installation

Create or edit your OpenCode configuration file (typically `~/.config/opencode/config.json`):

```json
{
  "plugins": ["@zenobius/opencode-background"]
}
```

## Usage

### Example 1: Build Pipeline Management

```
I need to run and monitor multiple background processes for a build pipeline:

1. Start a long-running build process tagged as ["build", "critical"] that runs: `bun build ./src/index.ts --outdir dist --target bun`
2. Start a test runner tagged as ["test", "validation"] that runs: `bun test --watch`
3. Start a global process tagged as ["lint"] for linting: `mise run lint` (should persist across sessions)
4. List all current processes and show me their statuses
5. List only the processes tagged with "critical" or "validation"
6. Kill the test runner process, then list remaining processes
7. Show all currently running processes one more time to verify

Walk me through each step so I can see how the plugin handles concurrent processes, filtering, and termination.
```

**Demonstrates:**

- Creating multiple background processes
- Using tags for categorization
- Global vs session-specific processes
- Listing and filtering by tags
- Process termination
- Real-time status tracking

### Example 2: Web Server and Concurrent Testing

```
Let's test running a web server in the background using json-server:
- Start a json-server instance with: bunx json-server --watch db.json
- Tag it as ["server", "json-api"] for easy management
- Test that it's still running
- Execute a sync cmd (without background) to curl results from the server
- Test that it's still running
- Run a subagent that runs cmds to test the server too
- Confirm the subagent's results
```

**Demonstrates:**

- Long-running background services (JSON API server)
- Interleaving background processes with foreground commands
- Process monitoring across concurrent operations
- Subagent coordination with background processes
- Data persistence through process lifecycle
- Full CRUD operations validation while service runs continuously
- Real-time process status verification

## Features

- 🚀 Create background processes with real-time output tracking
- 🏷️ Tag and categorize processes
- 🔍 Advanced process filtering
- 🔪 Selective process termination
- 🌐 Global and session-specific process support
- :recycle: Automatic cleanup on session end and application close

## Usage in OpenCode

### Creating a Background Process

```
⚙ createBackgroundProcess
  command=/tmp/long-process.sh
  name="Long Running Process"
  tags=["long-process", "processing"]
  global=false  # Optional: default is false
```

### Process Types

- **Session-Specific Processes** (default):
  - Automatically terminated when the session ends
  - Useful for temporary, session-bound operations
  - Tracked in-memory for the current session

- **Global Processes**:
  - Persist across sessions
  - Continues running until explicitly stopped
  - Useful for long-running services or background operations

### Listing Processes

```
# List processes in current session
⚙ listBackgroundProcesses
  sessionId=current_session_id

# List processes with specific tags
⚙ listBackgroundProcesses
  tags=["processing"]
```

### Killing Processes

```
# Kill a specific process
⚙ killProcesses
  processId=specific-process-id

# Kill all processes in a session
⚙ killProcesses
  sessionId=current_session_id
```

## Plugin Methods

### `createBackgroundProcess`

- `command`: Shell command to execute
- `name` (optional): Descriptive name for the process
- `tags` (optional): List of tags to categorize the process
- `global` (optional):
  - `false` (default): Session-specific process
  - `true`: Process persists across sessions

### `listBackgroundProcesses`

- `sessionId` (optional): Filter processes by session
- `status` (optional): Filter processes by status
- `tags` (optional): Filter processes by tags

### `killProcesses`

- `processId` (optional): Kill a specific process
- `sessionId` (optional): Kill processes in a specific session
- `status` (optional): Kill processes with a specific status
- `tags` (optional): Kill processes with specific tags

## Considerations

- Processes are tracked in-memory using a singleton `BackgroundProcessManager`
- Output stream captures up to the last 100 lines of process output
- Processes can be in states: `pending`, `running`, `completed`, `failed`, `cancelled`
- Processes include detailed metadata: start/completion times, error tracking
- ALL processes are killed when OpenCode closes
- Processes generate unique IDs automatically if not specified

## Contributing

Contributions are welcome! Please file issues or submit pull requests on the GitHub repository.

## License

MIT License. See the [LICENSE](LICENSE) file for details.





