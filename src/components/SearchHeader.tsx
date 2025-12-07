/**
 * Search input header with statistics display.
 * Shows search prompt, current query, and extension count information.
 */

import { t, dim } from '@opentui/core';
import { ocTheme } from '../theme';

interface SearchHeaderProps {
  searchQuery: string;
  totalCount: number;
  installedCount: number;
  isSearching: boolean;
}

export function SearchHeader({ searchQuery, totalCount, installedCount, isSearching }: SearchHeaderProps) {
  const prompt = isSearching ? 'Search' : 'Search (/ to focus)';
  const caret = isSearching ? '▌' : '';
  const queryContent = searchQuery ? searchQuery : dim('type to filter');
  const searchContent = t`${prompt}: ${queryContent}${caret}`;
  const statsContent = t`${dim(`Available ${totalCount} | Installed ${installedCount}`)}`;
  const border = isSearching ? ocTheme.borderActive : ocTheme.border;

  return (
    <box 
      flexDirection="row" 
      borderStyle="single" 
      borderColor={border}
      backgroundColor={ocTheme.menu}
      justifyContent="space-between"
      padding={0}
      paddingLeft={1}
      paddingRight={1}
      height={3}
      alignItems="center"
    >
      <text content={searchContent} />
      <text content={statsContent} />
    </box>
  );
}
