/**
 * ⚠️  POTENTIALLY OBSOLETE - Candidate for future removal:
 * - Depends on GitHub service for runtime fetching when READMEs should be cached in SQLite
 * - New architecture: submission processing pre-fetches all GitHub data during intake
 * - Consider migrating to use DatabaseService for cached repo metadata instead
 * - Keep until SQLite-only data flow migration is complete and performance validated
 */
import { t, bold } from '@opentui/core';
import { ocTheme } from '../../theme';
import type { GitHubRepo } from '../../services/github';
import type { Extension } from '../../types/extension';

interface ExtensionHeaderProps {
  extension: Extension;
}

export function ExtensionHeader({ extension }: ExtensionHeaderProps) {
  const category = extension.category ? `[${extension.category}]` : '';
  const author = extension.author || 'Unknown';
  const repository = extension.repository_url || '';

  return (
    <box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom={1}>
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

  return (
    <text fg={ocTheme.textMuted} content={t`${extension.description}`} />
  );
}

interface ExtensionMetadataProps {
  extension: Extension;
  githubData: GitHubRepo | null;
}

export function ExtensionMetadata({ extension, githubData }: ExtensionMetadataProps) {
  const author = extension.author || 'Unknown';

  const metadataItems: string[] = [
    `Author: ${author}`,
  ];

  return (
    <box marginBottom={1}>
      <box flexDirection="column" rowGap={0}>
        <box flexDirection="row" justifyContent="flex-start" gap={2}>
          {metadataItems.map((item, index) => (
            <text 
              key={index}
              content={t`${item}`}
              fg={ocTheme.secondary}
            />
          ))}
        </box>

        {/* Repository URL (if GitHub) */}
        {githubData?.html_url && (
          <box flexDirection="row" gap={1} marginTop={1}>
            <text content={t`${bold('Repository:')} `} fg={ocTheme.textMuted} />
            <text content={t`${githubData.html_url}`} fg={ocTheme.secondary} />
          </box>
        )}
      </box>
    </box>
  );
}

interface GitHubInfoProps {
  githubData: GitHubRepo | null;
}

export function GitHubInfo({ githubData }: GitHubInfoProps) {
  // GitHub info is now merged into ExtensionMetadata
  return null;
}

interface ExtensionAboutProps {
  extension: Extension;
}

export function ExtensionAbout({ extension }: ExtensionAboutProps) {
  if (!extension.readme) return null;

  return (
    <box marginBottom={1}>
      <text content={t`${extension.readme}`} />
    </box>
  );
}

interface ExtensionInstallationProps {
  extension: Extension;
}

export function ExtensionInstallation({ extension }: ExtensionInstallationProps) {
  return (
    <box 
      marginBottom={1} 
      backgroundColor={ocTheme.panel}
      borderStyle="single"
      borderColor={ocTheme.border}
      padding={1}
      title="Installation"
    >
      <text content={t`${extension.install_command || 'No install command'}`} />
    </box>
  );
}

