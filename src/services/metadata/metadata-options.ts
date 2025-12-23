/**
 * Shared option definitions for providers and models.
 * These constants are reused across template helpers and UI components.
 */

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
