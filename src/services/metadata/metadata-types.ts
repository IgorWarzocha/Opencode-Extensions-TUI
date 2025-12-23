/**
 * Shared type definitions for metadata providers, models, and initialization status.
 * These types mirror the remote metadata payload and keep service APIs consistent.
 */

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

export type InterleavedInfo =
  | {
      field: 'reasoning_content' | 'reasoning_details';
    }
  | boolean;

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

export type MetadataInitError = {
  source: 'models' | 'schema';
  message: string;
  cause: unknown;
};

export type MetadataInitResult = {
  ok: boolean;
  errors: MetadataInitError[];
};
