/**
 * Extension type definitions for the extension management system.
 * Defines the core data structures for extensions including status, metadata, and installation methods.
 * Provides type safety for extension data throughout the application.
 */

export type ExtensionStatus = 'available' | 'installed' | 'update_available';
export type InstallMethod = 'npm' | 'drop' | 'bash' | 'agents' | 'manual';

export interface Extension {
  id: string;
  name: string;          // Display name
  description: string;
  readme: string;        // Markdown content
  author: string;
  author_url: string | null;
  repository_url: string;
  category: string;
  install_command: string | null;
  install_method: string | null; // Cast to InstallMethod in logic if needed
  featured: boolean;

  // Runtime state
  status: ExtensionStatus;
  install_path?: string;  // Path where extension is installed
}
