import { metadataService } from "../services/MetadataService";
import schema from "../data/config-schema.json";

type JsonSchema = {
  type?: string;
  properties?: Record<string, JsonSchema>;
  additionalProperties?: boolean | JsonSchema;
  items?: JsonSchema;
  anyOf?: JsonSchema[];
  default?: any;
  enum?: any[];
  [key: string]: any;
};

// Cast to unknown first to bypass deep incompatibility check
const typedSchema = schema as unknown as JsonSchema;

export class SchemaHelper {
  static getSuggestedKeys(section: string, existingKeys: string[]): string[] {
    // 1. Try to fetch from MetadataService first for providers
    if (section === "provider") {
      const providers = metadataService.getProviders();
      if (providers.length > 0) {
        return providers.filter((k) => !existingKeys.includes(k));
      }
    }

    // 2. Fallback to Schema
    const fetchedSchema = metadataService.getSchema() as JsonSchema | null;
    const currentSchema = fetchedSchema || typedSchema;

    if (!currentSchema.properties || !currentSchema.properties[section]) {
      return [];
    }

    const sectionSchema = currentSchema.properties[section];
    if (!sectionSchema.properties) {
      return [];
    }

    const possibleKeys = Object.keys(sectionSchema.properties);
    return possibleKeys.filter((k) => !existingKeys.includes(k));
  }

  static getTemplate(section: string, key: string): any {
    const fetchedSchema = metadataService.getSchema() as JsonSchema | null;
    const currentSchema = fetchedSchema || typedSchema;

    // 1. Special handling for providers from MetadataService
    if (section === "provider") {
      const providerData = metadataService.getProviderDetails(key);
      if (providerData) {
        // Generate a template based on the provider data
        const template: any = {};

        // Name
        if (providerData.name) template.name = providerData.name;

        // API
        if (providerData.api) template.api = providerData.api;

        // Env vars (as placeholders or empty strings if we don't want to leak secrets in code, but user will fill them)
        // Actually, we can check if they are in 'env' array
        if (providerData.env && providerData.env.length > 0) {
          // We might want to put them in 'options' or at root depending on schema?
          // The provider config schema usually has 'options' or specific fields.
          // Let's assume standard provider structure.
          // If it's a standard AI SDK provider, env vars are usually handled by the environment, not config.
          // BUT, if we want to set them explicitly in 'options' or 'headers'?
          // For now, let's just stick to 'models' which is the most useful part.
        }

        // Models
        if (providerData.models) {
          template.models = {};
          // Pre-populate with a few examples? Or just empty?
          // Maybe pick the top 3-5?
          const modelKeys = Object.keys(providerData.models).slice(0, 5);
          for (const modelKey of modelKeys) {
            const model = providerData.models[modelKey];
            // We need to check if 'model' is undefined before accessing properties
            if (model) {
              template.models[modelKey] = {
                id: model.id,
                // Optional: name, context window, etc.
                // name: model.name
              };
            }
          }
        }

        // Merge with default schema template to ensure we have standard fields
        const schemaTemplate = this.generateFromSchema(
          (currentSchema.properties?.[section]
            ?.additionalProperties as JsonSchema) || {},
        );

        return { ...schemaTemplate, ...template };
      }
    }

    if (!currentSchema.properties || !currentSchema.properties[section]) {
      return {};
    }

    const sectionSchema = currentSchema.properties[section];

    // 2. Check if key is explicitly defined in properties
    if (sectionSchema.properties && sectionSchema.properties[key]) {
      return this.generateFromSchema(sectionSchema.properties[key]);
    }

    // 3. Check additionalProperties
    if (
      sectionSchema.additionalProperties &&
      typeof sectionSchema.additionalProperties === "object"
    ) {
      return this.generateFromSchema(sectionSchema.additionalProperties);
    }

    // 4. Special case for "mcp" which uses anyOf in additionalProperties
    if (
      section === "mcp" &&
      sectionSchema.additionalProperties &&
      (sectionSchema.additionalProperties as any).anyOf
    ) {
      const option = (sectionSchema.additionalProperties as any).anyOf[0];
      return this.generateFromSchema(option);
    }

    return {};
  }

