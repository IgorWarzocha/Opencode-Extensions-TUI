import { useState, useEffect } from 'react';
import { useKeyboard } from '@opentui/react';
import type { Extension } from '../types/extension';
import { t, dim, yellow } from '@opentui/core';
import { ocTheme } from '../theme';
import { githubService } from '../services/github';
import { renderMarkdown } from '../utils/markdown';
import { 
  ExtensionHeader, 
  ExtensionDescription, 
  ExtensionMetadata, 
  GitHubInfo, 
  ExtensionAbout, 
  ExtensionInstallation, 
  ExtensionCuratorNotes 
} from './components/ExtensionInfo';

interface ExtensionDetailsProps {
  extension: Extension;
  onClose: () => void;
  isActive?: boolean;
}

export function ExtensionDetails({ extension, isActive = true }: ExtensionDetailsProps) {
  const [githubData, setGithubData] = useState(extension.githubData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readmeScrollOffset, setReadmeScrollOffset] = useState(0);
  const [renderedReadme, setRenderedReadme] = useState<string>('');

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

  useEffect(() => {
    if (githubData?.readme) {
      const rendered = renderMarkdown(githubData.readme);
      setRenderedReadme(rendered);
      setReadmeScrollOffset(0);
    }
  }, [githubData?.readme]);

  useKeyboard((key) => {
    if (!renderedReadme || !isActive) return;
    
    // Use original markdown for line counting since renderedReadme is now StyledText
    const readmeText = githubData?.readme || '';
    const lines = readmeText.split('\n');
    const maxScroll = Math.max(0, lines.length - 15);
    
    if (key.name === 'up') {
      setReadmeScrollOffset(prev => Math.max(0, prev - 1));
      return true; // Prevent event bubbling
    } else if (key.name === 'down') {
      setReadmeScrollOffset(prev => Math.min(maxScroll, prev + 1));
      return true; // Prevent event bubbling
    }
    return false;
  });

  return (
    <box 
      flexDirection="column" 
      borderStyle="double" 
      borderColor={ocTheme.borderActive}
      backgroundColor={ocTheme.element}
      padding={1}
      flexGrow={1}
    >
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

      {renderedReadme && (
        <box marginBottom={1} borderStyle="single" borderColor={ocTheme.border} padding={1} title="README">
          <text content={t`${renderedReadme.split('\n').slice(readmeScrollOffset).join('\n')}`} />
          {(githubData?.readme?.split('\n').length || 0) > readmeScrollOffset + 15 && (
            <text content={t`${dim('... (more content below, use ↑↓ to scroll)')}`} />
          )}
        </box>
      )}

      <ExtensionAbout extension={extension} />
      <ExtensionInstallation extension={extension} />
      <ExtensionCuratorNotes extension={extension} />
    </box>
  );
}
