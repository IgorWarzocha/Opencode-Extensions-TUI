/**
 * Extension info display components for the detail view.
 * Renders header, description, installation info, and skills list for bundles.
 */
import type { MouseEvent } from "@opentui/core";
import { t, bold, dim, cyan } from "@opentui/core";
import { ocTheme } from "../../theme";
import type { Extension } from "../../types/extension";

interface ExtensionHeaderProps {
  extension: Extension;
}

export function ExtensionHeader({ extension }: ExtensionHeaderProps) {
  const category = extension.category ? `[${extension.category}]` : "";
  const author = extension.author || "Unknown";
  const repository = extension.repository_url || "";

  return (
    <box
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      marginBottom={1}
    >
      <box flexDirection="row" gap={2}>
        {category && <text fg={ocTheme.accent} content={t`${category}`} />}
        <text fg={ocTheme.primary} content={t`${bold(extension.name)}`} />
        <text fg={ocTheme.secondary} content={t`${author}`} />
      </box>
      {repository && <text fg={ocTheme.textMuted} content={t`${repository}`} />}
    </box>
  );
}

interface ExtensionDescriptionProps {
  extension: Extension;
}

export function ExtensionDescription({ extension }: ExtensionDescriptionProps) {
  if (!extension.description) return null;
  return <text fg={ocTheme.textMuted} content={t`${extension.description}`} />;
}

interface ExtensionInstallationProps {
  extension: Extension;
  onMouseDown?: (event: MouseEvent) => void;
}

export function ExtensionInstallation({
  extension,
  onMouseDown,
}: ExtensionInstallationProps) {
  const installText = extension.install_command || "No install command";

  return (
    <box
      marginBottom={1}
      backgroundColor={ocTheme.panel}
      borderStyle="single"
      borderColor={ocTheme.border}
      padding={1}
      title="Installation"
      onMouseDown={onMouseDown}
    >
      <text content={t`${installText}`} />
    </box>
  );
}

interface SkillsListProps {
  extension: Extension;
}

export function SkillsList({ extension }: SkillsListProps) {
  if (extension.install_method !== "skills" || !extension.data?.length)
    return null;

  return (
    <box flexDirection="column" marginTop={1}>
      <text
        content={t`${bold("Available Skills")} ${dim(`(${extension.data.length})`)}`}
      />
      <box
        flexDirection="column"
        marginTop={1}
        borderStyle="single"
        borderColor={ocTheme.border}
        padding={1}
      >
        {extension.data.map((skill) => (
          <box key={skill.pathName} flexDirection="row">
            <text
              content={t`${cyan("•")} ${skill.name} ${dim(`(${skill.pathName})`)}`}
            />
          </box>
        ))}
      </box>
    </box>
  );
}
