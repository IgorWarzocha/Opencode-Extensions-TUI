import { t, dim } from '@opentui/core';
import { ocTheme } from '../theme';

export function StatusBar() {
  return (
    <box 
      flexDirection="row" 
      borderStyle="single" 
      borderColor={ocTheme.border} 
      backgroundColor={ocTheme.panel}
      height={3}
      paddingLeft={1}
    >
      <text content={t`${dim('[Up/Down] Navigate  [Enter] Install  [i] Details  [Tab] Category  [/] Search  [r] Refresh  [u] Uninstall  [q] Quit')}`} />
    </box>
  );
}
