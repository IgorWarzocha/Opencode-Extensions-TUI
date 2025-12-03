import { useState, useEffect, useRef } from 'react';
import type { Extension } from '../types/extension';
import { t, yellow, type ScrollBoxRenderable } from '@opentui/core';
import { loadReadmeData } from '../data/loadReadmeData';
import { createSyntaxStyle } from '../theme/syntax';
import {
  ExtensionHeader,
  ExtensionDescription,
  ExtensionInstallation,
  // removed ExtensionCuratorNotes per request
} from './components/ExtensionInfo';


interface ExtensionDetailsProps {
  extension: Extension;
  onClose: () => void;
  isActive?: boolean;
}

export function ExtensionDetails({ extension, isActive = true }: ExtensionDetailsProps) {
  const [readmeData, setReadmeData] = useState<Partial<Extension>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTried, setHasTried] = useState(false);
  const syntaxStyle = createSyntaxStyle();
  const scrollboxRef = useRef<ScrollBoxRenderable | null>(null);

  useEffect(() => {
    // Reset when switching items
    setReadmeData({});
    setError(null);
    setIsLoading(false);
    setHasTried(false);
  }, [extension.name]);

  useEffect(() => {
    const loadReadme = async () => {
      if (hasTried || readmeData.long_description) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await loadReadmeData(
          extension.name,
          extension.repository_url,
          extension.display_name
        );
        if (data && Object.keys(data).length > 0) {
          setReadmeData(data);
        } else {
          setError('README not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
        setHasTried(true);
      }
    };

    loadReadme();
  }, [extension.name, extension.repository_url, extension.display_name, readmeData.long_description, hasTried]);

  const merged = { ...extension, ...readmeData } as Extension;
  const readmeContent = readmeData.long_description || '';

  return (
    <box flexDirection="column" flexGrow={1} flexShrink={1} padding={1}>
      <box flexDirection="column" flexShrink={0}>
        <ExtensionHeader extension={merged} />
        <ExtensionDescription extension={merged} />
        <box marginTop={1}>
          <ExtensionInstallation extension={merged} />
        </box>

        {isLoading && (
          <box marginBottom={1}>
            <text content={t`${yellow('Loading README data...')}`} />
          </box>
        )}

        {error && (
          <box marginBottom={1}>
            <text content={t`${yellow(`Error: ${error}`)}`} />
          </box>
        )}
      </box>

      {(readmeContent && !isLoading && !error) ? (
        <scrollbox
          ref={(ref) => { scrollboxRef.current = ref; }}
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
          ref={(ref) => { scrollboxRef.current = ref; }}
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
            <text content={t`${yellow(error)}`} />
          ) : (
            <text content={t`No README content`} />
          )}
        </scrollbox>
      )}
    </box>
  );
}


