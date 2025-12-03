# Agent Operations Guide

## Build & Development Commands
- `bun install` - Install dependencies
- `bun dev` - Start development server with hot reload
- `bun run src/index.tsx` - Run the application directly

## Code Style Guidelines
- **Framework**: React 19 with OpenTUI components for terminal UI
- **TypeScript**: Strict mode enabled, ESNext target, JSX with `@opentui/react` import source
- **Imports**: Use verbatim module syntax, import OpenTUI from `@opentui/core` and `@opentui/react`
- **Components**: Use lowercase HTML-like elements (`<box>`, `<text>`) for OpenTUI components
- **File Structure**: Entry point at `src/index.tsx`, components in `src/components/`, types in `src/types/`
- **Naming**: PascalCase for React components, camelCase for functions/variables, kebab-case for files
- **Error Handling**: TypeScript strict mode, null coalescing (`??`) for optional values
- **State Management**: React hooks (`useState`, `useEffect`), `useKeyboard` for input handling
- **Styling**: Use `ocTheme` object for consistent colors, `t()` template literal for styled text
- **Data Loading**: Extension data loaded from JSON files in `opencode-directory/`
- **Utilities**: Helper functions for ellipsis, count formatting, and responsive layout

## Project Architecture
- **Runtime**: Bun with TypeScript compilation
- **UI Framework**: OpenTUI for terminal-based React applications
- **Entry Point**: `src/index.tsx` creates CLI renderer and renders React root
- **Data Sources**: JSON files (tools.json, integrations.json, themes.json) for extension metadata