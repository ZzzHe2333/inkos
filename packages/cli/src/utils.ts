import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { createLLMClient, type ProjectConfig, ProjectConfigSchema } from "@actalk/inkos-core";

export function findProjectRoot(): string {
  return process.cwd();
}

export async function loadConfig(): Promise<ProjectConfig> {
  const root = findProjectRoot();

  // Load .env from project root
  loadEnv({ path: join(root, ".env") });

  const configPath = join(root, "inkos.json");
  try {
    const raw = await readFile(configPath, "utf-8");
    return ProjectConfigSchema.parse(JSON.parse(raw));
  } catch (e) {
    throw new Error(
      `Failed to load inkos.json from ${root}. Run 'inkos init' first.`,
    );
  }
}

export function createClient(config: ProjectConfig) {
  return createLLMClient(config.llm);
}

export function log(message: string): void {
  process.stdout.write(`${message}\n`);
}

export function logError(message: string): void {
  process.stderr.write(`[ERROR] ${message}\n`);
}
