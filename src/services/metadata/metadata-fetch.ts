/**
 * Fetches remote metadata resources and normalizes any errors.
 * The caller decides how to surface failures while keeping cached data coherent.
 */

import type {
  MetadataInitError,
  ProviderMetadata,
} from "./metadata-types.js";

const METADATA_ENDPOINTS = {
  models: "https://models.dev/api.json",
  schema: "https://opencode.ai/config.json",
} as const;

export type MetadataFetchResult = {
  providers: Record<string, ProviderMetadata>;
  schema: unknown;
  errors: MetadataInitError[];
};

const parseErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown metadata fetch error";
};

const fetchJson = async (url: string): Promise<unknown> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

const buildInitError = (source: MetadataInitError["source"], error: unknown): MetadataInitError => ({
  source,
  message: parseErrorMessage(error),
  cause: error,
});

export const fetchMetadataResources = async (): Promise<MetadataFetchResult> => {
  const [modelsResult, schemaResult] = await Promise.allSettled([
    fetchJson(METADATA_ENDPOINTS.models),
    fetchJson(METADATA_ENDPOINTS.schema),
  ]);

  const errors: MetadataInitError[] = [];
  let providers: Record<string, ProviderMetadata> = {};
  let schema: unknown = null;

  if (modelsResult.status === "fulfilled") {
    providers = modelsResult.value as Record<string, ProviderMetadata>;
  } else {
    errors.push(buildInitError("models", modelsResult.reason));
  }

  if (schemaResult.status === "fulfilled") {
    schema = schemaResult.value;
  } else {
    errors.push(buildInitError("schema", schemaResult.reason));
  }

  return { providers, schema, errors };
};