  private static generateFromSchema(node: JsonSchema): any {
    if (!node) return {};

    if (node.anyOf && node.anyOf.length > 0) {
      return this.generateFromSchema(node.anyOf[0]!);
    }

    if (node.type === "object") {
      const obj: any = {};
      if (node.properties) {
        for (const [propName, propSchema] of Object.entries(node.properties)) {
          obj[propName] = this.generateFromSchema(propSchema);
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
  }

  static generateWithSuggestions(
    data: unknown,
    section: string,
    key: string,
  ): string {
    const fetchedSchema = metadataService.getSchema() as JsonSchema | null;
    const currentSchema = fetchedSchema || typedSchema;

    let targetSchema: JsonSchema | undefined;
    const sectionSchema = currentSchema.properties?.[section];

    if (sectionSchema) {
      if (sectionSchema.properties?.[key]) {
        targetSchema = sectionSchema.properties[key];
      } else if (
        sectionSchema.additionalProperties &&
        typeof sectionSchema.additionalProperties === "object"
      ) {
        targetSchema = sectionSchema.additionalProperties as JsonSchema;
        if (section === "mcp" && targetSchema.anyOf) {
          targetSchema = targetSchema.anyOf[0]!;
        }
      }
    }

    if (!targetSchema) {
      return JSON.stringify(data, null, 2);
    }

    // For providers: render user's models exactly, then append suggestions at end
    if (section === "provider" && typeof data === "object" && data !== null) {
      const providerData = metadataService.getProviderDetails(key);
      if (providerData?.models) {
        const dataObj = data as Record<string, unknown>;
        const modelsObj = dataObj.models;

        // Get user's existing model IDs
        const existingModelIds = new Set(
          modelsObj ? Object.keys(modelsObj) : [],
        );

        // Build suggested models (not already in user's config)
        const suggestedModels: Record<string, unknown> = {};
        for (const [modelId, modelMeta] of Object.entries(
          providerData.models,
        )) {
          if (!existingModelIds.has(modelId)) {
            // Include ALL metadata from the model
            const modelConfig: Record<string, unknown> = {
              id: modelMeta.id,
              name: modelMeta.name,
            };

            // Add family if available
            if (modelMeta.family) {
              modelConfig.family = modelMeta.family;
            }

            // Add capability flags
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

            // Add interleaved info if available
            if (modelMeta.interleaved !== undefined) {
              modelConfig.interleaved = modelMeta.interleaved;
            }

            // Add limit info if available
            if (modelMeta.limit) {
              modelConfig.limit = {
                context: modelMeta.limit.context,
                output: modelMeta.limit.output,
              };
            }

            // Add cost info if available
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

            // Add modalities if available
            if (modelMeta.modalities) {
              modelConfig.modalities = modelMeta.modalities;
            }

            suggestedModels[modelId] = modelConfig;
          }
        }

        // Build result: user's exact provider config + models with suggestions at end
        const otherProps = { ...dataObj };
        delete otherProps.models;

        // Start with user's other props
        let result = "";
        if (Object.keys(otherProps).length > 0) {
          const otherJson = JSON.stringify(otherProps, null, 2)
            .split("\n")
            .map((line) => "  " + line)
            .join("\n");
          result += otherJson + ",\n";
        }

        // Add user's models (exact formatting)
        if (modelsObj && Object.keys(modelsObj).length > 0) {
          const userModelsJson = JSON.stringify(modelsObj, null, 2)
            .split("\n")
            .map((line) => "    " + line)
            .join("\n");
          result += '  "models": {\n' + userModelsJson;
        }

        // Add suggested models as comments
        if (Object.keys(suggestedModels).length > 0) {
          const suggestionsJson = JSON.stringify(suggestedModels, null, 2)
            .split("\n")
            .map((line) => "    // " + line)
            .join("\n");
          result += (modelsObj ? ",\n" : "") + suggestionsJson;
        }

        // Close braces
        if (result.includes('"models"')) {
          result += "\n  }";
        }
        result += "\n}";

        return result;
      }
    }

    // Fallback to normal stringify for non-providers
    return JSON.stringify(data, null, 2);
  }
}
