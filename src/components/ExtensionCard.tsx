/**
 * Individual extension card component with responsive layout modes.
 * Adapts display format (wide/medium/narrow) based on available terminal width.
 */

import { t, cyan, dim, bold } from '@opentui/core';
import { ocTheme } from '../theme';
import type { Extension } from '../types/extension';
import { ellipsize, formatCount } from '../utils/text';
import type { ViewMode } from '../utils/layout';

interface ExtensionCardProps {
  extension: Extension;
  isSelected: boolean;
  mode: ViewMode;
  maxLine: number;
}

export function ExtensionCard({ extension, isSelected, mode, maxLine }: ExtensionCardProps) {
  const borderColor = isSelected ? ocTheme.borderActive : ocTheme.border;
  const backgroundColor = isSelected ? ocTheme.element : ocTheme.panel;

  const nameStyled = isSelected ? bold(cyan(extension.name)) : bold(extension.name);

  const infoRaw = `@${extension.author}`;
  const badges: string[] = [];
  if (extension.status === 'installed') badges.push('Installed');
  const infoWithBadges = badges.length ? `${infoRaw} • ${badges.join(' • ')}` : infoRaw;

  // Explicit height to prevent layout shifts/scrolling bugs
  // Wide: 1 line + 2 border = 3
  // Medium: 2 lines + 2 border = 4
  // Narrow: 3 lines + 2 border = 5
  const height = mode === 'wide' ? 3 : mode === 'medium' ? 4 : 5;

  // Wide Mode: 1 Line
  // [Name] - [Description...] [Info]
  if (mode === 'wide') {
    const spacer1 = ' - ';
    const spacer2 = '  ';
    
    const nameLen = extension.name.length;
    const baseOverhead = nameLen + spacer1.length + spacer2.length;
    const availableForContent = Math.max(0, maxLine - baseOverhead);
    
    // Strategy: Try to show full Info. Give remaining to Description.
    // If Info is too long, truncate Info too.
    const infoLen = infoWithBadges.length;
    let finalInfoLen = infoLen;
    let finalDescLen = 0;

    if (availableForContent >= infoLen + 5) {
      // Enough space for full Info + some Description
      finalInfoLen = infoLen;
      finalDescLen = availableForContent - infoLen;
    } else {
      // Not enough space. Prioritize Info but truncate it to fit.
      finalDescLen = 0;
      finalInfoLen = availableForContent;
    }

    const description = finalDescLen > 0 ? ellipsize(extension.description || '', finalDescLen) : '';
    const infoTrimmed = ellipsize(infoWithBadges, finalInfoLen);

    return (
      <box
        flexDirection="row"
        borderStyle="single"
        borderColor={borderColor}
        backgroundColor={backgroundColor}
        padding={0}
        marginBottom={0}
        rowGap={0}
        width="100%"
        height={height}
      >
        <text content={t`${nameStyled}${dim(spacer1)}${description}${spacer2}${dim(infoTrimmed)}`} />
      </box>
    );
  }

  // Medium Mode: 2 Lines
  // Line 1: [Name] [Info] (space-between)
  // Line 2: [Description]
  if (mode === 'medium') {
    // Line 1: Name + Info
    // We need to be careful about wrapping.
    // Strategy: Name takes priority. Info is truncated if needed.
    // Actually, let's try to put them on the same line with space between?
    // Or just `Name  Info`
    const spacer = '  ';
    const availableForInfo = Math.max(10, maxLine - extension.name.length - spacer.length);
    const infoTrimmed = ellipsize(infoWithBadges, availableForInfo);
    
    const description = ellipsize(extension.description || '', maxLine);

    return (
      <box
        flexDirection="column"
        borderStyle="single"
        borderColor={borderColor}
        backgroundColor={backgroundColor}
        padding={0}
        marginBottom={0}
        rowGap={0}
        width="100%"
        height={height}
      >
        <text content={t`${nameStyled}${spacer}${dim(infoTrimmed)}`} />
        <text content={t`${description}`} />
      </box>
    );
  }

  // Narrow Mode: 3 Lines (Stacked)
  // Line 1: [Name]
  // Line 2: [Info]
  // Line 3: [Description]
  const description = ellipsize(extension.description || '', maxLine);
  const infoTrimmed = ellipsize(infoWithBadges, maxLine);

  return (
    <box
      flexDirection="column"
      borderStyle="single"
      borderColor={borderColor}
      backgroundColor={backgroundColor}
      padding={0}
      marginBottom={0}
      rowGap={0}
      width="100%"
      height={height}
    >
      <text content={t`${nameStyled}`} />
      <text content={t`${dim(infoTrimmed)}`} />
      <text content={t`${description}`} />
    </box>
  );
}
