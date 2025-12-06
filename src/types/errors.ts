/**
 * Application-wide error discriminated unions for predictable handling.
 * Encodes error origin, kind, and message so callers can branch without string matching.
 */

export type ErrorSource = "extensions" | "readme" | "database" | "github" | "installation";

export type AppError =
  | { kind: "load_failed"; source: ErrorSource; message: string; cause?: unknown }
  | { kind: "not_found"; source: ErrorSource; message: string; identifier?: string }
  | { kind: "parse_error"; source: ErrorSource; message: string; location?: string }
  | { kind: "validation_error"; source: ErrorSource; message: string; field?: string };
