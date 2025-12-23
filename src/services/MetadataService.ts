/**
 * MetadataService - Fetches live provider/model metadata from models.dev
 * and config schema from opencode.ai at app startup.
 *
 * Data is fetched once and cached for the session lifetime.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types matching models.dev API structure
// ─────────────────────────────────────────────────────────────────────────────

export type Modality = 'text' | 'image' | 'audio' | 'video' | 'pdf';

export type CostInfo = {
  input: number;
  output: number;
  cache_read?: number;
  cache_write?: number;
  reasoning?: number;
  input_audio?: number;
  output_audio?: number;
  context_over_200k?: CostInfo;
};

export type LimitInfo = {
  context: number;
  output: number;
};

export type ModalitiesInfo = {
  input: Modality[];
  output: Modality[];
};

export type InterleavedInfo = {
  field: 'reasoning_content' | 'reasoning_details';
} | boolean;

export type ModelMetadata = {
  id: string;
  name: string;
  family?: string;
  
  // Capability flags
  attachment?: boolean;
  reasoning?: boolean;
  tool_call?: boolean;
  temperature?: boolean;
  structured_output?: boolean;
  
  // Limits & costs
  limit?: LimitInfo;
  cost?: CostInfo;
  modalities?: ModalitiesInfo;
  
  // Reasoning support
  interleaved?: InterleavedInfo;
  
  // Metadata
  knowledge?: string;
  release_date?: string;
  last_updated?: string;
  open_weights?: boolean;
  status?: 'alpha' | 'beta' | 'deprecated' | 'active';
  experimental?: boolean;
  
  // Provider-specific options
  options?: Record<string, unknown>;
};

export type ProviderMetadata = {
  id: string;
  name: string;
  env?: string[];
  npm?: string;
  api?: string;
  doc?: string;
  models: Record<string, ModelMetadata>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Common inference parameters (not provider-specific, but model-configurable)
// ─────────────────────────────────────────────────────────────────────────────

export const COMMON_MODEL_OPTIONS = {
  temperature: { type: 'number', description: 'Sampling temperature (0-2)', default: 1 },
  top_p: { type: 'number', description: 'Nucleus sampling probability', default: 1 },
  top_k: { type: 'number', description: 'Top-k sampling', default: 40 },
  max_tokens: { type: 'number', description: 'Maximum tokens to generate' },
  frequency_penalty: { type: 'number', description: 'Frequency penalty (-2 to 2)', default: 0 },
  presence_penalty: { type: 'number', description: 'Presence penalty (-2 to 2)', default: 0 },
  stop: { type: 'array', description: 'Stop sequences', default: [] },
  seed: { type: 'number', description: 'Random seed for reproducibility' },
} as const;

export const COMMON_PROVIDER_OPTIONS = {
  baseURL: { type: 'string', description: 'Override API base URL' },
  apiKey: { type: 'string', description: 'Override API key' },
  timeout: { type: 'number', description: 'Request timeout in milliseconds', default: 30000 },
  headers: { type: 'object', description: 'Custom HTTP headers' },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

class MetadataService {
  private providers: Record<string, ProviderMetadata> = {};
  private schema: unknown = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the service by fetching remote data.
   * Safe to call multiple times - will only fetch once.
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;
    
    // Prevent concurrent initialization
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = this.doInit();
    return this.initPromise;
  }

  private async doInit(): Promise<void> {
    const [modelsResult, schemaResult] = await Promise.allSettled([
      fetch('https://models.dev/api.json').then(r => r.json()),
      fetch('https://opencode.ai/config.json').then(r => r.json()),
    ]);

    if (modelsResult.status === 'fulfilled') {
      this.providers = modelsResult.value as Record<string, ProviderMetadata>;
    } else {
      console.error('Failed to fetch models.dev data:', modelsResult.reason);
    }

    if (schemaResult.status === 'fulfilled') {
      this.schema = schemaResult.value;
    } else {
      console.error('Failed to fetch opencode schema:', schemaResult.reason);
    }

    this.isInitialized = true;
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

    const template: Record<string, unknown> = {};

    // Include models (first 3 as examples)
    const modelIds = Object.keys(provider.models).slice(0, 3);
    if (modelIds.length > 0) {
      const models: Record<string, unknown> = {};
      for (const modelId of modelIds) {
        const model = provider.models[modelId];
        if (model) {
          models[modelId] = this.getModelTemplate(model);
        }
      }
      template.models = models;
    }

    return template;
  }

  /** Generate a model config template from metadata */
  getModelTemplate(model: ModelMetadata): Record<string, unknown> {
    const template: Record<string, unknown> = {
      id: model.id,
      name: model.name,
    };

    // Add limits if available
    if (model.limit) {
      template.limit = { ...model.limit };
    }

    // Add cost if available
    if (model.cost) {
      template.cost = { ...model.cost };
    }

    // Add capability flags that are true
    const capabilities: Record<string, boolean> = {};
    if (model.tool_call) capabilities.tool_call = true;
    if (model.reasoning) capabilities.reasoning = true;
    if (model.temperature) capabilities.temperature = true;
    if (model.attachment) capabilities.attachment = true;
    if (Object.keys(capabilities).length > 0) {
      // Note: These are top-level in the model schema, not nested
      Object.assign(template, capabilities);
    }

    // Add modalities if non-default
    if (model.modalities) {
      template.modalities = { ...model.modalities };
    }

    return template;
  }

  /** Get suggested options for a model based on its capabilities */
  getModelOptions(model: ModelMetadata): Record<string, { type: string; description: string; default?: unknown }> {
    const options: Record<string, { type: string; description: string; default?: unknown }> = {};

    // Temperature only if model supports it
    if (model.temperature) {
      options.temperature = COMMON_MODEL_OPTIONS.temperature;
      options.top_p = COMMON_MODEL_OPTIONS.top_p;
    }

    // Always include max_tokens with model's limit as context
    options.max_tokens = {
      ...COMMON_MODEL_OPTIONS.max_tokens,
      default: model.limit?.output,
    };

    return options;
  }
}

export const metadataService = new MetadataService();
