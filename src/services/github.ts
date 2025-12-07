/**
 * GitHub API service for fetching repository information and managing cached repo data.
 * Handles repository metadata extraction, README fetching, and local caching with markdown generation.
 */
import { writeFile, mkdir } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "..", "opencode-directory");
const detailsDir = join(dataDir, "details");

export interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  created_at: string;
  updated_at: string;
  license: {
    key: string;
    name: string;
    spdx_id: string;
  } | null;
  topics: string[];
  readme: string | null;
  homepage: string | null;
  owner: {
    login: string;
    html_url: string;
    type: string;
  };
}

export interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: string;
  content?: string;
  encoding?: string;
}

interface GitHubRepoData {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  created_at: string;
  updated_at: string;
  license: {
    key: string;
    name: string;
    spdx_id: string;
  } | null;
  topics: string[];
  homepage: string | null;
  owner: {
    login: string;
    html_url: string;
    type: string;
  };
}

class GitHubService {
  private baseUrl = "https://api.github.com";
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheTimeout;
  }

  private async fetchWithCache<T>(url: string): Promise<T | null> {
    const cached = this.cache.get(url);
    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data as T;
    }

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "OpenCode-Extensions-TUI",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.cache.set(url, { data, timestamp: Date.now() });
      return data as T;
    } catch (_error) {
      return null;
    }
  }

  extractRepoInfo(url: string): { owner: string; repo: string } | null {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === "gist.github.com") {
        return null; // Gists are handled differently
      }
      if (!parsed.hostname.endsWith("github.com")) {
        return null;
      }

      const segments = parsed.pathname.split("/").filter(Boolean);
      if (segments.length < 2) {
        return null;
      }

      const owner = segments[0];
      const repoRaw = segments[1];
      
      if (!owner || !repoRaw || typeof owner !== "string" || typeof repoRaw !== "string") {
        return null;
      }

      const repoName = (repoRaw || "").replace(/\.git$/, "").split("#")[0]?.split("?")[0] || "";
      if (!repoName) {
        return null;
      }

      return { owner, repo: repoName };
    } catch (_error) {
      return null;
    }
  }

  async getRepository(repoUrl: string): Promise<GitHubRepo | null> {
    const repoInfo = this.extractRepoInfo(repoUrl);
    if (!repoInfo) {
      return null;
    }

    const { owner, repo } = repoInfo;
    const url = `${this.baseUrl}/repos/${owner}/${repo}`;

    const repoData = await this.fetchWithCache<GitHubRepoData>(url);
    if (!repoData) {
      return null;
    }

    const readmeUrl = `${this.baseUrl}/repos/${owner}/${repo}/readme`;
    const readmeData = await this.fetchWithCache<GitHubContent>(readmeUrl);

    let readmeContent: string | null = null;
    if (readmeData?.content && readmeData.encoding === "base64") {
      try {
        readmeContent = Buffer.from(readmeData.content, "base64").toString("utf-8");
      } catch (_error) {
        readmeContent = null;
      }
    }

    return {
      name: repoData.name,
      full_name: repoData.full_name,
      description: repoData.description,
      html_url: repoData.html_url,
      stargazers_count: repoData.stargazers_count,
      forks_count: repoData.forks_count,
      language: repoData.language,
      created_at: repoData.created_at,
      updated_at: repoData.updated_at,
      license: repoData.license,
      topics: repoData.topics,
      readme: readmeContent,
      homepage: repoData.homepage,
      owner: {
        login: repoData.owner.login,
        html_url: repoData.owner.html_url,
        type: repoData.owner.type,
      },
    };
  }

  async saveRepoDetails(repo: GitHubRepo): Promise<string> {
    await mkdir(detailsDir, { recursive: true });

    const fileName = `${repo.full_name.replace(/\//g, "_")}.md`;
    const filePath = join(detailsDir, fileName);

    const markdown = this.generateRepoMarkdown(repo);

    await writeFile(filePath, markdown, "utf-8");
    return filePath;
  }

  private generateRepoMarkdown(repo: GitHubRepo): string {
    return `===FRONTMATTER===
name: "${repo.name}"
description: "${repo.description || "No description available"}"
author: "${repo.owner.login}"
author_url: "${repo.owner.html_url}"
repository_url: "${repo.html_url}"
license: "${repo.license?.name || "No license"}"
star_count: ${repo.stargazers_count}
download_count: 0
forks: ${repo.forks_count}
language: "${repo.language || "Not specified"}"
updated_at: "${repo.updated_at}"
keywords: [${repo.topics.map(topic => `"${topic}"`).join(', ')}]
===FRONTMATTER===

# ${repo.full_name}

## README

${repo.readme || "No README available"}`;
  }

  async getRepoDetails(repoUrl: string): Promise<GitHubRepo | null> {
    const repoInfo = this.extractRepoInfo(repoUrl);
    if (!repoInfo) {
      return null;
    }

    const fileName = `${repoInfo.owner}_${repoInfo.repo}.md`;
    const filePath = join(detailsDir, fileName);

    try {
      const file = Bun.file(filePath);
      if (await file.exists()) {
        const cachedContent = await file.text();
        return this.parseCachedMarkdown(cachedContent, repoUrl, repoInfo);
      }
    } catch (_error) {
      // fall through to fresh fetch
    }

    return await this.getRepository(repoUrl);
  }

  private parseCachedMarkdown(markdown: string, repoUrl: string, repoInfo: { owner: string; repo: string }): GitHubRepo | null {
    const lines = markdown.split("\n");
    const readmeStart = lines.findIndex((line) => line.includes("## README"));
    
    let readmeContent = "";
    if (readmeStart !== -1) {
      // Start after "## README" line
      const readmeLines = lines.slice(readmeStart + 1);
      
      // Find the end of actual README content (before the last "---" separator)
      const lastSeparatorIndex = readmeLines.lastIndexOf("---");
      const endIndex = lastSeparatorIndex > 0 ? lastSeparatorIndex : readmeLines.length;
      
      // Get content between "## README" and the last "---" separator
      readmeContent = readmeLines.slice(0, endIndex).join("\n").trim();
    }

    return {
      name: repoInfo.repo,
      full_name: `${repoInfo.owner}/${repoInfo.repo}`,
      description: this.extractField(markdown, "Description") || null,
      html_url: repoUrl,
      stargazers_count: 0,
      forks_count: 0,
      language: this.extractField(markdown, "Language") || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      license: null,
      topics: [],
      readme: readmeContent,
      homepage: null,
      owner: {
        login: repoInfo.owner,
        html_url: `https://github.com/${repoInfo.owner}`,
        type: "User",
      },
    };
  }

  private extractField(markdown: string, fieldName: string): string | null {
    const regex = new RegExp(`\\*\\*${fieldName}:\\*\\* (.+)`);
    const match = markdown.match(regex);
    return match && match[1] ? match[1].trim() : null;
  }
}

export const githubService = new GitHubService();
