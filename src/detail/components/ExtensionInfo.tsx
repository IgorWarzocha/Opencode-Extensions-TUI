import { t, bold } from '@opentui/core';
import { ocTheme } from '../../theme';
import type { GitHubRepo } from '../../services/github';
import type { Extension } from '../../types/extension';

interface ExtensionHeaderProps {
  extension: Extension;
}

export function ExtensionHeader({ extension }: ExtensionHeaderProps) {
  return (
    <box flexDirection="row" justifyContent="space-between" marginBottom={1}>
      <text fg={ocTheme.primary} content={t`${bold(extension.name)}`} />
      <text fg={ocTheme.textMuted} content={t`v${extension.version || 'unknown'}`} />
      <text fg={ocTheme.secondary} content={t`${extension.source || ''}`} />
    </box>
  );
}

interface ExtensionDescriptionProps {
  extension: Extension;
}

export function ExtensionDescription({ extension }: ExtensionDescriptionProps) {
  return (
    <text content={t`${extension.description || ''}\n`} />
  );
}

interface ExtensionMetadataProps {
  extension: Extension;
  githubData: GitHubRepo | null;
}

export function ExtensionMetadata({ extension, githubData }: ExtensionMetadataProps) {
  return (
    <box marginBottom={1} borderStyle="single" borderColor={ocTheme.border} padding={1}>
      <box flexDirection="column" rowGap={0}>
        <text fg={ocTheme.textMuted} content={t`${bold('Author')} `} />
        <text fg={ocTheme.secondary} content={t`${githubData?.owner?.login || extension.author || 'Unknown'}`} />

        <text fg={ocTheme.textMuted} content={t`${bold('Stats')} `} />
        <text content={t`Downloads: ${extension.download_count ?? 0}  Stars: ${(githubData?.stargazers_count ?? extension.star_count) ?? 0}  Forks: ${githubData?.forks_count || 0}`} />

        <text fg={ocTheme.textMuted} content={t`${bold('License')} `} />
        <text content={t`${githubData?.license?.name || extension.license || 'Unknown'}`} />

        <text fg={ocTheme.textMuted} content={t`${bold('Category')} `} />
        <text fg={ocTheme.accent} content={t`${extension.category || 'Uncategorized'}`} />

        {githubData?.language && (
          <>
            <text fg={ocTheme.textMuted} content={t`${bold('Language')} `} />
            <text fg={ocTheme.warning} content={t`${githubData.language}`} />
          </>
        )}
        {githubData?.topics && githubData.topics.length > 0 && (
          <>
            <text fg={ocTheme.textMuted} content={t`${bold('Topics')} `} />
            <text fg={ocTheme.success} content={t`${githubData.topics.map(topic => `${topic}`).join(', ')}`} />
          </>
        )}
      </box>
    </box>
  );
}

interface GitHubInfoProps {
  githubData: GitHubRepo | null;
}

export function GitHubInfo({ githubData }: GitHubInfoProps) {
  if (!githubData) return null;

  return (
    <box marginBottom={1} borderStyle="single" borderColor={ocTheme.borderActive} padding={1}>
      <box flexDirection="column" rowGap={0}>
        <text fg={ocTheme.primary} content={t`${bold('GitHub Repository')}`} />
        <text fg={ocTheme.secondary} content={t`${githubData.html_url}`} />
        <text fg={ocTheme.textMuted} content={t`Created: ${new Date(githubData.created_at).toLocaleDateString()}  Updated: ${new Date(githubData.updated_at).toLocaleDateString()}`} />
        {githubData.homepage && (
          <>
            <text fg={ocTheme.textMuted} content={t`${bold('Homepage')} `} />
            <text fg={ocTheme.secondary} content={t`${githubData.homepage}`} />
          </>
        )}
      </box>
    </box>
  );
}

interface ExtensionAboutProps {
  extension: Extension;
}

export function ExtensionAbout({ extension }: ExtensionAboutProps) {
  if (!extension.long_description) return null;

  return (
    <box marginBottom={1} flexDirection="column" rowGap={0}>
      <text content={t`${bold('About')}`} />
      <text content={t`${extension.long_description}`} />
    </box>
  );
}

interface ExtensionInstallationProps {
  extension: Extension;
}

export function ExtensionInstallation({ extension }: ExtensionInstallationProps) {
  return (
    <box borderStyle="single" borderColor={ocTheme.border} padding={1} title="Installation">
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
    <box marginTop={1} borderStyle="single" borderColor={ocTheme.border} padding={1} title="Curator Notes">
      <text content={t`${extension.curator_notes}`} />
    </box>
  );
}