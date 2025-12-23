/**
 * Modal dialog that previews install scripts and guides users through execution.
 * It supports scrolling, status feedback, and mouse-friendly actions for install flow.
 */

import { t, dim, bold, green, red, yellow, cyan } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useEffect, useState, useRef } from "react";
import type { Extension } from "../types/extension";
import { ocTheme } from "../theme";
import { useTerminalSize } from "../hooks/useTerminalSize";
import { extractScriptUrl, fetchScriptContent, isCurlPipeInstall } from "../utils/scriptParser";
import { ModalBackdrop } from "./ui/modal-backdrop";
import { ModalActionButton } from "./ui/modal-action-button";

interface ScriptModalProps {
  extension: Extension | null;
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<{ success: boolean; error?: string }>;
}

type LoadState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; content: string; url: string }
  | { status: 'error'; message: string }
  | { status: 'no-url'; command: string }
  | { status: 'installing' }
  | { status: 'install-success' }
  | { status: 'install-error'; message: string };

/**
 * Pads or truncates a line to exactly the specified width.
 * Ensures consistent width to prevent layout jumping.
 */
function fixedWidthLine(line: string, width: number): string {
  if (line.length >= width) {
    return line.slice(0, width);
  }
  return line + ' '.repeat(width - line.length);
}

/**
 * Generates a progress bar string.
 */
function progressBar(progress: number, width: number): string {
  const filled = Math.floor(progress * width);
  const empty = width - filled;
  return '[' + '='.repeat(filled) + ' '.repeat(empty) + ']';
}

