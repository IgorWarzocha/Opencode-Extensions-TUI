# OpenTUI Framework Reference

## Package Structure

```
opentui.git/packages/
├── core/              # Core renderables, rendering engine
│   └── src/
│       ├── renderables/   # All renderable components
│       ├── examples/      # Standalone demos (run with bun)
│       ├── lib/           # Utilities (tree-sitter, styled-text, etc.)
│       ├── 3d/            # Three.js/WebGPU integration
│       └── syntax-style.ts
├── solid/             # Solid.js JSX bindings
│   └── src/
│       ├── elements/      # JSX element mappings
│       ├── types/         # TypeScript types for JSX
│       └── renderer/      # Solid renderer implementation
└── react/             # React bindings (alternative)
```

## Core Renderables

| Renderable | JSX Tag | Description |
|------------|---------|-------------|
| `BoxRenderable` | `<box>` | Flexbox layout container |
| `TextRenderable` | `<text>` | Text display with styling |
| `CodeRenderable` | `<code>` | Syntax highlighted code (tree-sitter) |
| `ScrollBoxRenderable` | `<scrollbox>` | Scrollable container |
| `SelectRenderable` | `<select>` | Navigable list with selection |
| `InputRenderable` | `<input>` | Single-line text input |
| `TextareaRenderable` | `<textarea>` | Multi-line text input |
| `DiffRenderable` | `<diff>` | Side-by-side/unified diff view |
| `LineNumberRenderable` | `<line_number>` | Wraps code with line numbers |
| `TabSelectRenderable` | `<tab_select>` | Tab navigation |
| `ASCIIFontRenderable` | `<ascii_font>` | Large ASCII art text |

## JSX Text Modifiers

```tsx
<span>plain text</span>
<b>bold</b> or <strong>bold</strong>
<i>italic</i> or <em>italic</em>
<u>underlined</u>
<br /> // line break
```

## Key Imports

```tsx
// Core types and utilities
import {
  RGBA,
  TextAttributes,
  SyntaxStyle,
  StyledText,
  type ScrollBoxRenderable,
  type ParsedKey,
} from "@opentui/core";

// Solid.js bindings
import { render, useTerminalDimensions } from "@opentui/solid";
```

## CodeRenderable Props

```tsx
<code
  content={string}           // Code to display
  filetype="typescript"      // Language for highlighting
  syntaxStyle={SyntaxStyle}  // Color scheme
  conceal={boolean}          // Hide markdown syntax (default: true)
  selectable={boolean}       // Allow text selection
  streaming={boolean}        // Streaming mode for live updates
/>
```

## SyntaxStyle

```tsx
import { SyntaxStyle } from "@opentui/core";

const style = SyntaxStyle.fromStyles({
  keyword: { fg: parseColor("#FF7B72"), bold: true },
  string: { fg: parseColor("#A5D6FF") },
  comment: { fg: parseColor("#8B949E"), italic: true },
  function: { fg: parseColor("#D2A8FF") },
  type: { fg: parseColor("#FFA657") },
  // ... see code-demo.ts for full example
});
```

## Box Layout (Flexbox)

```tsx
<box
  flexDirection="column"     // "row" | "column"
  flexGrow={1}
  flexShrink={0}
  gap={1}
  padding={1}
  paddingLeft={2}
  margin={1}
  width={80}
  height={20}
  minWidth={10}
  maxHeight={30}
  position="absolute"        // For overlays
  zIndex={100}
  backgroundColor={RGBA}
  borderStyle="single"       // "single" | "double" | "rounded"
  borderColor={RGBA}
/>
```

## ScrollBox

```tsx
<scrollbox
  ref={(r) => { scrollRef = r; }}
  flexGrow={1}
  focused={false}           // Don't capture keyboard
  viewportCulling           // Performance optimization
  scrollY={true}
  scrollX={false}
>
  {/* content */}
</scrollbox>

// Programmatic scroll
scrollRef.scrollTo(0);
scrollRef.scrollBy(10);
scrollRef.scrollToEnd();
```

## Select (List)

```tsx
<select
  focused={true}
  options={items}           // Array of { name, description?, value }
  onSelect={(index) => {}}
  wrapSelection={true}
  showDescription={true}
  fastScrollStep={5}
  style={{
    textColor: RGBA,
    selectedTextColor: RGBA,
    backgroundColor: RGBA,
    selectedBackgroundColor: RGBA,
  }}
/>
```

## Standalone Demo Pattern

```tsx
// opentui.git/packages/core/src/examples/my-demo.ts
import { createCliRenderer, BoxRenderable, TextRenderable } from "../index";

export async function run(renderer: CliRenderer): Promise<void> {
  renderer.start();

  const container = new BoxRenderable(renderer, { padding: 1 });
  renderer.root.add(container);

  const text = new TextRenderable(renderer, { content: "Hello" });
  container.add(text);

  renderer.keyInput.on("keypress", (key: ParsedKey) => {
    if (key.name === "q") process.exit(0);
  });
}

if (import.meta.main) {
  const renderer = await createCliRenderer({ exitOnCtrlC: true });
  run(renderer);
}
```

## Core Demos (runnable examples)

| Demo | File | Description |
|------|------|-------------|
| Code highlighting | `code-demo.ts` | CodeRenderable + LineNumbers |
| Diff view | `diff-demo.ts` | DiffRenderable |
| Select list | `select-demo.ts` | SelectRenderable |
| Input | `input-demo.ts` | InputRenderable |
| Scrolling | `scroll-example.ts` | ScrollBox patterns |
| Text styling | `styled-text-demo.ts` | StyledText API |
| Editor | `editor-demo.ts` | TextareaRenderable |
| 3D/Shaders | `shader-cube-demo.ts` | WebGPU integration |

Run with: `bun opentui.git/packages/core/src/examples/<demo>.ts`

## Extending JSX Elements

```tsx
import { extend } from "@opentui/solid";
import { MyCustomRenderable } from "./my-renderable";

extend({
  my_custom: MyCustomRenderable,
});

// Now available as <my_custom ... />
```
