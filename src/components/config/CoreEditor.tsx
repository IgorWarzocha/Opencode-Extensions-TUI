import { t, dim, bold, cyan } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useState } from "react";
import { ocTheme } from "../../theme";
import type { OpencodeConfig } from "../../types/config";

interface CoreEditorProps {
  config: OpencodeConfig;
  onChange: (config: OpencodeConfig) => void;
}

// Define field types explicitly to help TS
type FieldDef = 
  | { key: keyof OpencodeConfig; label: string; type: "text" }
  | { key: keyof OpencodeConfig; label: string; type: "boolean" }
  | { key: keyof OpencodeConfig; label: string; type: "enum"; options: readonly string[] };

const FIELDS: readonly FieldDef[] = [
  { key: "theme", label: "Theme", type: "text" },
  { key: "username", label: "Username", type: "text" },
  { key: "model", label: "Model", type: "text" },
  { key: "default_agent", label: "Default Agent", type: "text" },
  { key: "share", label: "Share Mode", type: "enum", options: ["manual", "auto", "disabled"] },
  { key: "autoupdate", label: "Auto Update", type: "boolean" },
];

export function CoreEditor({ config, onChange }: CoreEditorProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const activeField = FIELDS[selectedIndex];

  useKeyboard((key) => {
    // Safety check for activeField
    if (!activeField) return;

    if (isEditing) {
      if (key.name === "return" || key.name === "enter") {
        handleSaveEdit();
      } else if (key.name === "escape") {
        setIsEditing(false);
      } else if (key.name === "backspace") {
        setEditValue((prev) => prev.slice(0, -1));
      } else if (key.sequence && key.sequence.length === 1) {
        setEditValue((prev) => prev + key.sequence);
      }
      return;
    }

    if (key.name === "up") {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.name === "down") {
      setSelectedIndex((prev) => Math.min(FIELDS.length - 1, prev + 1));
    } else if (key.name === "return" || key.name === "enter") {
      if (activeField.type === "boolean") {
        const current = config[activeField.key];
        const next = current === true ? false : true;
        onChange({ ...config, [activeField.key]: next });
      } else if (activeField.type === "enum") {
        const current = config[activeField.key] as string;
        const options = activeField.options;
        const fallback = options[0] || ""; 
        const idx = options.indexOf(current || fallback);
        const next = options[(idx + 1) % options.length];
        onChange({ ...config, [activeField.key]: next });
      } else {
        // Text
        const val = config[activeField.key];
        // Ensure strictly string
        const valStr = (typeof val === "string" ? val : "") || "";
        setEditValue(valStr);
        setIsEditing(true);
      }
    }
  });

  const handleSaveEdit = () => {
    if (!activeField) return;
    onChange({ ...config, [activeField.key]: editValue });
    setIsEditing(false);
  };

  return (
    <box flexDirection="column" flexGrow={1} padding={1} borderStyle="single" borderColor={ocTheme.border}>
      <box marginBottom={1}>
        <text content={t`${bold("Core Configuration")}`} />
      </box>
      
      <box flexDirection="column">
        {FIELDS.map((field, idx) => {
          const isSelected = idx === selectedIndex;
          const value = config[field.key];
          
          let displayValue: string;

          if (field.type === "boolean") {
            displayValue = value ? "true" : "false";
          } else {
             displayValue = String(value ?? "undefined");
          }
          
          if (isSelected && isEditing) {
             return (
               <box key={field.key} height={1} flexDirection="row">
                 <text content={t`${bold(cyan("> " + field.label))}: `} />
                 <text content={editValue + "█"} />
               </box>
             );
          }

          const labelPart = isSelected ? bold(cyan("> " + field.label)) : dim("  " + field.label);
          const valuePart = isSelected ? bold(displayValue) : displayValue;

          return (
            <box key={field.key} height={1} flexDirection="row">
              <text content={t`${labelPart}: ${valuePart}`} />
            </box>
          );
        })}
      </box>

      <box marginTop={2}>
        <text content={t`${dim("Enter to edit/toggle • Up/Down to navigate")}`} />
      </box>
    </box>
  );
}
