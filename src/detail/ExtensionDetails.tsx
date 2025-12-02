import { useState, useEffect, useRef } from 'react';
import type { Extension } from '../types/extension';
import { t, dim, yellow, type ScrollBoxRenderable } from '@opentui/core';
import { ocTheme } from '../theme';
import { githubService } from '../services/github';
import {
  ExtensionHeader,
  ExtensionDescription,
  ExtensionMetadata,
  GitHubInfo,
  ExtensionAbout,
  ExtensionInstallation,
  ExtensionCuratorNotes
} from './components/ExtensionInfo';
import { createSyntaxStyle } from '../theme/syntax';

interface ExtensionDetailsProps {
  extension: Extension;
  onClose: () => void;
  isActive?: boolean;
}

export function ExtensionDetails({ extension, isActive = true }: ExtensionDetailsProps) {
  const [githubData, setGithubData] = useState(extension.githubData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const syntaxStyle = createSyntaxStyle();
  const scrollboxRef = useRef<ScrollBoxRenderable | null>(null);

  useEffect(() => {
    const fetchGitHubData = async () => {
      if (extension.source !== 'github' || !extension.repository_url || githubData) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await githubService.getRepoDetails(extension.repository_url);
        if (data) {
          setGithubData(data);
          await githubService.saveRepoDetails(data);
        } else {
          setError('Failed to fetch repository data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGitHubData();
  }, [extension.repository_url, extension.source, githubData]);

  return (
    <box
      flexDirection="column"
      borderStyle="double"
      borderColor={ocTheme.borderActive}
      backgroundColor={ocTheme.element}
      padding={1}
      flexGrow={1}
    >
      {/* Sticky header section */}
      <box flexDirection="column" flexShrink={0}>
        <ExtensionHeader extension={extension} />
        <ExtensionDescription extension={extension} />
        <ExtensionMetadata extension={extension} githubData={githubData} />

        {isLoading && (
          <box marginBottom={1} borderStyle="single" borderColor={ocTheme.border} padding={1}>
            <text content={t`${yellow('Loading GitHub data...')}`} />
          </box>
        )}

        {error && (
          <box marginBottom={1} borderStyle="single" borderColor={ocTheme.border} padding={1}>
            <text content={t`${yellow(`Error: ${error}`)}`} />
          </box>
        )}

        <GitHubInfo githubData={githubData} />
      </box>

      {/* Scrollable README section */}
      {githubData?.readme && (
        <scrollbox
          ref={(ref) => { scrollboxRef.current = ref; }}
          flexGrow={1}
          marginTop={1}
          marginBottom={1}
          borderStyle="single"
          borderColor={ocTheme.border}
          padding={1}
          focused={isActive}
          scrollY={true}
          scrollX={false}
        >
          <box flexDirection="column">
            <text content={t`${dim('README')}`} />
            <code
              filetype="markdown"
              content={githubData.readme}
              conceal={true}
              drawUnstyledText={false}
              syntaxStyle={syntaxStyle}
            />
          </box>
        </scrollbox>
      )}

      {/* Footer sections - also sticky */}
      <box flexDirection="column" flexShrink={0}>
        <ExtensionAbout extension={extension} />
        <ExtensionInstallation extension={extension} />
        <ExtensionCuratorNotes extension={extension} />
      </box>
    </box>
  );
}
