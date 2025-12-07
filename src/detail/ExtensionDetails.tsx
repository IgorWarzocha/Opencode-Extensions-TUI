/**
 * Detailed extension view rendering metadata and README content.
 * Uses useReadmeData to lazily fetch README details and present loading/error states.
 */
import { useMemo, useRef } from "react";
import { t, yellow, type ScrollBoxRenderable } from "@opentui/core";
import { createSyntaxStyle } from "../theme/syntax";
import type { Extension } from "../types/extension";
import { useReadmeData } from "../hooks/useReadmeData";
import {
  ExtensionHeader,
  ExtensionDescription,
  ExtensionInstallation,
  // removed ExtensionCuratorNotes per request
} from "./components/ExtensionInfo";

interface ExtensionDetailsProps {
  extension: Extension;
  onClose: () => void;
  isActive?: boolean;
}

export function ExtensionDetails({ extension, isActive = true }: ExtensionDetailsProps) {
  const { readmeData, isLoading, error, hasContent } = useReadmeData(extension);
  const syntaxStyle = createSyntaxStyle();
  const scrollboxRef = useRef<ScrollBoxRenderable | null>(null);

  const readmeContent = readmeData.readme ?? "";

  return (
    <box flexDirection="column" flexGrow={1} flexShrink={1} padding={1}>
      <box flexDirection="column" flexShrink={0}>
        <ExtensionHeader extension={extension} />
        <ExtensionDescription extension={extension} />
        <box marginTop={1}>
          <ExtensionInstallation extension={extension} />
        </box>

        {isLoading && (
          <box marginBottom={1}>
            <text content={t`${yellow("Loading README data...")}`} />
          </box>
        )}

        {error && (
          <box marginBottom={1}>
            <text content={t`${yellow(`Error: ${error.message}`)}`} />
          </box>
        )}
      </box>

      {hasContent && !isLoading && !error ? (
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
