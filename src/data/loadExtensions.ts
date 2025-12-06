import { dirname, join } from "path";
import { fileURLToPath } from "url";
import type { Extension } from "../types/extension";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "..", "opencode-directory");
const files = ["tools.json", "integrations.json", "themes.json", "agents.json", "commands.json"];

async function readJson(file: string): Promise<Extension[]> {
  const path = join(dataDir, file);
  const fileHandle = Bun.file(path);
  if (!(await fileHandle.exists())) return [];
  return (await fileHandle.json()) as Extension[];
}

export async function loadExtensions(): Promise<Extension[]> {
  const parts = await Promise.all(files.map((file) => readJson(file)));
  return parts
    .flat()
    .map((ext, index) => {
      const { id: _ignored, ...rest } = ext as Partial<Extension>;
      return { id: index + 1, ...rest } as Extension;
    });
}
