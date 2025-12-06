# Agent Operations Guide

- Install: `bun install` (root).
- Dev CLI: `bun dev` (watches `src/index.tsx`).
- Direct run: `bun run src/index.tsx`.
- Build: not defined; prefer bundler-driven run; document gaps before adding.
- Lint/Test: no scripts yet; add Bun `test`/lint first—single test via `bun test path/to.test.ts`.
- Runtime: React 19 + OpenTUI on Bun ESM.
- TS: 5.9 strict, `moduleResolution: "bundler"`, `verbatimModuleSyntax`, JSX source `@opentui/react`.
- Imports: keep ESM with extensions; use `import type` for types; avoid default barrels.
- Syntax: avoid enums/namespaces/ctor params; prefer `type` aliases, discriminated unions, `satisfies`.
- Types: no `any`; use `unknown` then narrow; `noUncheckedIndexedAccess` enabled.
- Components: lowercase OpenTUI elements (`<box>`, `<text>`); components PascalCase; props camelCase; files kebab-case.
- Styling: use `ocTheme` + `t()` helpers; keep terminal-friendly spacing and contrast.
- Data: extension metadata from `opencode-directory/` JSON; keep async IO and parsing pure.
- Error handling: guard nullish values with `??`; surface actionable messages; avoid throwing for control flow.
- State: React hooks (`useState`, `useEffect`, `useKeyboard`); keep state derivations memo-free unless needed.
- Modules: entry `src/index.tsx`; main UI `src/App.tsx`; shared utils/types under `src/utils` and `src/types`.
- Formatting: follow repo defaults/Prettier; stable import order; trailing commas ok.
- Repo rules: no Cursor or Copilot rule files present.
