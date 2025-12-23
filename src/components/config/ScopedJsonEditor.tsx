import { t, dim, bold, cyan, green, red } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useState, useEffect } from "react";
import { ocTheme } from "../../theme";

interface ScopedJsonEditorProps {
  data: any;
  onSave: (newData: any) => void;
  label: string;
  height: number;
}

export function ScopedJsonEditor({ data, onSave, label, height }: ScopedJsonEditorProps) {
  const [content, setContent] = useState("");
  const [cursor, setCursor] = useState(0);
  const [scrollRow, setScrollRow] = useState(0);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Initialize content
  useEffect(() => {
    setContent(JSON.stringify(data, null, 2));
    setCursor(0);
    setScrollRow(0);
  }, [data]);

  // Helper to find visual line/col from index
  const getCursorPos = () => {
    const preCursor = content.slice(0, cursor);
    const lines = preCursor.split('\n');
    const row = lines.length - 1;
    // safe access
    const lastLine = lines[lines.length - 1] || "";
    const col = lastLine.length;
    return { row, col };
  };

  const moveCursorVertical = (direction: -1 | 1) => {
    const { row, col } = getCursorPos();
    const lines = content.split('\n');
    const targetRow = row + direction;
    if (targetRow < 0 || targetRow >= lines.length) return;

    let newIndex = 0;
    for (let i = 0; i < targetRow; i++) {
      newIndex += (lines[i] || "").length + 1;
    }
    const targetLineLength = (lines[targetRow] || "").length;
    newIndex += Math.min(col, targetLineLength);
    setCursor(newIndex);

    if (targetRow < scrollRow) {
      setScrollRow(targetRow);
    } else if (targetRow >= scrollRow + height) {
      setScrollRow(targetRow - height + 1);
    }
  };

  useKeyboard((key) => {
    if (key.ctrl && key.name === "s") {
      try {
        const parsed = JSON.parse(content);
        onSave(parsed);
        setMessage({ text: "Section Saved", type: "success" });
        setTimeout(() => setMessage(null), 2000);
      } catch (e) {
        setMessage({ text: "Invalid JSON", type: "error" });
      }
      return;
    }

    // Basic navigation
    if (key.name === "left") {
      setCursor(prev => Math.max(0, prev - 1));
    } else if (key.name === "right") {
      setCursor(prev => Math.min(content.length, prev + 1));
    } else if (key.name === "up") {
      moveCursorVertical(-1);
    } else if (key.name === "down") {
      moveCursorVertical(1);
    } else if (key.name === "backspace") {
      if (cursor > 0) {
        setContent(prev => prev.slice(0, cursor - 1) + prev.slice(cursor));
        setCursor(prev => prev - 1);
      }
    } else if (key.name === "delete") {
       if (cursor < content.length) {
         setContent(prev => prev.slice(0, cursor) + prev.slice(cursor + 1));
       }
    } else if (key.name === "return" || key.name === "enter") {
       setContent(prev => prev.slice(0, cursor) + "\n" + prev.slice(cursor));
       setCursor(prev => prev + 1);
    } else if (key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
       setContent(prev => prev.slice(0, cursor) + key.sequence + prev.slice(cursor));
       setCursor(prev => prev + 1);
    }
  });

  const lines = content.split('\n');
  const visibleLines = lines.slice(scrollRow, scrollRow + height);
  const { row: cursorRow, col: cursorCol } = getCursorPos();
  const viewCursorRow = cursorRow - scrollRow;

  return (
    <box flexDirection="column" flexGrow={1} borderStyle="single" borderColor={ocTheme.border} padding={1}>
      <box marginBottom={1} flexDirection="row" justifyContent="space-between">
        <text content={t`${bold(label)}`} />
        {message && (
            <text content={t`${message.type === "success" ? green(message.text) : red(message.text)}`} />
        )}
      </box>
      <box flexDirection="column" height={height} overflow="hidden">
        {visibleLines.map((line, idx) => {
           const isCursorRow = idx === viewCursorRow;
           if (isCursorRow) {
               const pre = line.slice(0, cursorCol);
               const char = line[cursorCol] || " ";
               const post = line.slice(cursorCol + 1);
               return (
                 <box key={idx} height={1} flexDirection="row">
                    <text content={pre} />
                    <text content={t`${bold(cyan(char))}`} />
                    <text content={post} />
                 </box>
               );
           }
           return <box key={idx} height={1}><text content={line} /></box>;
        })}
      </box>
      <box marginTop={1} flexDirection="row" justifyContent="space-between">
        <text content={t`${dim("Ctrl+S to save changes")}`} />
        <text content={t`${dim(`Ln ${cursorRow + 1}, Col ${cursorCol + 1}`)}`} />
      </box>
    </box>
  );
}
