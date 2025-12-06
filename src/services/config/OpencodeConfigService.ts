import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export type ConfigScope = "global" | "local";

export class OpencodeConfigService {
  private getConfigPath(scope: ConfigScope, customPath?: string): string {
    if (customPath) return customPath;
    
    if (scope === "global") {
      return join(homedir(), ".config", "opencode", "opencode.json");
    }
    
    return join(process.cwd(), "opencode.json");
  }

  private ensureDirectoryExists(filePath: string) {
    const dir = filePath.substring(0, filePath.lastIndexOf("/"));
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Adds a plugin to the opencode.json file while preserving comments and formatting.
   * Uses robust string manipulation instead of JSON.parse/stringify to avoid data loss.
   */
  async addPlugin(pluginName: string, scope: ConfigScope, customPath?: string): Promise<{ success: boolean; message: string }> {
    const configPath = this.getConfigPath(scope, customPath);
    
    try {
      // Scenario 1: File doesn't exist - Create it
      if (!existsSync(configPath)) {
        this.ensureDirectoryExists(configPath);
        const initialContent = `{\n  "plugin": [\n    "${pluginName}"\n  ]\n}\n`;
        writeFileSync(configPath, initialContent, "utf-8");
        return { success: true, message: `Created new config and added plugin: ${pluginName}` };
      }

      const content = readFileSync(configPath, "utf-8");

      // Scenario 2: Plugin already exists
      if (content.includes(`"${pluginName}"`)) {
        return { success: true, message: `Plugin ${pluginName} already exists in config` };
      }

      // Scenario 3: "plugin" key exists
      // Regex looks for "plugin": [ ... ] allowing for whitespace and multiline
      const pluginArrayRegex = /("plugin"\s*:\s*\[)([\s\S]*?)(\])/;
      const match = content.match(pluginArrayRegex);

      if (match) {
        const [, start, innerContent, end] = match;
        
        if (typeof innerContent === 'undefined') {
            return { success: false, message: "Failed to parse plugin array content" };
        }

        // Check if array is empty or has items to determine comma usage
        const hasItems = innerContent.trim().length > 0;
        
        let newPluginEntry = `"${pluginName}"`;
        let replacement = "";

        if (!hasItems) {
           // Empty array: "plugin": [ "name" ]
           replacement = `${start}\n    ${newPluginEntry}\n  ${end}`;
        } else {
           // Existing items. We need to append to the end of innerContent.
           // To be robust, we find the last non-whitespace character of innerContent
           const trimmedInner = innerContent.trimEnd();
           const trailing = innerContent.slice(trimmedInner.length); // Preserve trailing whitespace/indentation before ]
           
           // If the last character isn't a comma, add one (unless it's empty, handled above)
           const lastEffectiveChar = trimmedInner.trim().slice(-1);
           const separator = (lastEffectiveChar === "," || lastEffectiveChar === "[") ? "" : ",";
           
           replacement = `${start}${trimmedInner}${separator}\n    ${newPluginEntry}${trailing}${end}`;
        }
        
        const newContent = content.replace(pluginArrayRegex, replacement);
        writeFileSync(configPath, newContent, "utf-8");
        return { success: true, message: `Added ${pluginName} to existing config` };
      }

      // Scenario 4: "plugin" key missing entirely - Insert it at the end of the object
      // We look for the last closing brace '}' of the root object
      const lastBraceIndex = content.lastIndexOf("}");
      if (lastBraceIndex !== -1) {
        const pre = content.substring(0, lastBraceIndex).trimEnd();
        // Check if we need a comma for the previous property
        const needsComma = !pre.trim().endsWith(",") && !pre.trim().endsWith("{");
        
        const insertion = `${needsComma ? "," : ""}\n  "plugin": [\n    "${pluginName}"\n  ]\n`;
        const newContent = pre + insertion + content.substring(lastBraceIndex);
        
        writeFileSync(configPath, newContent, "utf-8");
        return { success: true, message: `Added plugin array and ${pluginName} to config` };
      }

      return { success: false, message: "Invalid config file format: Could not find root object" };

    } catch (error) {
      return { 
        success: false, 
        message: `Failed to update config: ${error instanceof Error ? error.message : "Unknown error"}` 
      };
    }
  }
}
