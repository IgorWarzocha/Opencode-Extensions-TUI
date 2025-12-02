import type { Extension } from '../types/extension';
import { t, bold, cyan, green, dim } from '@opentui/core';
import { ocTheme } from '../theme';

interface ExtensionDetailsProps {
  extension: Extension;
}

export function ExtensionDetails({ extension }: ExtensionDetailsProps) {
  return (
    <box 
      flexDirection="column" 
      borderStyle="double" 
      borderColor={ocTheme.borderActive}
      backgroundColor={ocTheme.element}
      padding={1}
      flexGrow={1}
    >
      <box flexDirection="row" justifyContent="space-between" marginBottom={1}>
        <text content={t`${bold(cyan(extension.name))} v${extension.version || 'unknown'}`} />
        <text content={t`${dim(extension.source || '')}`} />
      </box>
      
      <text content={t`${extension.description || ''}\n`} />
      
      <box marginBottom={1} flexDirection="column" rowGap={0}>
        <text content={t`${bold('Author')} ${extension.author || 'Unknown'}`} />
        <text content={t`${bold('Downloads')} ${extension.download_count ?? 0}  ${bold('Stars')} ${extension.star_count ?? 0}`} />
        <text content={t`${bold('License')} ${extension.license || 'Unknown'}`} />
        <text content={t`${bold('Category')} ${extension.category || 'Uncategorized'}`} />
      </box>

      {extension.long_description && (
        <box marginBottom={1} flexDirection="column" rowGap={0}>
          <text content={t`${bold('About')}`} />
          <text content={t`${extension.long_description}`} />
        </box>
      )}

      <box borderStyle="single" borderColor={ocTheme.border} padding={1} title="Installation">
        <text content={t`${green(extension.install_command || 'No install command')}`} />
      </box>

      {extension.curator_notes && (
        <box marginTop={1} borderStyle="single" borderColor={ocTheme.border} padding={1} title="Curator Notes">
          <text content={t`${extension.curator_notes}`} />
        </box>
      )}
    </box>
  );
}
