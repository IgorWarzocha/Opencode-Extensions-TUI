import { t, dim, bold, cyan, green, red } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useEffect, useState } from "react";
import { ocTheme } from "../theme";
import { useTerminalSize } from "../hooks/useTerminalSize";
import { OpencodeConfigService, type ConfigScope } from "../services/config/OpencodeConfigService";
import { SECTIONS, type OpencodeConfig, type ConfigSectionId } from "../types/config";
import { ConfigSidebar } from "./config/ConfigSidebar";
import { CoreEditor } from "./config/CoreEditor";
import { PluginEditor } from "./config/PluginEditor";
import { ScopedJsonEditor } from "./config/ScopedJsonEditor";
import { RawConfigEditor } from "./config/RawConfigEditor";
import { SectionListEditor } from "./config/SectionListEditor";
import { parseJSONC } from "../utils/json";

interface ConfigEditorModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const configService = new OpencodeConfigService();

export function ConfigEditorModal({ isVisible, onClose }: ConfigEditorModalProps) {
  const { width: termWidth, height: termHeight } = useTerminalSize();
  const [scope, setScope] = useState<ConfigScope>("local");
  const [config, setConfig] = useState<OpencodeConfig>({});
  const [rawContent, setRawContent] = useState<string>("");
  const [activeSection, setActiveSection] = useState<ConfigSectionId>("core");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const modalWidth = Math.floor(termWidth * 0.9);
  const modalHeight = Math.floor(termHeight * 0.9);

  // Calculate available height for the editor content
  // Modal Height - Borders(2) - Header(3) - Footer(1) = Container Height
  // Container Height - Editor Borders(2) - Editor Padding(2) - Editor Header(2) - Editor Footer(2) = Text Area
  // Roughly: modalHeight - 14
  const editorAreaHeight = Math.max(5, modalHeight - 14);

  useEffect(() => {
    if (isVisible) {
      loadConfig(scope);
      setMessage(null);
    }
  }, [isVisible, scope]);

  const loadConfig = (s: ConfigScope) => {
    try {
      const result = configService.getConfig(s);
      if (result.exists && result.content !== null) {
        setRawContent(result.content);
        try {
          setConfig(parseJSONC(result.content));
        } catch (e) {
          setMessage({ text: "Loaded with parse errors", type: "error" });
          setConfig({});
        }
      } else {
        setConfig({});
        setRawContent("{}");
      }
    } catch (e) {
      setMessage({ text: "Failed to load/parse config", type: "error" });
    }
  };

  const saveConfig = (newConfig: OpencodeConfig) => {
    try {
      const json = JSON.stringify(newConfig, null, 2);
      configService.writeConfig(scope, json);
      setConfig(newConfig);
      setRawContent(json);
      setMessage({ text: "Saved!", type: "success" });
      setTimeout(() => setMessage(null), 2000);
    } catch (e) {
      setMessage({ text: "Failed to save", type: "error" });
    }
  };
  
  const saveRawConfig = (content: string) => {
    try {
        configService.writeConfig(scope, content);
        setRawContent(content);
        try {
            setConfig(parseJSONC(content));
            setMessage({ text: "Saved!", type: "success" });
        } catch(e) {
            setMessage({ text: "Saved (invalid JSON)", type: "error" });
        }
        setTimeout(() => setMessage(null), 2000);
    } catch (e) {
        setMessage({ text: "Failed to save raw content", type: "error" });
    }
  };

  // Generic handler for partial updates
  const handleUpdate = (updates: Partial<OpencodeConfig>) => {
    const next = { ...config, ...updates };
    setConfig(next);
    // Auto-save on specific actions? Maybe better to require manual save for safety
    // But 'onSave' in ScopedJsonEditor implies immediate save.
    // Let's autosave for Core/Plugins too to be consistent?
    // User expects 'Ctrl+S' usually.
    // CoreEditor updates immediately on change.
    // Let's NOT autosave on every keystroke, but ScopedJsonEditor has Ctrl+S.
    // CoreEditor and PluginEditor update state. We should listen for Ctrl+S global.
  };

  useKeyboard((key) => {
    if (!isVisible) return;

    if (key.ctrl && (key.name === "left" || key.name === "h")) {
        setScope("local");
        return;
    }
    if (key.ctrl && (key.name === "right" || key.name === "l")) {
        setScope("global");
        return;
    }
    
    // Switch sections
    if (key.ctrl && key.name === "up") {
       // Ideally we cycle activeSection
       return;
    }

    if (key.ctrl && key.name === "s") {
        saveConfig(config);
    }
    
    if (key.name === "escape") {
        onClose();
    }
  });

  if (!isVisible) return null;

  const renderContent = () => {
    switch (activeSection) {
      case "core":
        return <CoreEditor config={config} onChange={handleUpdate} />;
      case "plugins":
        return <PluginEditor rawContent={rawContent} onChange={(newRaw) => {
            setRawContent(newRaw);
            try { setConfig(parseJSONC(newRaw)); } catch(e) {}
            configService.writeConfig(scope, newRaw);
        }} height={editorAreaHeight} />;
      case "agents":
        return <SectionListEditor rawContent={rawContent} sectionKey="agent" onChange={(newRaw) => {
            setRawContent(newRaw);
            try { setConfig(parseJSONC(newRaw)); } catch(e) {}
            configService.writeConfig(scope, newRaw);
        }} height={editorAreaHeight} />;
      case "providers":
        return <SectionListEditor rawContent={rawContent} sectionKey="provider" onChange={(newRaw) => {
            setRawContent(newRaw);
            try { setConfig(parseJSONC(newRaw)); } catch(e) {}
            configService.writeConfig(scope, newRaw);
        }} height={editorAreaHeight} />;
      case "mcp":
        return <SectionListEditor rawContent={rawContent} sectionKey="mcp" onChange={(newRaw) => {
            setRawContent(newRaw);
            try { setConfig(parseJSONC(newRaw)); } catch(e) {}
            configService.writeConfig(scope, newRaw);
        }} height={editorAreaHeight} />;
      case "keybinds":
        return <ScopedJsonEditor data={config.keybinds || {}} onSave={(data) => {
           handleUpdate({ keybinds: data });
           saveConfig({ ...config, keybinds: data });
        }} label="Keybindings" height={editorAreaHeight} />;
      case "raw":
        return <RawConfigEditor initialContent={rawContent} onSave={saveRawConfig} height={editorAreaHeight} />;
      default:
        return <text content="Select a section" />;
    }
  };

  return (
    <box
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        marginLeft: -Math.floor(modalWidth / 2),
        marginTop: -Math.floor(modalHeight / 2),
        width: modalWidth,
        height: modalHeight,
        zIndex: 100,
      }}
      backgroundColor={ocTheme.background}
      borderStyle="double"
      borderColor={ocTheme.accent}
      flexDirection="column"
      padding={0}
    >
      {/* Header */}
      <box height={3} borderStyle="single" borderColor={ocTheme.border} flexDirection="row" justifyContent="space-between" paddingLeft={1} paddingRight={1} alignItems="center">
        <box flexDirection="row">
           <text content={t`${bold("Config Editor")}`} />
           <box marginLeft={2}>
             <text content={t`${scope === "local" ? bold(cyan("[Local]")) : dim(" Local ")}  ${scope === "global" ? bold(cyan("[Global]")) : dim(" Global ")}`} />
           </box>
        </box>
        <box>
           {message && <text content={t`${message.type === "success" ? green(message.text) : red(message.text)}`} />}
           {!message && <text content={t`${dim(configService.getConfigPath(scope).slice(-40))}`} />}
        </box>
      </box>

      {/* Main Body */}
      <box flexGrow={1} flexDirection="row">
        <ConfigSidebar activeSection={activeSection} onSelect={setActiveSection} />
        <box flexGrow={1} flexDirection="column">
            {/* 
                Problem: ConfigSidebar needs to capture keyboard for navigation, but 
                Content needs capture for editing.
                Solution: Use 'Tab' to toggle focus between Sidebar and Content?
                Or Global shortcuts Ctrl+Up/Down for sidebar?
            */}
            <ConfigSidebarKeyboardHandler 
                activeSection={activeSection} 
                onSelect={setActiveSection} 
            />
            {renderContent()}
        </box>
      </box>

      {/* Footer */}
      <box height={1} paddingLeft={1} marginTop={0} backgroundColor={ocTheme.menu}>
         <text content={t`${dim("Ctrl+Left/Right: Scope • Ctrl+Up/Down: Section • Ctrl+S: Save • Esc: Close")}`} />
      </box>
    </box>
  );
}

// Helper to handle sidebar navigation globally
// This is a bit hacky but ensures we can navigate sections even when editor is focused (using Ctrl)
function ConfigSidebarKeyboardHandler({ activeSection, onSelect }: { activeSection: ConfigSectionId, onSelect: (s: ConfigSectionId) => void }) {
    useKeyboard((key) => {
        if (key.ctrl) {
            if (key.name === "down") {
                const idx = SECTIONS.findIndex((s) => s.id === activeSection);
                const next = SECTIONS[(idx + 1) % SECTIONS.length];
                if (next) onSelect(next.id);
            } else if (key.name === "up") {
                const idx = SECTIONS.findIndex((s) => s.id === activeSection);
                const prev = SECTIONS[(idx - 1 + SECTIONS.length) % SECTIONS.length];
                if (prev) onSelect(prev.id);
            }
        }
    });
    return null;
}
