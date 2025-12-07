/**
 * Hook for loading extension data from the SQLite database service.
 * Manages loading state, error handling, and provides a reload function for extensions.
 */
import { useCallback, useEffect, useState } from "react";
import { DatabaseService } from "../services/DatabaseService";
import type { Extension } from "../types/extension";
import type { AppError } from "../types/errors";

interface UseExtensionDataResult {
  extensions: Extension[];
  isLoading: boolean;
  error: AppError | null;
  reloadExtensions: () => Promise<Extension[]>;
}

export function useExtensionData(): UseExtensionDataResult {
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real async scenario (e.g. fetching DB from web), this would be awaited.
      // Local SQLite is synchronous, but we keep the signature async for future compat.
      const loaded = DatabaseService.getAllExtensions();
      setExtensions(loaded);
      return loaded;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load extensions";
      const nextError: AppError = { kind: "load_failed", message, source: "extensions" };
      setError(nextError);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { extensions, isLoading, error, reloadExtensions: load };
}
