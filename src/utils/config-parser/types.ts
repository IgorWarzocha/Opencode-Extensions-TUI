/**
 * Shared config parsing types for JSONC editing.
 * These types describe extracted items and keep parser outputs consistent.
 */

export type ConfigItem = {
  key: string;
  enabled: boolean;
  startLine: number;
  endLine: number;
  raw: string;
};
