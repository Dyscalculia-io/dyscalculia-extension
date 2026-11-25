// One settings object in storage.sync; the content script follows storage.onChanged.
export interface Settings {
  enabled: boolean;
  hover: boolean; // tooltips on numbers under the mouse (opt-in)
  numberLang: string; // "auto" = page language
  rate: number;
  voice: string;
}

export const DEFAULTS: Settings = { enabled: true, hover: false, numberLang: "auto", rate: 0.9, voice: "" };

export const api: typeof chrome = (globalThis as any).browser ?? chrome;

export async function loadSettings(): Promise<Settings> {
  const got = await api.storage.sync.get("settings");
  return { ...DEFAULTS, ...((got?.settings as Partial<Settings>) ?? {}) };
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await loadSettings()), ...patch };
  await api.storage.sync.set({ settings: next });
  return next;
}

export type Msg = { type: "ping" } | { type: "explain"; text?: string };
