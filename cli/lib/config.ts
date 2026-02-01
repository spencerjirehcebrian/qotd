import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { resolve } from "path";

export interface QotdConfig {
  apiUrl?: string;
  apiKey?: string;
}

const CONFIG_PATH = resolve(process.cwd(), ".qotdrc");

export function loadConfig(): QotdConfig {
  try {
    if (!existsSync(CONFIG_PATH)) return {};
    const raw = readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(raw) as QotdConfig;
  } catch {
    return {};
  }
}

export function saveConfig(config: QotdConfig): void {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

export function clearConfig(): void {
  try {
    unlinkSync(CONFIG_PATH);
  } catch {
    // file may not exist
  }
}

export function getRemoteConfig(): { apiUrl: string; apiKey: string } | null {
  // Check .qotdrc first
  const fileConfig = loadConfig();
  if (fileConfig.apiUrl && fileConfig.apiKey) {
    return { apiUrl: fileConfig.apiUrl, apiKey: fileConfig.apiKey };
  }

  // Fall back to environment variables
  const apiUrl = process.env.QOTD_API_URL;
  const apiKey = process.env.QOTD_API_KEY;
  if (apiUrl && apiKey) {
    return { apiUrl, apiKey };
  }

  return null;
}
