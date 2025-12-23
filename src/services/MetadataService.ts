/**
 * MetadataService fetches provider/model metadata and config schema at startup.
 * It caches results for the session and exposes helpers to query models and templates.
 */

import type { MetadataInitResult, ModelMetadata, ProviderMetadata } from "./metadata/metadata-types.js";
import { fetchMetadataResources } from "./metadata/metadata-fetch.js";
import { buildModelOptions, buildModelTemplate, buildProviderTemplate } from "./metadata/metadata-templates.js";
import { COMMON_MODEL_OPTIONS, COMMON_PROVIDER_OPTIONS } from "./metadata/metadata-options.js";

class MetadataService {
  private providers: Record<string, ProviderMetadata> = {};
  private schema: unknown = null;
  private isInitialized = false;
  private initPromise: Promise<MetadataInitResult> | null = null;
  private initResult: MetadataInitResult | null = null;

  /**
   * Initialize the service by fetching remote data.
   * Safe to call multiple times - will only fetch once.
   */
  async init(): Promise<MetadataInitResult> {
    if (this.initResult) return this.initResult;

    if (this.initPromise) return this.initPromise;

    this.initPromise = this.doInit();
    return this.initPromise;
  }

  private async doInit(): Promise<MetadataInitResult> {
    const { providers, schema, errors } = await fetchMetadataResources();

    this.providers = providers;
    this.schema = schema;
    this.isInitialized = true;

    const result: MetadataInitResult = {
      ok: errors.length === 0,
      errors,
    };

    this.initResult = result;
    return result;
  }

  /**
   * Get the initialization status and any errors captured during init.
   */
  getInitStatus(): MetadataInitResult | null {
    return this.initResult;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Provider queries
  // ─────────────────────────────────────────────────────────────────────────

  /** Get all provider IDs */
  getProviders(): string[] {
    return Object.keys(this.providers);
  }

  /** Get full provider metadata */
  getProviderDetails(providerId: string): ProviderMetadata | undefined {
    return this.providers[providerId];
  }

  /** Get all providers with full metadata */
  getAllProviders(): Record<string, ProviderMetadata> {
    return this.providers;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Model queries
  // ─────────────────────────────────────────────────────────────────────────

  /** Get all model IDs for a provider */
  getModelIds(providerId: string): string[] {
    return Object.keys(this.providers[providerId]?.models ?? {});
  }

  /** Get model metadata */
  getModel(providerId: string, modelId: string): ModelMetadata | undefined {
    return this.providers[providerId]?.models[modelId];
  }

  /** Get all models for a provider */
  getModels(providerId: string): Record<string, ModelMetadata> {
    return this.providers[providerId]?.models ?? {};
  }

  /** Search models across all providers */
  searchModels(query: string): Array<{ provider: string; model: ModelMetadata }> {
    const results: Array<{ provider: string; model: ModelMetadata }> = [];
    const lowerQuery = query.toLowerCase();

    for (const [providerId, provider] of Object.entries(this.providers)) {
      for (const model of Object.values(provider.models)) {
        if (
          model.id.toLowerCase().includes(lowerQuery) ||
          model.name.toLowerCase().includes(lowerQuery) ||
          model.family?.toLowerCase().includes(lowerQuery)
        ) {
          results.push({ provider: providerId, model });
        }
      }
    }

    return results;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Schema access
  // ─────────────────────────────────────────────────────────────────────────

  /** Get the opencode.json config schema */
  getSchema(): unknown {
    return this.schema;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Template generation helpers
  // ─────────────────────────────────────────────────────────────────────────

  /** Generate a provider config template */
  getProviderTemplate(providerId: string): Record<string, unknown> | null {
    const provider = this.providers[providerId];
    if (!provider) return null;

    return buildProviderTemplate(provider);
  }

  /** Generate a model config template from metadata */
  getModelTemplate(model: ModelMetadata): Record<string, unknown> {
    return buildModelTemplate(model);
  }

  /** Get suggested options for a model based on its capabilities */
  getModelOptions(model: ModelMetadata): Record<string, { type: string; description: string; default?: unknown }> {
    return buildModelOptions(model);
  }

  /** Expose shared model options for reuse in config editors */
  getCommonModelOptions(): typeof COMMON_MODEL_OPTIONS {
    return COMMON_MODEL_OPTIONS;
  }

  /** Expose shared provider options for reuse in config editors */
  getCommonProviderOptions(): typeof COMMON_PROVIDER_OPTIONS {
    return COMMON_PROVIDER_OPTIONS;
  }

  /** Check if metadata has been initialized. */
  isReady(): boolean {
    return this.isInitialized;
  }
}

export const metadataService = new MetadataService();
export { COMMON_MODEL_OPTIONS, COMMON_PROVIDER_OPTIONS };
export type { MetadataInitResult, ModelMetadata, ProviderMetadata };
