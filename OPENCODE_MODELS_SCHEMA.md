# Opencode Model Configuration Schema

This document details the JSON configuration parameters accepted for **models** in `opencode.json`.

Models are configured within a **provider** definition.

## Configuration Context

In `opencode.json`:

```json
{
  "provider": {
    "<provider_name>": {
      "models": {
        "<model_id>": {
          // ... MODEL PARAMETERS GO HERE ...
        }
      }
    }
  }
}
```

## Model Parameters

The following parameters are supported for each model definition.

### 1. Basic Identity

| Parameter      | Type      | Description                                                           |
| :------------- | :-------- | :-------------------------------------------------------------------- |
| `id`           | `string`  | The unique identifier for the model.                                  |
| `name`         | `string`  | The display name of the model.                                        |
| `family`       | `string`  | The model family (e.g., "gpt-4", "claude", "llama").                  |
| `release_date` | `string`  | ISO 8601 date string (e.g., "2024-03-15").                            |
| `status`       | `enum`    | Lifecycle status: `"alpha"`, `"beta"`, `"deprecated"`, or `"active"`. |
| `experimental` | `boolean` | Flag to mark the model as experimental.                               |

### 2. Capabilities (Feature Flags)

Boolean flags enabling specific system features for this model.

| Parameter     | Type      | Description                                                              |
| :------------ | :-------- | :----------------------------------------------------------------------- |
| `attachment`  | `boolean` | Model supports file attachments/uploads.                                 |
| `reasoning`   | `boolean` | Model supports internal reasoning/thinking steps (e.g., o1, Claude 3.7). |
| `temperature` | `boolean` | Model supports temperature (creativity) adjustment.                      |
| `tool_call`   | `boolean` | Model supports function/tool calling.                                    |

### 3. Context & Limits (`limit`)

Defines the window sizes for the model.

```json
"limit": {
  "context": 128000,
  "output": 4096
}
```

| Parameter | Type     | Description                                 |
| :-------- | :------- | :------------------------------------------ |
| `context` | `number` | Maximum input context window size (tokens). |
| `output`  | `number` | Maximum output token limit.                 |

### 4. Cost Configuration (`cost`)

Defines pricing per token (USD).

```json
"cost": {
  "input": 0.000005,
  "output": 0.000015,
  "cache_read": 0.000001,
  "cache_write": 0.000006
}
```

| Parameter           | Type     | Description                                                                            |
| :------------------ | :------- | :------------------------------------------------------------------------------------- |
| `input`             | `number` | Cost per input token.                                                                  |
| `output`            | `number` | Cost per output token.                                                                 |
| `cache_read`        | `number` | (Optional) Cost per cached input token read.                                           |
| `cache_write`       | `number` | (Optional) Cost per cached input token write.                                          |
| `context_over_200k` | `object` | (Optional) Pricing override for context > 200k tokens. Contains same fields as parent. |

### 5. Modalities (`modalities`)

Defines supported input/output formats.

```json
"modalities": {
  "input": ["text", "image"],
  "output": ["text"]
}
```

| Parameter | Type       | Description                                                            |
| :-------- | :--------- | :--------------------------------------------------------------------- |
| `input`   | `string[]` | Supported inputs: `"text"`, `"audio"`, `"image"`, `"video"`, `"pdf"`.  |
| `output`  | `string[]` | Supported outputs: `"text"`, `"audio"`, `"image"`, `"video"`, `"pdf"`. |

### 6. Interleaved Content (`interleaved`)

Configures support for interleaved reasoning or chain-of-thought content.

| Type      | Description                                           |
| :-------- | :---------------------------------------------------- | ---------------------------------------------------------------- |
| `boolean` | Set to `true` to enable default interleaved behavior. |
| `object`  | `{ "field": "reasoning_content"                       | "reasoning_details" }` - Specifies the field used for reasoning. |

### 7. Advanced Options (`options`)

The `options` object is a flexible container for provider-specific settings. While it accepts arbitrary keys (`Record<string, any>`), the following are explicitly supported by the Opencode system or specific providers:

| Key                 | Type                | Relevant Provider(s)           | Description                                                                  |
| :------------------ | :------------------ | :----------------------------- | :--------------------------------------------------------------------------- |
| `includeUsage`      | `boolean`           | **OpenAI Compatible**          | Set to `true` to request token usage stats in responses.                     |
| `useCompletionUrls` | `boolean`           | **Azure**, **Azure Cognitive** | If `true`, uses chat completion URLs instead of standard response endpoints. |
| `baseURL`           | `string`            | **All**                        | Overrides the API base URL for this specific model.                          |
| `apiKey`            | `string`            | **All**                        | Overrides the API key for this specific model.                               |
| `timeout`           | `number` \| `false` | **All**                        | Request timeout in milliseconds. Set `false` to disable.                     |
| `headers`           | `object`            | **All**                        | Custom HTTP headers to merge into requests.                                  |
| `project`           | `string`            | **Google Vertex**              | Google Cloud Project ID.                                                     |
| `location`          | `string`            | **Google Vertex**              | Cloud region/location (e.g., "us-central1").                                 |
| `region`            | `string`            | **Amazon Bedrock**             | AWS Region (e.g., "us-east-1").                                              |
| `deploymentId`      | `string`            | **SAP AI Core**                | Deployment Identifier.                                                       |
| `resourceGroup`     | `string`            | **SAP AI Core**                | Resource Group Identifier.                                                   |
| `fetch`             | `Function`          | **All**                        | (Code-only) Custom fetch implementation.                                     |

### 8. Provider Metadata (`provider`)

Specific metadata linking the model to its implementation.

| Parameter | Type     | Description                                                               |
| :-------- | :------- | :------------------------------------------------------------------------ |
| `npm`     | `string` | The NPM package name responsible for this model (e.g., `@ai-sdk/openai`). |

### 9. Custom Headers (`headers`)

| Parameter | Type     | Description                                                                |
| :-------- | :------- | :------------------------------------------------------------------------- |
| `headers` | `object` | A `Record<string, string>` of headers to apply to requests for this model. |

---

## Example `opencode.json`

```json
{
  "provider": {
    "openai": {
      "models": {
        "gpt-4-turbo-custom": {
          "name": "GPT-4 Turbo (Custom)",
          "limit": {
            "context": 128000,
            "output": 4096
          },
          "cost": {
            "input": 0.00001,
            "output": 0.00003
          },
          "capabilities": {
            "tool_call": true,
            "temperature": true
          },
          "options": {
            "timeout": 60000,
            "includeUsage": true
          },
          "modalities": {
            "input": ["text", "image"],
            "output": ["text"]
          }
        }
      }
    }
  }
}
```

## Related Provider Configuration

While not inside the `model` object, these provider-level keys affect model availability:

- `whitelist`: `string[]` - If set, ONLY these model IDs are loaded.
- `blacklist`: `string[]` - These model IDs are explicitly excluded.
