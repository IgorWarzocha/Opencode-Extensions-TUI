#!/usr/bin/env bun
/**
 * Script to process extension submissions from the submissions/ folder.
 * Fetches READMEs from GitHub for submissions with empty readme fields,
 * injects formatted markdown content, and moves processed files to extensions/.
 * Implements rate limiting (10s delays) to avoid GitHub API limits.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";

// Category mapping from singular to plural
const CATEGORY_MAP = {
  plugin: "Plugins",
  agents: "Agents",
  command: "Commands",
  tool: "Tools",
  theme: "Themes",
  bundle: "Bundles",
  skill: "Skills",
} as const;

type Category = keyof typeof CATEGORY_MAP;

interface SubmissionExtension {
  id: string;
  name: string;
  description: string;
  readme: string;
  author: string;
  author_url: string | null;
  repository_url: string;
  category: string;
  install_command: string | null;
  install_method: string | null;
  featured: boolean;
}

/**
 * Fetch README content from GitHub repository
 */
async function fetchReadme(repositoryUrl: string): Promise<string> {
  const maxRetries = 3;
  const timeout = 10000; // 10 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Extract owner/repo from GitHub URL
      const urlMatch = repositoryUrl.match(
        /github\.com\/([^\/]+)\/([^\/\?#]+)/,
      );
      if (!urlMatch) {
        throw new Error(`Invalid GitHub URL: ${repositoryUrl}`);
      }

      const [, owner, repo] = urlMatch;
      if (!repo) {
        throw new Error(
          `Could not extract repository name from: ${repositoryUrl}`,
        );
      }
      const cleanRepo = repo.replace(/\.git$/, "");

      // Try main branch first, then master
      const branches = ["main", "master"];

      for (const branch of branches) {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${cleanRepo}/${branch}/README.md`;

        const response = await fetch(rawUrl, {
          signal: AbortSignal.timeout(timeout),
        });

        if (response.ok) {
          const content = await response.text();
          console.log(`✓ Fetched README from ${owner}/${cleanRepo}/${branch}`);
          return content;
        }
      }

      throw new Error(
        `README not found in main or master branch for ${owner}/${cleanRepo}`,
      );
    } catch (error) {
      console.error(
        `Attempt ${attempt} failed for ${repositoryUrl}:`,
        error instanceof Error ? error.message : error,
      );

      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Failed to fetch README after ${maxRetries} attempts`);
}

/**
 * Process a single submission file
 */
async function processSubmission(submissionPath: string): Promise<void> {
  const fileName = path.basename(submissionPath);
  // Extract category from the path: submissions/category/file.json
  const pathParts = submissionPath.split(path.sep);
  const submissionsIndex = pathParts.lastIndexOf("submissions");
  if (submissionsIndex === -1 || submissionsIndex + 1 >= pathParts.length) {
    throw new Error(`Invalid submission path: ${submissionPath}`);
  }
  const category = pathParts[submissionsIndex + 1] as Category;

  if (!CATEGORY_MAP[category]) {
    throw new Error(`Unknown category: ${category}`);
  }

  console.log(`\n🔄 Processing: ${fileName} (${category})`);

  // Read submission file
  const content = await fs.readFile(submissionPath, "utf-8");
  const extension: SubmissionExtension = JSON.parse(content);

  // Check if README needs fetching
  if (!extension.readme || extension.readme.trim() === "") {
    console.log(`📖 Fetching README from ${extension.repository_url}`);

    try {
      const readmeContent = await fetchReadme(extension.repository_url);

      // Update extension with fetched README
      extension.readme = readmeContent;
      extension.category = CATEGORY_MAP[category]; // Update to plural form

      console.log(
        `✅ README fetched successfully (${readmeContent.length} chars)`,
      );
    } catch (error) {
      console.error(
        `❌ Failed to fetch README:`,
        error instanceof Error ? error.message : error,
      );

      // Still move the file but with empty README
      extension.readme = "";
      extension.category = CATEGORY_MAP[category];
      console.log(`⚠️  Moving extension with empty README`);
    }
  } else {
    // Just update category to plural
    extension.category = CATEGORY_MAP[category];
    console.log(
      `📝 Already has README (${extension.readme.length} chars), updating category`,
    );
  }

  // Ensure target directory exists
  const targetDir = path.join("extensions", category);
  await fs.mkdir(targetDir, { recursive: true });

  // Write processed extension to target location
  const targetPath = path.join(targetDir, fileName);
  await fs.writeFile(targetPath, JSON.stringify(extension, null, 2), "utf-8");

  console.log(`📁 Moved to: ${targetPath}`);

  // Remove original submission file
  await fs.unlink(submissionPath);
  console.log(`🗑️  Removed original submission: ${submissionPath}`);
}

/**
 * Sleep function for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Find all JSON files in submissions directory
async function findSubmissionFiles(submissionsDir: string): Promise<string[]> {
  const submissionFiles: string[] = [];

  async function scanDir(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        submissionFiles.push(fullPath);
      }
    }
  }

  await scanDir(submissionsDir);
  return submissionFiles;
}

/**
 * Main processing function
 */
async function main() {
  const submissionsDir = "submissions";
  const rateLimitDelay = 10000; // 10 seconds between GitHub requests

  try {
    console.log("🚀 Starting submission processing...\n");

    const submissionFiles = await findSubmissionFiles(submissionsDir);

    if (submissionFiles.length === 0) {
      console.log("✨ No submission files found to process");
      return;
    }

    console.log(
      `📋 Found ${submissionFiles.length} submission(s) to process:\n`,
    );

    // Process each submission with rate limiting
    for (let i = 0; i < submissionFiles.length; i++) {
      const submissionPath = submissionFiles[i];

      if (!submissionPath) {
        console.error("⚠️  Skipping undefined submission path");
        continue;
      }

      try {
        await processSubmission(submissionPath);

        // Rate limiting between submissions (except for the last one)
        if (i < submissionFiles.length - 1) {
          console.log(
            `⏱️  Waiting ${rateLimitDelay / 1000}s before next submission...`,
          );
          await sleep(rateLimitDelay);
        }
      } catch (error) {
        console.error(
          `💥 Failed to process ${submissionPath}:`,
          error instanceof Error ? error.message : error,
        );
        // Continue with next submission even if one fails
      }
    }

    console.log("\n🎉 Submission processing complete!");
  } catch (error) {
    console.error("💥 Fatal error during processing:", error);
    process.exit(1);
  }
}

// Run the script
main();
