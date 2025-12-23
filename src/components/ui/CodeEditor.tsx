import { t, dim, bold, green, red, bg } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useState, useEffect } from "react";
import { ocTheme } from "../../theme.js";
import { formatJSONC, formatJsonError } from "../../utils/json.js";

interface CodeEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  height: number;
  label?: string;
  language?: "json" | "text";
  /** Auto-format JSON on save (default: true for json language) */
  autoFormat?: boolean;
}

/**
 * Reusable text editor component with basic navigation and scrolling.
 * 
 * Keybindings:
 * - Ctrl+S: Save
 * - Ctrl+D: Toggle comment on current line
 * - Home: Jump to first non-whitespace char (or line start)
 * - End: Jump to end of line
 * - Arrow keys: Navigate
 */
export function CodeEditor({ 
  initialContent, 
  onSave, 
  height, 
  label = "Editor",
  language = "json",
  autoFormat = true,
}: CodeEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [cursor, setCursor] = useState(0);
  const [scrollRow, setScrollRow] = useState(0);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    setContent(initialContent);
    setCursor(0);
    setScrollRow(0);
  }, [initialContent]);

  // ─────────────────────────────────────────────────────────────────────────
  // Cursor position helpers
  // ─────────────────────────────────────────────────────────────────────────

  const getCursorPos = () => {
    const preCursor = content.slice(0, cursor);
    const lines = preCursor.split('\n');
    const row = lines.length - 1;
    const lastLine = lines[lines.length - 1] ?? "";
    const col = lastLine.length;
    return { row, col };
  };

  const getLineInfo = (row: number) => {
    const lines = content.split('\n');
    const line = lines[row] ?? "";
    
    // Find start index of this line in content
    let startIndex = 0;
    for (let i = 0; i < row; i++) {
      startIndex += (lines[i] ?? "").length + 1;
    }
    
    // Find first non-whitespace character
    const firstNonWs = line.search(/\S/);
    const firstNonWsCol = firstNonWs === -1 ? 0 : firstNonWs;
    
    return { 
      line, 
      startIndex, 
      endIndex: startIndex + line.length,
      length: line.length,
      firstNonWsCol,
    };
  };

  const moveCursorVertical = (direction: -1 | 1) => {
    const { row } = getCursorPos();
    const lines = content.split('\n');
    const targetRow = row + direction;
    if (targetRow < 0 || targetRow >= lines.length) return;

    // Calculate start index of target line
    let newIndex = 0;
    for (let i = 0; i < targetRow; i++) {
      newIndex += (lines[i] ?? "").length + 1;
    }
    
    // Jump to first non-whitespace character on the target line
    const targetLine = lines[targetRow] ?? "";
    const firstNonWs = targetLine.search(/\S/);
    const targetCol = firstNonWs === -1 ? 0 : firstNonWs;
    newIndex += targetCol;
    
    setCursor(newIndex);

    if (targetRow < scrollRow) {
      setScrollRow(targetRow);
    } else if (targetRow >= scrollRow + height) {
      setScrollRow(targetRow - height + 1);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Comment toggle (Ctrl+D)
  // ─────────────────────────────────────────────────────────────────────────

  const toggleLineComment = () => {
    const { row } = getCursorPos();
    const lines = content.split('\n');
    const line = lines[row] ?? "";
    
    // Find the indentation
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch?.[1] ?? "";
    const restOfLine = line.slice(indent.length);
    
    let newLine: string;
    let cursorAdjust: number;
    
    if (restOfLine.startsWith("// ")) {
      // Uncomment: remove "// "
      newLine = indent + restOfLine.slice(3);
      cursorAdjust = -3;
    } else if (restOfLine.startsWith("//")) {
      // Uncomment: remove "//"
      newLine = indent + restOfLine.slice(2);
      cursorAdjust = -2;
    } else {
      // Comment: add "// "
      newLine = indent + "// " + restOfLine;
      cursorAdjust = 3;
    }
    
    lines[row] = newLine;
    const newContent = lines.join('\n');
    setContent(newContent);
    
    // Adjust cursor position
    const { col } = getCursorPos();
    const lineInfo = getLineInfo(row);
    const newCol = Math.max(0, Math.min(col + cursorAdjust, newLine.length));
    setCursor(lineInfo.startIndex + newCol);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Save handler (async for Prettier formatting)
  // ─────────────────────────────────────────────────────────────────────────

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (isSaving) return;
    
    let contentToSave = content;
    
    if (language === "json" && autoFormat) {
      setIsSaving(true);
      const result = await formatJSONC(content);
      setIsSaving(false);
      
      if (!result.success) {
        setMessage({ text: formatJsonError(result), type: "error" });
        setTimeout(() => setMessage(null), 5000);
        return;
      }
      
      contentToSave = result.formatted;
      setContent(result.formatted);
    }
    
    onSave(contentToSave);
    setMessage({ text: "Saved", type: "success" });
    setTimeout(() => setMessage(null), 2000);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Keyboard handler
  // ─────────────────────────────────────────────────────────────────────────

  useKeyboard((key) => {
    // Ctrl+S: Save
    if (key.ctrl && key.name === "s") {
      handleSave();
      return;
    }

    // Ctrl+D: Toggle comment
    if (key.ctrl && key.name === "d") {
      toggleLineComment();
      return;
    }

    // Home: Jump to first non-whitespace or line start
    if (key.name === "home") {
      const { row, col } = getCursorPos();
      const lineInfo = getLineInfo(row);
      
      // If already at first non-ws, go to start; otherwise go to first non-ws
      const targetCol = col === lineInfo.firstNonWsCol ? 0 : lineInfo.firstNonWsCol;
      setCursor(lineInfo.startIndex + targetCol);
      return;
    }

    // End: Jump to end of line
    if (key.name === "end") {
      const { row } = getCursorPos();
      const lineInfo = getLineInfo(row);
      setCursor(lineInfo.endIndex);
      return;
    }

    // Navigation
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
    } else if (key.name === "tab") {
       // Insert 2 spaces for tab
       setContent(prev => prev.slice(0, cursor) + "  " + prev.slice(cursor));
       setCursor(prev => prev + 2);
    } else if (key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
       setContent(prev => prev.slice(0, cursor) + key.sequence + prev.slice(cursor));
       setCursor(prev => prev + 1);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

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
               // Always show cursor - use inverse for visibility even on whitespace
               const charAtCursor = line[cursorCol];
               const cursorChar = charAtCursor ?? " ";
               const post = charAtCursor ? line.slice(cursorCol + 1) : "";
               
               return (
                 <box key={idx} height={1} flexDirection="row">
                    <text content={pre} />
                    <text content={t`${bg("#ffffff")(cursorChar)}`} />
                    <text content={post} />
                 </box>
               );
           }
           return <box key={idx} height={1}><text content={line || " "} /></box>;
        })}
      </box>
      <box marginTop={1} flexDirection="row" justifyContent="space-between">
        <text content={t`${dim("Ctrl+S Save | Ctrl+D Comment | Home/End")}`} />
        <text content={t`${dim(`Ln ${cursorRow + 1}, Col ${cursorCol + 1}`)}`} />
      </box>
    </box>
  );
}