export function ScriptModal({ extension, isVisible, onClose, onConfirm }: ScriptModalProps) {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'idle' });
  const [scrollOffset, setScrollOffset] = useState(0);
  const [installProgress, setInstallProgress] = useState(0);
  const fetchedRef = useRef<string | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { width: termWidth, height: termHeight } = useTerminalSize();

  // Calculate 50% dimensions
  const modalWidth = Math.floor(termWidth * 0.5);
  const modalHeight = Math.floor(termHeight * 0.5);
  const contentWidth = modalWidth - 4; // Account for borders and padding
  // Account for: outer border(2) + padding(2) + header(1) + marginTop(1) + footer(1) + marginTop(1) = 8 lines
  const visibleLineCount = Math.max(1, modalHeight - 8);

  // Cleanup progress interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible || !extension?.install_command) {
      setLoadState({ status: 'idle' });
      setScrollOffset(0);
      setInstallProgress(0);
      fetchedRef.current = null;
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    const command = extension.install_command;

    // Avoid refetching the same command
    if (fetchedRef.current === command) return;
    fetchedRef.current = command;

    // Check if it's a curl-pipe pattern we can preview
    if (!isCurlPipeInstall(command)) {
      setLoadState({ status: 'no-url', command });
      return;
    }

    const url = extractScriptUrl(command);
    if (!url) {
      setLoadState({ status: 'no-url', command });
      return;
    }

    setLoadState({ status: 'loading' });

    fetchScriptContent(url).then((result) => {
      if (result.success) {
        setLoadState({ status: 'success', content: result.content, url });
      } else {
        setLoadState({ status: 'error', message: result.error });
      }
    });
  }, [isVisible, extension?.install_command]);

  const handleInstall = async () => {
    if (loadState.status === 'installing') return;
    
    setLoadState({ status: 'installing' });
    setInstallProgress(0);

    // Animate progress bar (fake progress until completion)
    progressIntervalRef.current = setInterval(() => {
      setInstallProgress((prev) => {
        // Slow down as we approach 90%
        if (prev < 0.3) return prev + 0.05;
        if (prev < 0.6) return prev + 0.03;
        if (prev < 0.9) return prev + 0.01;
        return prev;
      });
    }, 100);

    try {
      const result = await onConfirm();
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      if (result.success) {
        setInstallProgress(1);
        setLoadState({ status: 'install-success' });
      } else {
        setLoadState({ status: 'install-error', message: result.error ?? 'Unknown error' });
      }
    } catch (err) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setLoadState({ 
        status: 'install-error', 
        message: err instanceof Error ? err.message : 'Installation failed' 
      });
    }
  };

  useKeyboard((key) => {
    if (!isVisible) return;

    // During installation, only allow Esc to close after completion
    if (loadState.status === 'installing') return;

    if (key.name === 'escape' || key.name === 'q') {
      onClose();
    } else if (key.name === 'return') {
      if (loadState.status === 'install-success' || loadState.status === 'install-error') {
        onClose();
      } else if (loadState.status === 'success' || loadState.status === 'no-url') {
        handleInstall();
      }
    } else if (key.name === 'down' || key.name === 'j') {
      setScrollOffset((prev) => prev + 1);
    } else if (key.name === 'up' || key.name === 'k') {
      setScrollOffset((prev) => Math.max(0, prev - 1));
    }
  });

  if (!isVisible || !extension) return null;

  const renderContent = () => {
    switch (loadState.status) {
      case 'idle':
      case 'loading':
        return (
          <box flexDirection="column" justifyContent="center" alignItems="center" height={visibleLineCount}>
            <text content={t`${dim('Loading script...')}`} />
          </box>
        );

      case 'error':
        return (
          <box flexDirection="column" height={visibleLineCount}>
            <text content={t`${red('Failed to fetch script:')}`} />
            <text content={t`${dim(loadState.message)}`} />
          </box>
        );

      case 'no-url':
        return (
          <box flexDirection="column" height={visibleLineCount}>
            <text content={t`${yellow('Preview not available')}`} />
            <text content={t`${dim(fixedWidthLine(loadState.command, contentWidth))}`} />
          </box>
        );

      case 'installing':
        return (
          <box flexDirection="column" justifyContent="center" alignItems="center" height={visibleLineCount}>
            <text content={t`${cyan('Installing...')}`} />
            <box marginTop={1}>
              <text content={t`${cyan(progressBar(installProgress, contentWidth - 4))}`} />
            </box>
            <box marginTop={1}>
              <text content={t`${dim(`${Math.floor(installProgress * 100)}%`)}`} />
            </box>
          </box>
        );

      case 'install-success':
        return (
          <box flexDirection="column" justifyContent="center" alignItems="center" height={visibleLineCount}>
            <text content={t`${green('Installation complete')}`} />
            <box marginTop={1}>
              <text content={t`${dim('Press Enter or Esc to close')}`} />
            </box>
          </box>
        );

      case 'install-error':
        return (
          <box flexDirection="column" justifyContent="center" alignItems="center" height={visibleLineCount}>
            <text content={t`${red('Installation failed')}`} />
            <box marginTop={1}>
              <text content={t`${dim(loadState.message)}`} />
            </box>
            <box marginTop={1}>
              <text content={t`${dim('Press Enter or Esc to close')}`} />
            </box>
          </box>
        );

      case 'success': {
        const lines = loadState.content.split('\n');
        // Account for border (2 lines) inside the script box
        const scriptBoxLines = Math.max(1, visibleLineCount - 2);
        const maxScroll = Math.max(0, lines.length - scriptBoxLines);
        const clampedOffset = Math.min(scrollOffset, maxScroll);
        const visibleLines = lines.slice(clampedOffset, clampedOffset + scriptBoxLines);

        return (
          <box flexDirection="column">
            <box
              borderStyle="single"
              borderColor={ocTheme.border}
              backgroundColor={ocTheme.panel}
              flexDirection="column"
              width={contentWidth}
              height={visibleLineCount}
              onMouseScroll={(event) => {
                const scroll = event.scroll;
                if (!scroll) return;
                const delta = Math.max(1, scroll.delta);
                setScrollOffset((prev) => {
                  if (scroll.direction === "up") {
                    return Math.max(0, prev - delta);
                  }
                  if (scroll.direction === "down") {
                    return Math.min(maxScroll, prev + delta);
                  }
                  return prev;
                });
              }}
            >
              {visibleLines.map((line, idx) => (
                <text key={clampedOffset + idx} content={t`${fixedWidthLine(line, contentWidth - 2)}`} />
              ))}
            </box>
          </box>
        );
      }
    }
  };

  const renderFooter = () => {
    if (loadState.status === "installing") {
      return <text content={t`${dim("Please wait...")}`} />;
    }

    if (loadState.status === "install-success" || loadState.status === "install-error") {
      return (
        <box>
          <ModalActionButton
            content={t`${green("Close")}`}
            onPress={onClose}
          />
        </box>
      );
    }

    const canInstall =
      loadState.status === "success" || loadState.status === "no-url";
    const showCancel = true;

    return (
      <box flexDirection="row" columnGap={1}>
        <ModalActionButton
          content={t`${green("Install")}`}
          borderColor={canInstall ? ocTheme.accent : ocTheme.border}
          isDisabled={!canInstall}
          onPress={handleInstall}
        />
        {showCancel ? (
          <ModalActionButton
            content={t`${red("Cancel")}`}
            onPress={onClose}
          />
        ) : null}
      </box>
    );
  };

  const title = fixedWidthLine(`Install Script: ${extension.name}`, contentWidth);
  const handleBackdropClose = () => {
    if (loadState.status === "installing") return;
    onClose();
  };

  return (
    <>
      <ModalBackdrop onClose={handleBackdropClose} zIndex={90} />
      <box
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          marginLeft: -Math.floor(modalWidth / 2),
          marginTop: -Math.floor(modalHeight / 2),
          width: modalWidth,
          height: modalHeight,
          zIndex: 100,
        }}
        backgroundColor={ocTheme.background}
        borderStyle="double"
        borderColor={ocTheme.accent}
        flexDirection="column"
        padding={1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <box flexShrink={0}>
          <text content={t`${bold(title)}`} />
        </box>

        {/* Content */}
        <box flexGrow={1} flexDirection="column" marginTop={1}>
          {renderContent()}
        </box>

        {/* Footer */}
        <box flexShrink={0} marginTop={1}>
          {renderFooter()}
        </box>
      </box>
    </>
  );
}
