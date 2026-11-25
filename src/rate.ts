import { api } from "./settings";

/**
 * "Rate this extension" link: shown only after the popup was opened on 5 or more separate days,
 * hidden for good once clicked or dismissed. No reward, no nagging, no data leaves the browser.
 * Firefox: hidden until AMO_URL is set (listing URL known after AMO approval).
 */
export const AMO_URL: string | null = null;
const MIN_DAYS = 5;

export function storeReviewUrl(): string | null {
  const id = api.runtime.id;
  const ua = navigator.userAgent;
  const brands: { brand: string }[] = (navigator as any).userAgentData?.brands ?? [];
  if (/Firefox\//.test(ua)) return AMO_URL;
  if (brands.some((b) => b.brand === "Microsoft Edge") || /Edg\//.test(ua)) return `https://microsoftedge.microsoft.com/addons/detail/${id}`;
  return `https://chromewebstore.google.com/detail/${id}/reviews`;
}

/** Records today's use; returns true when the link should be shown. */
export async function shouldAskForRating(): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10);
  const { useDays, rateDone } = await api.storage.local.get(["useDays", "rateDone"]);
  if (rateDone) return false;
  const days: string[] = Array.isArray(useDays) ? useDays : [];
  if (!days.includes(today)) {
    days.push(today);
    await api.storage.local.set({ useDays: days.slice(-MIN_DAYS) });
  }
  return days.length >= MIN_DAYS && storeReviewUrl() !== null;
}

export async function setupRating(box: HTMLElement, link: HTMLAnchorElement, dismiss: HTMLElement) {
  if (!(await shouldAskForRating())) return;
  link.href = storeReviewUrl()!;
  box.hidden = false;
  const done = () => {
    box.hidden = true;
    void api.storage.local.set({ rateDone: true });
  };
  link.addEventListener("click", done);
  dismiss.addEventListener("click", done);
}
