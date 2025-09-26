import { readFile, writeFile } from "node:fs/promises";
import { kv } from "@vercel/kv";
import { SettingsSchema, DEFAULT_SETTINGS, type Settings } from "@/../types/settings";

const FILE_PATH = ".data.settings.json";
const KV_KEY = "goodtrip:settings:v1";
const isProd = !!process.env.VERCEL && !!process.env.KV_REST_API_URL;

export async function loadSettings(): Promise<Settings> {
  try {
    if (isProd) {
      const data = await kv.get<unknown>(KV_KEY);
      if (!data) return DEFAULT_SETTINGS;
      return SettingsSchema.parse(data);
    }
    const raw = await readFile(FILE_PATH, "utf-8").catch(() => "{}");
    return SettingsSchema.parse({ ...DEFAULT_SETTINGS, ...JSON.parse(raw || "{}") });
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(next: Settings): Promise<void> {
  const valid = SettingsSchema.parse(next);
  if (isProd) await kv.set(KV_KEY, valid);
  else await writeFile(FILE_PATH, JSON.stringify(valid, null, 2), "utf-8");
}
