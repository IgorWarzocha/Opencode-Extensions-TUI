/**
 * Installation error types for installation operations.
 * Discriminated union enables precise error handling.
 */
export type InstallationError =
  | { type: 'COMMAND_FAILED'; command: string; message: string }
  | { type: 'EXTENSION_NOT_FOUND'; extensionId: number }
  | { type: 'ALREADY_INSTALLED'; extensionId: number }
  | { type: 'DEPENDENCY_ERROR'; dependency: string; message: string }
  | { type: 'PERMISSION_DENIED'; extensionId: number }
  | { type: 'NETWORK_ERROR'; extensionId: number; message: string }
  | { type: 'UNKNOWN_ERROR'; extensionId: number; message: string };

export function getErrorMessage(error: InstallationError): string {
  switch (error.type) {
    case 'COMMAND_FAILED':
      return `Command failed: ${error.message}`;
    case 'EXTENSION_NOT_FOUND':
      return `Extension ${error.extensionId} not found`;
    case 'ALREADY_INSTALLED':
      return `Extension ${error.extensionId} is already installed`;
    case 'DEPENDENCY_ERROR':
      return `Missing dependency '${error.dependency}': ${error.message}`;
    case 'PERMISSION_DENIED':
      return `Permission denied for extension ${error.extensionId}`;
    case 'NETWORK_ERROR':
      return `Network error: ${error.message}`;
    case 'UNKNOWN_ERROR':
      return error.message;
    default:
      return 'An unknown error occurred';
  }
}
