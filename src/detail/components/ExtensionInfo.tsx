import { t, bold } from '@opentui/core';
import { ocTheme } from '../../theme';
import type { GitHubRepo } from '../../services/github';
import type { Extension } from '../../types/extension';
import { ellipsize } from '../../utils/text';

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
  const downloads = extension.download_count || 0;
  const stars = extension.star_count || 0;
  const forks = extension.forks || 0;
  const license = extension.license || 'Unknown';
  const language = extension.language || '';
  const topics = extension.keywords || [];
  const updated = extension.updated_at ? new Date(extension.updated_at).toLocaleDateString() : '';

  const metadataItems: string[] = [
    `Author: ${author}`,
    license && `License: ${license}`,
    language && `Language: ${language}`,
    `★ ${stars}`,
    `↓ ${downloads}`,
    forks > 0 && `⑂ ${forks}`,
    updated && `Updated: ${updated}`,
  ].filter((item): item is string => Boolean(item));

  return (
    <box marginBottom={1}>
      <box flexDirection="column" rowGap={0}>
        {/* Single compact line with all metadata */}
        <box flexDirection="row" justifyContent="flex-start" gap={2} marginBottom={topics.length > 0 ? 1 : 0}>
          {metadataItems.map((item, index) => {
            const isStat = item.match(/^[★↓⑂]/);
            const isAuthor = item.startsWith('Author:');
            const isLicense = item.startsWith('License:');
            const isLanguage = item.startsWith('Language:');
            const isUpdated = item.startsWith('Updated:');
            
            return (
              <text 
                key={index}
                content={t`${item}`}
                fg={
                  isStat ? ocTheme.warning :
                  isAuthor ? ocTheme.secondary :
                  isLicense ? ocTheme.text :
                  isLanguage ? ocTheme.warning :
                  isUpdated ? ocTheme.textMuted :
                  ocTheme.text
                } 
              />
            );
          })}
        </box>

        {/* Topics (if any) */}
        {topics.length > 0 && (
          <box flexDirection="row" gap={1}>
            <text content={t`${bold('Topics:')} `} fg={ocTheme.textMuted} />
            <text content={t`${ellipsize(topics.join(', '), 50)}`} fg={ocTheme.success} />
          </box>
        )}

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
  if (!extension.long_description) return null;

  return (
    <box marginBottom={1}>
      <text content={t`${extension.long_description}`} />
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

interface ExtensionCuratorNotesProps {
  extension: Extension;
}

export function ExtensionCuratorNotes({ extension }: ExtensionCuratorNotesProps) {
  if (!extension.curator_notes) return null;

  return (
    <box marginTop={1}>
      <text content={t`${bold('Curator Notes:')} `} fg={ocTheme.textMuted} />
      <text content={t`${extension.curator_notes}`} />
    </box>
  );
}