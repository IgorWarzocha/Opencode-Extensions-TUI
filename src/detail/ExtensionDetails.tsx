/**
 * Detailed extension view rendering metadata and README content.
 * Uses useReadmeData to lazily fetch README details and present loading/error states.
 */
import { useMemo, useRef } from "react";
import { MouseButton, t, yellow, type MouseEvent, type ScrollBoxRenderable } from "@opentui/core";
import { createSyntaxStyle } from "../theme/syntax";
import type { Extension } from "../types/extension";
import { useReadmeData } from "../hooks/useReadmeData";
import {
  ExtensionHeader,
  ExtensionDescription,
  ExtensionInstallation,
} from "./components/ExtensionInfo";

interface ExtensionDetailsProps {
  extension: Extension;
  onClose: () => void;
  isActive?: boolean;
  onOpenInstall?: (extension: Extension) => void | Promise<void>;
}

export function ExtensionDetails({
  extension,
  isActive = true,
  onOpenInstall,
}: ExtensionDetailsProps) {
  const isSkillsBundle = extension.install_method === "skills";
  const { readmeData, isLoading, error, hasContent } = useReadmeData(extension);
  const syntaxStyle = createSyntaxStyle();
  const scrollboxRef = useRef<ScrollBoxRenderable | null>(null);
  const lastInstallClickAt = useRef<number | null>(null);

  // For skills bundles, generate a simple readme from skills data
  const readmeContent = useMemo(() => {
    if (isSkillsBundle && extension.data?.length) {
      const skillsList = extension.data
        .map((s) => `- **${s.name}** (\`${s.pathName}\`)`)
        .join("\n");
      return `# ${extension.name}\n\n${extension.description}\n\n## Available Skills (${extension.data.length})\n\n${skillsList}`;
    }
    return readmeData.readme ?? "";
  }, [isSkillsBundle, extension, readmeData.readme]);

  const showReadme = isSkillsBundle ? true : hasContent && !isLoading && !error;

  return (
    <box flexDirection="column" flexGrow={1} flexShrink={1} padding={1}>
      <box flexDirection="column" flexShrink={0}>
        <ExtensionHeader extension={extension} />
        <ExtensionDescription extension={extension} />
        <box marginTop={1}>
          <ExtensionInstallation
            extension={extension}
            onMouseDown={(event: MouseEvent) => {
              if (!isActive) return;
              if (event.button !== MouseButton.LEFT) return;
              const now = Date.now();
              const lastClick = lastInstallClickAt.current;
              lastInstallClickAt.current = now;
              if (lastClick !== null && now - lastClick <= 350) {
                lastInstallClickAt.current = null;
                if (onOpenInstall) void onOpenInstall(extension);
              }
            }}
          />
        </box>

        {!isSkillsBundle && isLoading && (
          <box marginBottom={1}>
            <text content={t`${yellow("Loading README data...")}`} />
          </box>
        )}

        {!isSkillsBundle && error && (
          <box marginBottom={1}>
            <text content={t`${yellow(`Error: ${error.message}`)}`} />
          </box>
        )}
      </box>

      {showReadme ? (
        <scrollbox
          ref={(ref) => {
            scrollboxRef.current = ref;
          }}
          flexGrow={1}
          flexShrink={1}
          marginTop={1}
          marginBottom={1}
          focused={isActive}
          scrollY={true}
          scrollX={false}
        >
          <code
            filetype="markdown"
            content={readmeContent}
            conceal={true}
            drawUnstyledText={false}
            syntaxStyle={syntaxStyle}
          />
        </scrollbox>
      ) : (
        <scrollbox
          ref={(ref) => {
            scrollboxRef.current = ref;
          }}
          flexGrow={1}
          flexShrink={1}
          marginTop={1}
          marginBottom={1}
          focused={false}
          scrollY={true}
          scrollX={false}
        >
          {isLoading ? (
            <text content={t`Loading...`} />
          ) : error ? (
            <text content={t`${yellow(error.message)}`} />
          ) : (
            <text content={t`No README content`} />
          )}
        </scrollbox>
      )}
    </box>
  );
}
