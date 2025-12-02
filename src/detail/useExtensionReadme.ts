import { useEffect, useState } from 'react';
import type { Extension } from '../types/extension';
import type { GitHubRepo } from '../services/github';
import { githubService } from '../services/github';

interface UseExtensionReadmeResult {
  githubData: GitHubRepo | null;
  isLoading: boolean;
  error: string | null;
  renderedReadme: string;
}

export function useExtensionReadme(extension: Extension): UseExtensionReadmeResult {
  const [githubData, setGithubData] = useState<GitHubRepo | null>(extension.githubData ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderedReadme, setRenderedReadme] = useState('');

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
      setRenderedReadme(githubData.readme);
    } else {
      setRenderedReadme('');
    }
  }, [githubData?.readme]);

  return { githubData, isLoading, error, renderedReadme };
}
