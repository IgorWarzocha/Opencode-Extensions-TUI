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
      <text content={t`${bold(extension.name)} v${extension.version || 'unknown'}`} />
      <text content={t`${extension.source || ''}`} />
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
    <box marginBottom={1} flexDirection="column" rowGap={0}>
      <text content={t`${bold('Author')} ${githubData?.owner?.login || extension.author || 'Unknown'}`} />
      <text content={t`${bold('Downloads')} ${extension.download_count ?? 0}  ${bold('Stars')} ${(githubData?.stargazers_count ?? extension.star_count) ?? 0}`} />
      <text content={t`${bold('Forks')} ${githubData?.forks_count || 0}`} />
      <text content={t`${bold('License')} ${githubData?.license?.name || extension.license || 'Unknown'}`} />
      <text content={t`${bold('Category')} ${extension.category || 'Uncategorized'}`} />
      {githubData?.language && (
        <text content={t`${bold('Language')} ${githubData.language}`} />
      )}
      {githubData?.topics && githubData.topics.length > 0 && (
        <text content={t`${bold('Topics')} ${githubData.topics.map(topic => `\`${topic}\``).join(', ')}`} />
      )}
    </box>
  );
}

interface GitHubInfoProps {
  githubData: GitHubRepo | null;
}

export function GitHubInfo({ githubData }: GitHubInfoProps) {
  if (!githubData) return null;

  return (
    <box marginBottom={1} borderStyle="single" borderColor={ocTheme.border} padding={1} title="GitHub Repository">
      <text content={t`${bold('Repository')} ${githubData.html_url}`} />
      <text content={t`${bold('Created')} ${new Date(githubData.created_at).toLocaleDateString()}`} />
      <text content={t`${bold('Updated')} ${new Date(githubData.updated_at).toLocaleDateString()}`} />
      {githubData.homepage && (
        <text content={t`${bold('Homepage')} ${githubData.homepage}`} />
      )}
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