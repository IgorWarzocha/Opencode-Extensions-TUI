# Automated Model Configuration using `ts-to-zod`

This guide details how to **automatically generate** Zod validation schemas directly from the `@ai-sdk/*` TypeScript definitions. This ensures your configuration helper is always perfectly in sync with the installed SDK versions without manual maintenance.

## 1. The Concept

Instead of manually typing Zod schemas that mirror the SDK interfaces, we use a code generation tool to read the `node_modules` type definitions and output ready-to-use Zod schemas.

**Flow:**
`npm install @ai-sdk/openai` -> `ts-to-zod` -> `src/generated/openai-schema.ts` -> **Your TUI**

## 2. Setup

### Step 1: Install Dependencies

In your `extensionstui` folder:

```bash
bun add -d ts-to-zod
bun add @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google
```

### Step 2: Create the Generation Config

Create a file named `ts-to-zod.config.js` in your project root. This configuration tells the tool where to find the types and which specific interfaces to convert.

```javascript
/**
 * ts-to-zod configuration
 * Maps SDK type definitions to generated Zod schema files.
 */
module.exports = [
  {
    name: "openai",
    input: "node_modules/@ai-sdk/openai/dist/index.d.ts",
    output: "src/generated/openai.ts",
    // We only want the settings interface, not the whole library
    jsDocTagFilter: (tags) => tags.includes("OpenAIProviderSettings"),
  },
  {
    name: "anthropic",
    input: "node_modules/@ai-sdk/anthropic/dist/index.d.ts",
    output: "src/generated/anthropic.ts",
  },
  {
    name: "google",
    input: "node_modules/@ai-sdk/google/dist/index.d.ts",
    output: "src/generated/google.ts",
  },
];
```

_Note: You might need to adjust the `input` path depending on exactly how Bun resolves the nested node_modules. Use `find node_modules -name index.d.ts` to verify._

### Step 3: Create a Generation Script

Since `ts-to-zod` works best on source files, and `node_modules` definitions can be complex, a more robust approach for a "helper" tool is to create a small **intermediate file** that re-exports exactly what you want. This makes the generation cleaner.

1.  Create `src/config-source.ts`:

    ```typescript
    // Re-export strictly what we want schemas for
    export type { OpenAIProviderSettings } from "@ai-sdk/openai";
    export type { AnthropicProviderSettings } from "@ai-sdk/anthropic";
    export type { GoogleGenerativeAIProviderSettings } from "@ai-sdk/google";
    ```

2.  Run `ts-to-zod` against this single file:

    ```bash
    bunx ts-to-zod src/config-source.ts src/generated/config-schemas.ts
    ```

## 3. Usage in Your TUI

Now you have a file `src/generated/config-schemas.ts` containing actual Zod objects: `OpenAIProviderSettingsSchema`, `AnthropicProviderSettingsSchema`, etc.

You can use these to drive your UI _and_ validate user input.

```tsx
import { OpenAIProviderSettingsSchema } from "../generated/config-schemas";
import { z } from "zod";

// 1. Get the shape for the UI
const shape = OpenAIProviderSettingsSchema.shape;

export function OpenAIConfigForm() {
  return (
    <Box flexDirection="column">
      {Object.keys(shape).map((key) => {
        const fieldSchema = shape[key];

        // Inspect the Zod schema to determine UI type
        let label = key;
        let description = fieldSchema.description; // populated if JSDoc was present

        if (fieldSchema instanceof z.ZodBoolean) {
          // Render Checkbox
        } else if (fieldSchema instanceof z.ZodNumber) {
          // Render Number Input
        } else if (fieldSchema instanceof z.ZodEnum) {
          // Render Dropdown with fieldSchema.options
        }

        return <Field key={key} label={label} />;
      })}
    </Box>
  );
}

// 2. Validate the final config object
function saveConfig(userConfig: unknown) {
  const result = OpenAIProviderSettingsSchema.safeParse(userConfig);
  if (!result.success) {
    console.error("Invalid config:", result.error);
  }
}
```

## 4. Advantages of this Approach

1.  **Fully Automated:** Add a `postinstall` script to run the generation. Every time you update the SDKs, your schemas update.
2.  **Rich Metadata:** `ts-to-zod` preserves JSDoc comments from the SDKs as `.describe()` calls in the Zod schema, giving you free tooltips/descriptions for your UI.
3.  **Runtime Safety:** You can validate the JSON config loaded from disk against these schemas to prevent the "crash" you mentioned earlier.

## 5. Automation Script Example

Add this to your `package.json`:

```json
"scripts": {
  "generate:schemas": "ts-to-zod src/config-source.ts src/generated/config-schemas.ts",
  "postinstall": "bun run generate:schemas"
}
```
