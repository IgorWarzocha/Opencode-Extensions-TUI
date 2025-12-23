/**
 * Sidebar navigation for the config editor modal.
 * Renders selectable sections and supports mouse-driven section switching.
 */

import { MouseButton, t, dim, bold, cyan } from "@opentui/core";
import { ocTheme } from "../../theme";
import { SECTIONS, type ConfigSectionId } from "../../types/config";

interface ConfigSidebarProps {
  activeSection: ConfigSectionId;
  onSelect: (section: ConfigSectionId) => void;
}

export function ConfigSidebar({ activeSection, onSelect }: ConfigSidebarProps) {
  return (
    <box
      flexDirection="column"
      width={20}
      borderStyle="single"
      borderColor={ocTheme.border}
      padding={1}
    >
      <text content={t`${bold("Navigation")}`} />
      <box height={1} />
      
      <box flexDirection="column">
        {SECTIONS.map((section) => {
          const isActive = section.id === activeSection;
          const label = isActive ? bold(cyan(`> ${section.label}`)) : dim(`  ${section.label}`);
          
          return (
            <box
              key={section.id}
              height={1}
              onMouseDown={(event) => {
                if (event.button !== MouseButton.LEFT) return;
                onSelect(section.id);
              }}
            >
              <text content={t`${label}`} />
            </box>
          );
        })}
      </box>
      
      <box marginTop={2}>
         <text content={t`${dim("Use Ctrl+Up/Down")}`} />
      </box>
    </box>
  );
}
