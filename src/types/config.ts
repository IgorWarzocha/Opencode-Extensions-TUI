export interface OpencodeConfig {
  $schema?: string;
  theme?: string;
  username?: string;
  model?: string;
  small_model?: string;
  default_agent?: string;
  share?: "manual" | "auto" | "disabled";
  autoupdate?: boolean | "notify";
  plugin?: string[];
  disabled_providers?: string[];
  enabled_providers?: string[];

  // Complex objects
  agent?: Record<string, any>;
  provider?: Record<string, any>;
  mcp?: Record<string, any>;
  keybinds?: Record<string, string>;

  // Allow others
  [key: string]: any;
}

export const SECTIONS = [
  { id: "core", label: "Core Settings" },
  { id: "plugins", label: "Plugins" },
  { id: "agents", label: "Agents" },
  { id: "providers", label: "Providers" },
  { id: "mcp", label: "MCP Servers" },
  { id: "skills", label: "Skills" },
  { id: "keybinds", label: "Keybindings" },
  { id: "raw", label: "Raw JSON" },
] as const;

export type ConfigSectionId = (typeof SECTIONS)[number]["id"];
