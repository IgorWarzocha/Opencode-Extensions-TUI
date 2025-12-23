/**
 * Builds provider templates and suggestion-aware config outputs for opencode config.
 * Encapsulates provider-specific metadata rendering for schema helpers.
 */

import type { ModelMetadata, ProviderMetadata } from "../../services/metadata/metadata-types.js";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const buildProviderTemplateFromMetadata = (
  providerData: ProviderMetadata,
  schemaTemplate: Record<string, unknown>,
): Record<string, unknown> => {
  const template: Record<string, unknown> = {};

  if (providerData.name) template.name = providerData.name;
  if (providerData.api) template.api = providerData.api;

  if (providerData.models) {
    template.models = {};
    const modelKeys = Object.keys(providerData.models).slice(0, 5);
    for (const modelKey of modelKeys) {
      const model = providerData.models[modelKey];
      if (model) {
        (template.models as Record<string, unknown>)[modelKey] = {
          id: model.id,
        };
      }
    }
  }

  return { ...schemaTemplate, ...template };
};

const buildSuggestedModelConfig = (modelMeta: ModelMetadata): Record<string, unknown> => {
  const modelConfig: Record<string, unknown> = {
    id: modelMeta.id,
    name: modelMeta.name,
  };

  if (modelMeta.family) {
    modelConfig.family = modelMeta.family;
  }

  if (modelMeta.reasoning !== undefined) {
    modelConfig.reasoning = modelMeta.reasoning;
  }
  if (modelMeta.tool_call !== undefined) {
    modelConfig.tool_call = modelMeta.tool_call;
  }
  if (modelMeta.attachment !== undefined) {
    modelConfig.attachment = modelMeta.attachment;
  }
  if (modelMeta.temperature !== undefined) {
    modelConfig.temperature = modelMeta.temperature;
  }
  if (modelMeta.structured_output !== undefined) {
    modelConfig.structured_output = modelMeta.structured_output;
  }

  if (modelMeta.interleaved !== undefined) {
    modelConfig.interleaved = modelMeta.interleaved;
  }

  if (modelMeta.limit) {
    modelConfig.limit = {
      context: modelMeta.limit.context,
      output: modelMeta.limit.output,
    };
  }

  if (modelMeta.cost) {
    const costObj: Record<string, number> = {
      input: modelMeta.cost.input,
      output: modelMeta.cost.output,
    };
    if (modelMeta.cost.cache_read !== undefined) {
      costObj.cache_read = modelMeta.cost.cache_read;
    }
    if (modelMeta.cost.cache_write !== undefined) {
      costObj.cache_write = modelMeta.cost.cache_write;
    }
    if (modelMeta.cost.reasoning !== undefined) {
      costObj.reasoning = modelMeta.cost.reasoning;
    }
    modelConfig.cost = costObj;
  }

  if (modelMeta.modalities) {
    modelConfig.modalities = modelMeta.modalities;
  }

  return modelConfig;
};

export const renderProviderConfigWithSuggestions = (
  data: unknown,
  providerData: ProviderMetadata,
): string | null => {
  if (!isRecord(data)) return null;

  const dataObj = data;
  const modelsObj = isRecord(dataObj.models) ? dataObj.models : null;

  const existingModelIds = new Set(modelsObj ? Object.keys(modelsObj) : []);
  const suggestedModels: Record<string, unknown> = {};

  for (const [modelId, modelMeta] of Object.entries(providerData.models)) {
    if (!existingModelIds.has(modelId)) {
      suggestedModels[modelId] = buildSuggestedModelConfig(modelMeta);
    }
  }

  const otherProps: Record<string, unknown> = { ...dataObj };
  delete otherProps.models;

  let result = "";
  if (Object.keys(otherProps).length > 0) {
    const otherJson = JSON.stringify(otherProps, null, 2)
      .split("\n")
      .map((line) => "  " + line)
      .join("\n");
    result += otherJson + ",\n";
  }

  if (modelsObj && Object.keys(modelsObj).length > 0) {
    const userModelsJson = JSON.stringify(modelsObj, null, 2)
      .split("\n")
      .map((line) => "    " + line)
      .join("\n");
    result += '  "models": {\n' + userModelsJson;
  }

  if (Object.keys(suggestedModels).length > 0) {
    const suggestionsJson = JSON.stringify(suggestedModels, null, 2)
      .split("\n")
      .map((line) => "    // " + line)
      .join("\n");
    result += (modelsObj ? ",\n" : "") + suggestionsJson;
  }

  if (result.includes('"models"')) {
    result += "\n  }";
  }
  result += "\n}";

  return result;
};
