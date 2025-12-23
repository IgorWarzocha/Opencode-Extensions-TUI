/**
 * Resolves the active opencode config schema by preferring metadata service data.
 * Falls back to the bundled schema when remote data is unavailable.
 */

import schema from "../../data/config-schema.json";
import { metadataService } from "../../services/MetadataService.js";
import type { JsonSchema } from "./opencode-schema-types.js";

const typedSchema = schema as unknown as JsonSchema;

export const getOpencodeSchema = (): JsonSchema => {
  const fetchedSchema = metadataService.getSchema() as JsonSchema | null;
  return fetchedSchema ?? typedSchema;
};

export const getOpencodeSectionSchema = (section: string): JsonSchema | null => {
  const currentSchema = getOpencodeSchema();
  return currentSchema.properties?.[section] ?? null;
};
