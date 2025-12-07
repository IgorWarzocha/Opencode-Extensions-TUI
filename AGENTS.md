# Agent Operations Guide

## Commands
- Install: `bun install`
- Dev: `bun dev` (watches `src/index.tsx`)
- Test: `bun test` (single test: `bun test path/to.test.ts`)
- Format: `bun run prettier:write` (from opentui/)

## TypeScript & Runtime
- TS 5.9 strict: `verbatimModuleSyntax`, `noUncheckedIndexedAccess`, `moduleResolution: "bundler"`
- Runtime: React 19 + OpenTUI on Bun ESM, JSX from `@opentui/react`
- Imports: ESM with extensions, `import type` for types, avoid default barrels

## Code Style
- Components: lowercase OpenTUI elements (`<box>`), PascalCase components, kebab-case files
- Types: no `any`, use `unknown` then narrow, prefer `type` aliases + discriminated unions
- Syntax: avoid enums/namespaces/ctor params, use `satisfies` operator
- Error handling: guard with `??`, surface actionable messages, avoid throwing for control flow

## Architecture
- Entry: `src/index.tsx` → `src/App.tsx`
- State: React hooks (`useState`, `useEffect`, `useKeyboard`)
- Data: extension metadata from SQLite database via DatabaseService
- Styling: `ocTheme` + `t()` helpers, terminal-friendly spacing
