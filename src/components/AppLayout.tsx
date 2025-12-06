/**
 * App layout shell: renders sidebar, header area, main content panel, and footer.
 * Keeps structural layout consistent and separates layout from business logic.
 */

import type { ReactNode } from "react";
import { ocTheme } from "../theme";

interface AppLayoutProps {
  sidebar: ReactNode;
  header?: ReactNode;
  body: ReactNode;
  footer: ReactNode;
}

export function AppLayout({ sidebar, header, body, footer }: AppLayoutProps) {
  return (
    <box
      flexDirection="column"
      flexGrow={1}
      flexShrink={1}
      padding={1}
      minHeight={0}
      backgroundColor={ocTheme.background}
    >
      {sidebar}
      {header ? <box flexShrink={0} marginTop={1}>{header}</box> : null}
      <box
        flexDirection="column"
        flexGrow={1}
        flexShrink={1}
        marginTop={1}
        backgroundColor={ocTheme.panel}
        borderStyle="single"
        borderColor={ocTheme.border}
        padding={0}
        paddingLeft={1}
        paddingRight={1}
      >
        {body}
      </box>
      <box marginTop={1} flexShrink={0}>
        {footer}
      </box>
    </box>
  );
}
