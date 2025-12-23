/**
 * OpencodeSchemaHelper bridges the opencode config schema with metadata-powered suggestions.
 * It delegates schema traversal and provider rendering to focused helpers.
 */

import { metadataService } from "../services/MetadataService.js";
import type { JsonSchema } from "./opencode-schema/opencode-schema-types.js";
import { getOpencodeSchema, getOpencodeSectionSchema } from "./opencode-schema/opencode-schema-source.js";
import { generateFromSchema } from "./opencode-schema/opencode-schema-templates.js";
import {
  buildProviderTemplateFromMetadata,
  renderProviderConfigWithSuggestions,
} from "./opencode-schema/opencode-provider-templates.js";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const getAdditionalSchema = (sectionSchema: JsonSchema | null): JsonSchema | null => {
  if (!sectionSchema?.additionalProperties) return null;
  if (typeof sectionSchema.additionalProperties === "object") {
    return sectionSchema.additionalProperties as JsonSchema;
  }
  return null;
};

export class OpencodeSchemaHelper {
  static getSuggestedKeys(section: string, existingKeys: string[]): string[] {
    if (section === "provider") {
      const providers = metadataService.getProviders();
      if (providers.length > 0) {
        return providers.filter((key) => !existingKeys.includes(key));
      }
    }

    const sectionSchema = getOpencodeSectionSchema(section);
    if (!sectionSchema?.properties) {
      return [];
    }

    const possibleKeys = Object.keys(sectionSchema.properties);
    return possibleKeys.filter((key) => !existingKeys.includes(key));
  }

  static getTemplate(section: string, key: string): Record<string, unknown> {
    const currentSchema = getOpencodeSchema();
    const sectionSchema = currentSchema.properties?.[section] ?? null;

    if (section === "provider") {
      const providerData = metadataService.getProviderDetails(key);
      if (providerData) {
        const additionalSchema = getAdditionalSchema(sectionSchema);
        const schemaTemplate = generateFromSchema(additionalSchema ?? {}) as unknown;
        const schemaTemplateObject = isRecord(schemaTemplate) ? schemaTemplate : {};
        return buildProviderTemplateFromMetadata(providerData, schemaTemplateObject);
      }
    }

    if (!sectionSchema) {
      return {};
    }

    if (sectionSchema.properties?.[key]) {
      const template = generateFromSchema(sectionSchema.properties[key]);
      return isRecord(template) ? template : {};
    }

    const additionalSchema = getAdditionalSchema(sectionSchema);
    if (additionalSchema) {
      const schemaNode =
        section === "mcp" && additionalSchema.anyOf?.[0]
          ? additionalSchema.anyOf[0]
          : additionalSchema;
      const template = generateFromSchema(schemaNode);
      return isRecord(template) ? template : {};
    }

    return {};
  }

  static generateWithSuggestions(data: unknown, section: string, key: string): string {
    if (section === "provider" && isRecord(data)) {
      const providerData = metadataService.getProviderDetails(key);
      if (providerData) {
        const rendered = renderProviderConfigWithSuggestions(data, providerData);
        if (rendered) return rendered;
      }
    }

    return JSON.stringify(data, null, 2);
  }
}
