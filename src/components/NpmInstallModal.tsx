import { t, bold, dim, green, red, cyan } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useEffect, useMemo, useState } from "react";
import type { Extension } from "../types/extension";
import { ocTheme } from "../theme";
import { useTerminalSize } from "../hooks/useTerminalSize";

interface NpmInstallModalProps {
  extension: Extension | null;
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (selection: InstallSelection) => Promise<{ success: boolean; message?: string }>;
}

export interface InstallSelection {
  scope: "local" | "global";
  installPath: string;
}

type FocusField = "scope" | "confirm";
type InstallStatus = "idle" | "success" | "error";

export function NpmInstallModal({ extension, isVisible, onClose, onConfirm }: NpmInstallModalProps) {
  const { width: termWidth, height: termHeight } = useTerminalSize();
  const [scope, setScope] = useState<InstallSelection["scope"]>("local");
  const [focus, setFocus] = useState<FocusField>("scope");
  const [status, setStatus] = useState<InstallStatus>("idle");
  const [message, setMessage] = useState<string>("");

  const cwd = useMemo(() => process.cwd(), []);

  // 50% modal sizing
  const modalWidth = Math.floor(termWidth * 0.5);
  const modalHeight = Math.floor(termHeight * 0.4);
  const contentWidth = modalWidth - 4;

  useEffect(() => {
    if (!isVisible) {
      setScope("local");
      setFocus("scope");
      setStatus("idle");
      setMessage("");
    }
  }, [isVisible]);

  const handleConfirm = async () => {
    try {
      const result = await onConfirm({ scope, installPath: cwd });
      if (result.success) {
        setStatus("success");
        setMessage(result.message || "Plugin added to configuration");
      } else {
        setStatus("error");
        setMessage(result.message || "Failed to add plugin");
      }
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Unknown error");
    }
  };

  useKeyboard((key) => {
    if (!isVisible) return;

    if (key.name === "escape" || key.name === "q") {
      onClose();
      return;
    }

    if (status === "success" || status === "error") {
      if (key.name === "return" || key.name === "enter") {
        onClose();
      }
      return;
    }

    if (key.name === "tab") {
      setFocus((prev) => (prev === "scope" ? "confirm" : "scope"));
      return;
    }

    if (focus === "scope") {
      if (key.name === "left" || key.name === "h") setScope("local");
      if (key.name === "right" || key.name === "l") setScope("global");
    } else if (focus === "confirm") {
      if (key.name === "return" || key.name === "enter") {
        handleConfirm();
        return;
      }
    }

    if (key.name === "return" || key.name === "enter") {
      if (focus !== "confirm") {
        handleConfirm();
      }
    }
  });

  if (!isVisible || !extension) return null;

  const scopeLine = () => {
    const localLabel = scope === "local" ? bold("local") : dim("local");
    const globalLabel = scope === "global" ? bold("global") : dim("global");

    if (focus === "scope") {
      return (
        <text
          content={t`${cyan("[")} ${localLabel} ${cyan("|")} ${globalLabel} ${cyan("]")}`}
        />
      );
    }

    return <text content={t`${localLabel} | ${globalLabel}`} />;
  };

  const pathLine = () => {
    const pathLabel = scope === "local" ? cwd : "(global configuration)";
    // Truncate path if too long
    const displayPath = pathLabel.length > contentWidth - 14 
      ? "..." + pathLabel.slice(-(contentWidth - 17)) 
      : pathLabel;
    
    return <text content={t`${dim("Config path:")} ${displayPath}`} />;
  };

  const footerLine = () => {
    if (status === "success" || status === "error") {
      return <text content={t`${green("[Enter]")} Close`} />;
    }
    
    if (focus === "confirm") {
      return <text content={t`${green("[Enter]")} Install  ${red("[Esc]")} Cancel`} />;
    }
    return <text content={t`${dim("Tab to move • Enter to install • Esc to cancel")}`} />;
  };

  const renderContent = () => {
    if (status === "success") {
      return (
        <box flexDirection="column" justifyContent="center" alignItems="center" flexGrow={1}>
          <text content={t`${green("✔ Success")}`} />
          <box marginTop={1}>
            <text content={t`${message}`} />
          </box>
        </box>
      );
    }

    if (status === "error") {
      return (
        <box flexDirection="column" justifyContent="center" alignItems="center" flexGrow={1}>
          <text content={t`${red("✘ Error")}`} />
          <box marginTop={1}>
            <text content={t`${message}`} />
          </box>
        </box>
      );
    }

    return (
      <box flexDirection="column" flexGrow={1}>
        <box flexDirection="column" marginTop={1}>
          <text content={t`${dim("Scope:")}`} />
          {scopeLine()}
        </box>

        <box marginTop={1}>{pathLine()}</box>

        <box marginTop={2}>
          <text content={t`${dim("This will add the plugin to your opencode.json configuration.")}`} />
        </box>
      </box>
    );
  };

  return (
    <box
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        marginLeft: -Math.floor(modalWidth / 2),
        marginTop: -Math.floor(modalHeight / 2),
        width: modalWidth,
        height: modalHeight,
        zIndex: 120,
      }}
      backgroundColor={ocTheme.background}
      borderStyle="double"
      borderColor={status === "error" ? ocTheme.danger : (status === "success" ? ocTheme.success : ocTheme.accent)}
      flexDirection="column"
      padding={1}
    >
      <box flexShrink={0}>
        <text content={t`${bold(`Install ${extension.name}`)}`} />
      </box>

      {renderContent()}

      <box flexShrink={0} marginTop={1}>
        {footerLine()}
      </box>
    </box>
  );
}
