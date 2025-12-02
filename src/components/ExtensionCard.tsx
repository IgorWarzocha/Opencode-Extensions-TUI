import { t, cyan, dim, bold } from '@opentui/core';
import { ocTheme } from '../theme';
import type { Extension } from '../types/extension';

interface ExtensionCardProps {
  extension: Extension;
  isSelected: boolean;
  availableWidth: number;
}

function ellipsize(text: string, max: number) {
  if (max <= 0) return '';
  if (text.length <= max) return text;
  if (max <= 1) return text.slice(0, max);
  return text.slice(0, max - 1) + '…';
}

export function ExtensionCard({ extension, isSelected, availableWidth }: ExtensionCardProps) {
  const borderColor = isSelected ? ocTheme.borderActive : ocTheme.border;
  const backgroundColor = isSelected ? ocTheme.element : ocTheme.panel;

  const formatCount = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const nameStyled = isSelected ? bold(cyan(extension.name)) : bold(extension.name);

  const infoRaw = `@${extension.author} • Stars ${extension.star_count} • Downloads ${formatCount(extension.download_count)} • v${extension.version}`;
  const badges: string[] = [];
  if (extension.featured) badges.push('Featured');
  if (extension.status === 'installed') badges.push('Installed');
  const infoWithBadges = badges.length ? `${infoRaw} • ${badges.join(' • ')}` : infoRaw;

  // Use a safer maxLine to prevent wrapping. availableWidth is the inner width of the container.
  // We subtract a safety buffer for ANSI codes or rendering quirks.
  const maxLine = Math.max(20, availableWidth - 4);
  
  // Determine layout mode based on available width
  let mode: 'wide' | 'medium' | 'narrow' = 'narrow';
  if (maxLine >= 100) mode = 'wide';
  else if (maxLine >= 50) mode = 'medium';

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
