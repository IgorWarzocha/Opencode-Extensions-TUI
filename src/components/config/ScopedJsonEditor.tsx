import { CodeEditor } from "../ui/CodeEditor";

interface ScopedJsonEditorProps {
  data: any;
  onSave: (newData: any) => void;
  label: string;
  height: number;
}

export function ScopedJsonEditor({ data, onSave, label, height }: ScopedJsonEditorProps) {
  const initialContent = JSON.stringify(data, null, 2);

  const handleSave = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      onSave(parsed);
    } catch (e) {
      throw new Error("Invalid JSON");
    }
  };

  return (
    <CodeEditor
      initialContent={initialContent}
      onSave={handleSave}
      height={height}
      label={label}
    />
  );
}
