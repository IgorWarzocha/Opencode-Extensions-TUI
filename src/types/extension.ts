export type ExtensionStatus = 'available' | 'installed' | 'update_available';

export interface Extension {
  id: number;
  name: string;
  display_name: string | null;
  description: string;
  long_description: string | null;
  source: 'github' | 'npm';
  repository_url: string | null;
  package_name: string | null;
  version: string;
  author: string;
  author_url: string | null;
  homepage: string | null;
  license: string | null;
  keywords: string[]; // Parsed from JSON
  category: string;
  download_count: number;
  star_count: number;
  created_at: string;
  updated_at: string;
  status: ExtensionStatus;
  install_path: string | null;
  dependencies: string[]; // Parsed from JSON
  opencode_min_version: string | null;
  featured: boolean;
  curated_rating: number | null;
  curator_notes: string | null;
  install_command: string | null;
  manifest_json: string | null;
}
