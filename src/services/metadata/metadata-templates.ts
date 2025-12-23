/**
 * Template helpers for provider and model configuration scaffolds.
 * These helpers keep service logic focused on data access, not formatting.
 */

import type { ModelMetadata, ProviderMetadata } from "./metadata-types.js";
import { COMMON_MODEL_OPTIONS } from "./metadata-options.js";

export type ModelOptionDefinition = {
  type: string;
  description: string;
  default?: unknown;
};

export function buildProviderTemplate(provider: ProviderMetadata): Record<string, unknown> {
  const template: Record<string, unknown> = {};

  const modelIds = Object.keys(provider.models).slice(0, 3);
  if (modelIds.length > 0) {
    const models: Record<string, unknown> = {};
    for (const modelId of modelIds) {
      const model = provider.models[modelId];
      if (model) {
        models[modelId] = buildModelTemplate(model);
      }
    }
    template.models = models;
  }

  return template;
}

export function buildModelTemplate(model: ModelMetadata): Record<string, unknown> {
  const template: Record<string, unknown> = {
    id: model.id,
    name: model.name,
  };

  if (model.limit) {
    template.limit = { ...model.limit };
  }

  if (model.cost) {
    template.cost = { ...model.cost };
  }

  const capabilities: Record<string, boolean> = {};
  if (model.tool_call) capabilities.tool_call = true;
  if (model.reasoning) capabilities.reasoning = true;
  if (model.temperature) capabilities.temperature = true;
  if (model.attachment) capabilities.attachment = true;
  if (Object.keys(capabilities).length > 0) {
    Object.assign(template, capabilities);
  }

  if (model.modalities) {
    template.modalities = { ...model.modalities };
  }

  return template;
}

export function buildModelOptions(model: ModelMetadata): Record<string, ModelOptionDefinition> {
  const options: Record<string, ModelOptionDefinition> = {};

  if (model.temperature) {
    options.temperature = COMMON_MODEL_OPTIONS.temperature;
    options.top_p = COMMON_MODEL_OPTIONS.top_p;
  }

  options.max_tokens = {
    ...COMMON_MODEL_OPTIONS.max_tokens,
    default: model.limit?.output,
  };

  return options;
}
