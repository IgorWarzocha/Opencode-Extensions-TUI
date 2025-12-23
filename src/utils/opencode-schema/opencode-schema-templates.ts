/**
 * Generates opencode config templates based on JSON schema nodes.
 * The helpers return plain data objects with sensible defaults.
 */

import type { JsonSchema } from "./opencode-schema-types.js";

export const generateFromSchema = (node: JsonSchema): unknown => {
  if (!node) return {};

  if (node.anyOf && node.anyOf.length > 0) {
    return generateFromSchema(node.anyOf[0] ?? {});
  }

  if (node.type === "object") {
    const obj: Record<string, unknown> = {};
    if (node.properties) {
      for (const [propName, propSchema] of Object.entries(node.properties)) {
        obj[propName] = generateFromSchema(propSchema);
      }
    }
    return obj;
  }

  if (node.type === "string") {
    if (node.default !== undefined) return node.default;
    if (node.enum && node.enum.length > 0) return node.enum[0];
    return "";
  }

  if (node.type === "number" || node.type === "integer") {
    if (node.default !== undefined) return node.default;
    return 0;
  }

  if (node.type === "boolean") {
    if (node.default !== undefined) return node.default;
    return false;
  }

  if (node.type === "array") {
    return [];
  }

  return null;
};
