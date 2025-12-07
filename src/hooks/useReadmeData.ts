/**
 * Hook for managing README data display for extensions.
 * Provides loading states and error handling for README content that's already embedded in extensions.
 */
import { useEffect, useState } from "react";
import type { AppError } from "../types/errors";
import type { Extension } from "../types/extension";

interface UseReadmeDataResult {
  readmeData: { readme?: string };
  isLoading: boolean;
  error: AppError | null;
  hasContent: boolean;
  reload: () => Promise<void>;
}

export function useReadmeData(extension: Extension): UseReadmeDataResult {
  const [readmeData, setReadmeData] = useState<{ readme?: string }>({ readme: extension.readme });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    setReadmeData({ readme: extension.readme });
  }, [extension.readme, extension.id]);

  const reload = async () => {
    // Nothing async to do now; keep signature for compatibility
    setReadmeData({ readme: extension.readme });
    return Promise.resolve();
  };

  return {
    readmeData,
    isLoading,
    error,
    hasContent: Boolean(extension.readme?.trim()),
    reload,
  };
}
