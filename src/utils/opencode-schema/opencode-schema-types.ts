/**
 * Shared JSON schema types used for opencode config template generation.
 * The type remains flexible while keeping unknowns explicit.
 */

export type JsonSchema = {
  type?: string;
  properties?: Record<string, JsonSchema>;
  additionalProperties?: boolean | JsonSchema;
  items?: JsonSchema;
  anyOf?: JsonSchema[];
  default?: unknown;
  enum?: unknown[];
  [key: string]: unknown;
};
