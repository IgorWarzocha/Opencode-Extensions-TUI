/**
 * Data loading hook for extension metadata sourced from bundled JSON files.
 * Handles initial load, reloads, and propagates loading/error state for the list view.
 * Keeps the hook focused on data acquisition so downstream hooks manage UI state.
 */
import { useCallback, useEffect, useState } from "react";
import { loadExtensions } from "../data/loadExtensions";
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
      const loaded = await loadExtensions();
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
