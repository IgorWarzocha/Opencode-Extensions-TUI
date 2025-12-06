/**
 * Hook to load README-derived metadata for an extension on demand.
 * Wraps loadReadmeData with loading/error state and exposes merged metadata for rendering.
 */
import { useCallback, useEffect, useState } from "react";
import { loadReadmeData } from "../data/loadReadmeData";
import type { AppError } from "../types/errors";
import type { Extension } from "../types/extension";

interface UseReadmeDataResult {
  readmeData: Partial<Extension>;
  isLoading: boolean;
  error: AppError | null;
  hasContent: boolean;
  reload: () => Promise<void>;
}

export function useReadmeData(extension: Extension): UseReadmeDataResult {
  const [readmeData, setReadmeData] = useState<Partial<Extension>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await loadReadmeData(
        extension.name,
        extension.repository_url,
        extension.display_name
      );
      setReadmeData(data);

      if (!data.long_description) {
        setError({
          kind: "not_found",
          source: "readme",
          message: "README not found",
          identifier: extension.name,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load README";
      setError({
        kind: "load_failed",
        source: "readme",
        message,
        cause: err,
      });
    } finally {
      setIsLoading(false);
    }
  }, [extension.display_name, extension.name, extension.repository_url]);

  useEffect(() => {
    setReadmeData({});
    setError(null);
  }, [extension.name]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    readmeData,
    isLoading,
    error,
    hasContent: Boolean(readmeData.long_description),
    reload: load,
  };
}
