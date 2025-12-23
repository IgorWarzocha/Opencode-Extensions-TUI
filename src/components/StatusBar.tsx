/**
 * Status bar showing keyboard shortcuts based on current view.
 * Displays context-sensitive help for available keyboard actions.
 */

import { t, dim, bold } from "@opentui/core";
import { useEffect, useRef, useState } from "react";
import { ocTheme } from "../theme";
import type { KeybindMode, KeybindStatus } from "../keybinds/keybind-types.js";
import { getKeybindSet, getStatusHelp } from "../keybinds/keybinds.js";
import { ellipsize } from "../utils/text";

interface StatusBarProps {
  view?: "list" | "details" | "search" | "modal";
  keybindMode: KeybindMode;
  keybindStatus?: KeybindStatus;
  maxLine: number;
}

const renderInputHint = (status?: KeybindStatus): string => {
  if (!status) return "";
  const parts: string[] = [];
  if (status.leaderActive) parts.push("Leader");
  if (status.sequence.length > 0) parts.push(`Seq: ${status.sequence.join(" ")}`);
  if (status.count && status.count > 1) parts.push(`Count: ${status.count}`);
  if (parts.length === 0) return "";
  return `[${parts.join(" • ")}]`;
};

export function StatusBar({ view = "list", keybindMode, keybindStatus, maxLine }: StatusBarProps) {
  const keybinds = getKeybindSet(keybindMode);
  const baseText = getStatusHelp(view, keybinds);
  const leaderHint = keybinds.leader ? ` (Leader: ${keybinds.leader})` : "";
  const modeHint = `[Ctrl+g] Keybinds: ${keybinds.label}${leaderHint}`;
  const inputHint = renderInputHint(keybindStatus);
  const fixedWidth = 6 + 1 + 10 + 1;
  const availableText = Math.max(0, maxLine - fixedWidth);
  const trimmedText = ellipsize(`${baseText}  ${modeHint}`, availableText);
  const modeLabel = keybindMode === "nvim" ? "NVIM" : "OC";
  const modeText = ellipsize(modeLabel, 4);
  const hintText = ellipsize(inputHint || "[Idle]", 8);
  const modeColor = keybindMode === "nvim" ? ocTheme.secondary : ocTheme.primary;
  const isActive = !!(
    keybindStatus?.leaderActive ||
    (keybindStatus?.sequence.length ?? 0) > 0 ||
    (keybindStatus?.count ?? 0) > 0
  );

  const [blink, setBlink] = useState(false);
  const prevActiveRef = useRef(false);

  useEffect(() => {
    const wasActive = prevActiveRef.current;
    prevActiveRef.current = isActive;

    if (isActive && !wasActive) {
      setBlink(true);
      const timeout = setTimeout(() => setBlink(false), 180);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [isActive]);

  return (
    <box 
      flexDirection="row" 
      borderStyle="single" 
      borderColor={ocTheme.border} 
      backgroundColor={ocTheme.panel}
      height={3}
      paddingLeft={1}
      alignItems="center"
      width="100%"
      overflow="hidden"
    >
      <box
        width={6}
        marginRight={1}
        height={1}
        paddingLeft={1}
        paddingRight={1}
        backgroundColor={blink ? ocTheme.accent : modeColor}
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
      >
        <text fg={ocTheme.background} content={t`${bold(modeText)}`} />
      </box>
      <box
        width={10}
        marginRight={1}
        height={1}
        paddingLeft={1}
        paddingRight={1}
        backgroundColor={ocTheme.element}
        alignItems="center"
        flexShrink={0}
      >
        <text
          fg={inputHint ? ocTheme.accent : ocTheme.textMuted}
          content={t`${hintText}`}
        />
      </box>
      <box flexGrow={1} flexShrink={1} overflow="hidden">
        <text content={t`${dim(trimmedText)}`} />
      </box>
    </box>
  );
}
