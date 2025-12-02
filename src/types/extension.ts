export type ExtensionStatus = 'available' | 'installed' | 'update_available';

import type { GitHubRepo } from "../services/github";

export interface Extension {
  id: number;
  name: string;
  display_name: string;
  description: string;
  long_description: string;
  source: string;
  repository_url: string;
  package_name: string | null;
  version: string | null;
  author: string | null;
  author_url: string | null;
  homepage: string | null;
  license: string | null;
  keywords: string[];
  category: string;
  download_count: number;
  star_count: number;
  created_at: string | null;
  updated_at: string | null;
  status: string;
  install_path: string | null;
  dependencies: string[];
  opencode_min_version: string | null;
  featured: boolean;
  curated_rating: number | null;
  curator_notes: string | null;
  install_command: string | null;
  manifest_json: string | null;
  githubData?: GitHubRepo | null;
}
