import { t, bold } from '@opentui/core';
import { ocTheme } from '../../theme';
import type { GitHubRepo } from '../../services/github';
import type { Extension } from '../../types/extension';

interface ExtensionHeaderProps {
  extension: Extension;
}

export function ExtensionHeader({ extension }: ExtensionHeaderProps) {
  const version = extension.version ? `v${extension.version}` : '';
  const category = extension.category ? `[${extension.category}]` : '';
  const source = extension.source || '';

  return (
    <box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom={1}>
      <text fg={ocTheme.primary} content={t`${bold(extension.name)}`} />
      <box flexDirection="row" gap={2}>
        {version && <text fg={ocTheme.textMuted} content={t`${version}`} />}
        {category && <text fg={ocTheme.accent} content={t`${category}`} />}
        {source && <text fg={ocTheme.secondary} content={t`${source}`} />}
      </box>
    </box>
  );
}

interface ExtensionDescriptionProps {
  extension: Extension;
}

export function ExtensionDescription({ extension }: ExtensionDescriptionProps) {
  // Only show if there's no long_description (About section)
  if (!extension.description || extension.long_description) return null;

  return (
    <text fg={ocTheme.textMuted} content={t`${extension.description}`} />
  );
}

interface ExtensionMetadataProps {
  extension: Extension;
  githubData: GitHubRepo | null;
}

export function ExtensionMetadata({ extension, githubData }: ExtensionMetadataProps) {
  const author = githubData?.owner?.login || extension.author || 'Unknown';
  const downloads = extension.download_count ?? 0;
  const stars = (githubData?.stargazers_count ?? extension.star_count) ?? 0;
  const forks = githubData?.forks_count || 0;
  const license = githubData?.license?.name || extension.license || 'Unknown';
  const language = githubData?.language || '';
  const topics = githubData?.topics || [];
  const updated = githubData?.updated_at ? new Date(githubData.updated_at).toLocaleDateString() : '';

  return (
    <box marginBottom={1} borderStyle="single" borderColor={ocTheme.border} padding={1}>
      <box flexDirection="column" rowGap={0}>
        {/* Row 1: Author and Stats */}
        <box flexDirection="row" justifyContent="space-between">
          <text content={t`${bold('Author:')} `} fg={ocTheme.textMuted} />
          <text content={t`${author}`} fg={ocTheme.secondary} />
          <text content={t`  ★ ${stars}`} fg={ocTheme.warning} />
          <text content={t`  ↓ ${downloads}`} fg={ocTheme.success} />
          {forks > 0 && <text content={t`  ⑂ ${forks}`} fg={ocTheme.textMuted} />}
        </box>

        {/* Row 2: License and Language */}
        <box flexDirection="row" justifyContent="space-between">
          <box flexDirection="row">
            <text content={t`${bold('License:')} `} fg={ocTheme.textMuted} />
            <text content={t`${license}`} />
          </box>
          {language && (
            <box flexDirection="row">
              <text content={t`${bold('Language:')} `} fg={ocTheme.textMuted} />
              <text content={t`${language}`} fg={ocTheme.warning} />
            </box>
          )}
          {updated && (
            <box flexDirection="row">
              <text content={t`${bold('Updated:')} `} fg={ocTheme.textMuted} />
              <text content={t`${updated}`} fg={ocTheme.textMuted} />
            </box>
          )}
        </box>

        {/* Row 3: Topics (if any) */}
        {topics.length > 0 && (
          <box flexDirection="row">
            <text content={t`${bold('Topics:')} `} fg={ocTheme.textMuted} />
            <text content={t`${topics.slice(0, 5).join(', ')}${topics.length > 5 ? '...' : ''}`} fg={ocTheme.success} />
          </box>
        )}

        {/* Row 4: Repository URL (if GitHub) */}
        {githubData?.html_url && (
          <box flexDirection="row">
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