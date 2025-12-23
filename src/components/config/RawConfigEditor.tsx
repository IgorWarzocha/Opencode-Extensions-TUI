import { CodeEditor } from "../ui/CodeEditor.js";

interface RawConfigEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  height: number;
}

export function RawConfigEditor({ initialContent, onSave, height }: RawConfigEditorProps) {
  return (
    <CodeEditor 
      initialContent={initialContent} 
      onSave={onSave} 
      height={height} 
      label="Raw Editor (Comments Supported)"
      language="json"
      autoFormat={true}
    />
  );
}
