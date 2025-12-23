import { CodeEditor } from "../ui/CodeEditor.js";

interface ScopedJsonEditorProps {
  data?: any;
  onSave: (newData: any, rawContent?: string) => void;
  label: string;
  height: number;
  rawInitialContent?: string;
  /** If true, onSave receives the raw string as second argument */
  preserveRaw?: boolean;
}

/**
 * JSON editor wrapper that handles parsing and formatting.
 * The CodeEditor handles JSON validation and formatting using Prettier.
 * 
 * When preserveRaw is true, onSave receives both the parsed object AND
 * the raw formatted string (with comments preserved).
 */
export function ScopedJsonEditor({ 
  data, 
  onSave, 
  label, 
  height, 
  rawInitialContent,
  preserveRaw = false,
}: ScopedJsonEditorProps) {
  const initialContent = rawInitialContent ?? JSON.stringify(data, null, 2);

  const handleSave = (content: string) => {
    // Content is already validated and formatted by CodeEditor (via Prettier)
    // Parse to get the object
    try {
      // Strip comments for parsing to object
      let stripped = content.replace(/\\"|"(?:\\"|[^"])*"|(\/{2}.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? "" : m);
      stripped = stripped.replace(/,(\s*[}\]])/g, '$1');
      const parsed = JSON.parse(stripped);
      
      if (preserveRaw) {
        // Pass both parsed object and raw content
        onSave(parsed, content);
      } else {
        onSave(parsed);
      }
    } catch {
      // Should not happen as CodeEditor validates, but be safe
      throw new Error("Invalid JSON");
    }
  };

  return (
    <CodeEditor
      initialContent={initialContent}
      onSave={handleSave}
      height={height}
      label={label}
      language="json"
      autoFormat={true}
    />
  );
}
