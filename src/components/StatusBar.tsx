/**
 * Status bar showing keyboard shortcuts based on current view.
 * Displays context-sensitive help for available keyboard actions.
 */

import { t, dim } from '@opentui/core';
import { ocTheme } from '../theme';

interface StatusBarProps {
  view?: 'list' | 'details' | 'search' | 'modal';
}

export function StatusBar({ view = 'list' }: StatusBarProps) {
  return (
    <box 
      flexDirection="row" 
      borderStyle="single" 
      borderColor={ocTheme.border} 
      backgroundColor={ocTheme.panel}
      height={3}
      paddingLeft={1}
    >
      <text content={t`${dim(
        view === 'modal'
          ? '[Enter] Execute • [Escape/ Q] Cancel'
          : view === 'details' 
          ? '[Enter] Install  [i] Back to List  [q] Quit'
          : '[Up/Down] Navigate  [Enter] Install  [i] Details  [Tab] Category  [/] Search  [r] Refresh  [u] Uninstall  [Ctrl+e] Config  [q] Quit'
      )}`} />
    </box>
  );
}
