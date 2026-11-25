import { fmt, fmtMoney, parseNumber, partsText, pickLang, words, type Lang } from "./numbers";
import { api, DEFAULTS, loadSettings, saveSettings, type Msg, type Settings } from "./settings";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const SITE = "https://dyscalculia.io";
const TEST_PATH: Record<string, string> = {
  en: "/dyscalculia-test", de: "/de/dyskalkulie-test", fr: "/fr/test-dyscalculie", es: "/es/test-discalculia",
  nl: "/nl/dyscalculie-test", pt: "/pt-br/teste-discalculia", tr: "/tr/diskalkuli-testi",
};
const m = (k: string, subs?: string[]) => api.i18n.getMessage(k, subs) || k;
const ui: Lang = pickLang(api.i18n.getUILanguage());

function i18n() {
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => (el.textContent = m(el.dataset.i18n!)));
  document.querySelectorAll<HTMLElement>("[data-i18n-title]").forEach((el) => (el.title = m(el.dataset.i18nTitle!)));
  document.documentElement.lang = ui;
  $<HTMLAnchorElement>("site").href = `${SITE}${TEST_PATH[ui]}?utm_source=extension&utm_medium=popup`;
}

// ---------- helpers ----------
const num = (id: string): number | null => {
  const v = $<HTMLInputElement>(id).value.trim();
  if (!v) return null;
  const p = parseNumber(v, ui);
  return p ? p.value : null;
};
const f = (n: number, d = 2) => fmt(Math.round(n * 10 ** d) / 10 ** d, ui, d);
const $m = (n: number) => fmtMoney(Math.round(n * 100) / 100, ui);
function show(id: string, ...lines: [string, string][]) {
  const box = $(id);
  box.replaceChildren();
  for (const [cls, text] of lines) {
    const d = document.createElement("div");
    d.className = cls;
    d.textContent = text;
    box.appendChild(d);
  }
}

// ---------- number tab ----------
function numberTab() {
  const raw = $<HTMLInputElement>("numIn").value;
  const p = raw.trim() ? parseNumber(raw, ui) : null;
  if (!p) return show("numOut");
  const w = words(p, ui);
  show("numOut", ["ans", partsText(p, ui)], ...(w ? ([["step", w]] as [string, string][]) : []));
}

// ---------- percent ----------
function percentTab() {
  const a = num("pA"), b = num("pB");
  if (a !== null && b !== null) {
    const r = (a / 100) * b;
    show("pOfOut", ["ans", f(r)], ["step", `${f(b)} × ${f(a)} ÷ 100 = ${f(r)}`], ["step", m("pctTrick", [f(b / 100), f(a)])]);
  } else show("pOfOut");

  const c1 = num("cA"), c2 = num("cB");
  if (c1 !== null && c2 !== null && c1 !== 0) {
    const diff = c2 - c1;
    const pct = (diff / Math.abs(c1)) * 100;
    show("pChOut", ["ans", `${pct >= 0 ? m("increase") : m("decrease")}: ${f(Math.abs(pct), 1)}%`], ["step", `(${f(c2)} − ${f(c1)}) ÷ ${f(Math.abs(c1))} × 100 = ${f(pct, 1)}%`]);
  } else show("pChOut");

  const price = num("dP"), d = num("dD");
  if (price !== null && d !== null) {
    const save = (price * d) / 100;
    show("dOut", ["ans", `${m("youPay")}: ${$m(price - save)}`], ["step", `${m("youSave")}: ${$m(price)} × ${f(d)} ÷ 100 = ${$m(save)}`], ["step", `${$m(price)} − ${$m(save)} = ${$m(price - save)}`]);
  } else show("dOut");
}

// ---------- bill ----------
function billTab() {
  const amt = num("bAmt"), tip = num("bTip") ?? 0, people = Math.max(1, Math.round(num("bPeople") ?? 1));
  if (amt === null) return show("bOut");
  const tipAmt = (amt * tip) / 100;
  const total = amt + tipAmt;
  show(
    "bOut",
    ["ans", `${m("eachPays")}: ${$m(total / people)}`],
    ["step", `${m("tip")}: ${$m(amt)} × ${f(tip)} ÷ 100 = ${$m(tipAmt)}`],
    ["step", `${m("total")}: ${$m(amt)} + ${$m(tipAmt)} = ${$m(total)}`],
    ["step", `${$m(total)} ÷ ${people} = ${$m(total / people)}`],
  );
}

// ---------- unit price ----------
const BASE: Record<string, { factor: number; per: number; label: string }> = {
  g: { factor: 1, per: 100, label: "100 g" },
  kg: { factor: 1000, per: 100, label: "100 g" },
  ml: { factor: 1, per: 100, label: "100 ml" },
  l: { factor: 1000, per: 100, label: "100 ml" },
  item: { factor: 1, per: 1, label: "1" },
};
function unitTab() {
  const rows = [1, 2].map((i) => {
    const p = num(`uP${i}`), q = num(`uQ${i}`);
    const u = $<HTMLSelectElement>(`uU${i}`).value;
    if (p === null || q === null || q <= 0) return null;
    const b = BASE[u];
    const baseQty = q * b.factor; // in g, ml or items
    return { p, per: (p / baseQty) * b.per, label: b.label, kind: u === "item" ? "item" : u === "g" || u === "kg" ? "mass" : "vol" };
  });
  const [a, b] = rows;
  if (!a || !b) return show("uOut");
  const per = (r: typeof a) => (r!.kind === "item" ? m("perItem", [$m(r!.per)]) : m("perUnit", [$m(r!.per), r!.label]));
  const lines: [string, string][] = [["step", `A: ${per(a)}`], ["step", `B: ${per(b)}`]];
  if (a.kind !== b.kind) lines.unshift(["step", m("unitMismatch")]);
  else if (Math.abs(a.per - b.per) < 1e-9) lines.unshift(["ans", m("samePrice")]);
  else {
    const [cheap, dear, name] = a.per < b.per ? [a, b, "A"] : [b, a, "B"];
    lines.unshift(["ans win", m("cheaper", [name, f(((dear.per - cheap.per) / dear.per) * 100, 0)])]);
  }
  show("uOut", ...lines);
}

// ---------- time ----------
function timeTab() {
  const a = $<HTMLInputElement>("tA").value, b = $<HTMLInputElement>("tB").value;
  if (a && b) {
    const [ah, am] = a.split(":").map(Number), [bh, bm] = b.split(":").map(Number);
    let mins = bh * 60 + bm - (ah * 60 + am);
    const overnight = mins < 0;
    if (overnight) mins += 24 * 60;
    const lines: [string, string][] = [["ans", m("hm", [String(Math.floor(mins / 60)), String(mins % 60)])], ["step", m("totalMinutes", [String(mins)])]];
    // Count up to the next full hour, then whole hours, then the rest: how it is done on paper.
    if (am !== 0 && mins > 60 - am) {
      const toHour = 60 - am;
      const rest = mins - toHour;
      lines.push(["step", m("countUp", [a, String(toHour), `${String((ah + 1) % 24).padStart(2, "0")}:00`, String(Math.floor(rest / 60)), String(rest % 60)])]);
    }
    if (overnight) lines.push(["step", m("overnight")]);
    show("tOut", ...lines);
  } else show("tOut");

  const mins = num("tM");
  if (mins !== null && mins >= 0) {
    const h = Math.floor(mins / 60), r = Math.round(mins - h * 60);
    show("tMOut", ["ans", m("hm", [String(h), String(r)])], ["step", `${f(mins, 0)} ÷ 60 = ${h} ${m("remainder")} ${r}`], ["step", `= ${f(mins / 60, 2)} h`]);
  } else show("tMOut");
}

// ---------- page actions ----------
async function ensureInjected(): Promise<number | null> {
  const [tab] = await api.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return null;
  try {
    await api.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
    return tab.id;
  } catch {
    $("notice").hidden = false;
    return null;
  }
}
async function send(msg: Msg) {
  const id = await ensureInjected();
  if (id !== null) {
    await api.tabs.sendMessage(id, msg).catch(() => {});
    window.close();
  }
}

// ---------- settings ----------
function render(s: Settings) {
  $<HTMLInputElement>("enabled").checked = s.enabled;
  $<HTMLInputElement>("hover").checked = s.hover;
  $<HTMLSelectElement>("numberLang").value = s.numberLang;
  $<HTMLSelectElement>("voice").value = s.voice;
  $<HTMLInputElement>("rate").value = String(s.rate);
  $<HTMLInputElement>("rate").nextElementSibling!.textContent = `${s.rate.toFixed(1)}×`;
}
const set = async (patch: Partial<Settings>) => render(await saveSettings(patch));

function voices() {
  const sel = $<HTMLSelectElement>("voice");
  const list = speechSynthesis.getVoices();
  if (!list.length) return;
  const keep = sel.value;
  sel.querySelectorAll("option:not([value=''])").forEach((o) => o.remove());
  for (const v of [...list].sort((a, b) => a.lang.localeCompare(b.lang))) {
    const o = document.createElement("option");
    o.value = v.voiceURI;
    o.textContent = `${v.name} (${v.lang})`;
    sel.appendChild(o);
  }
  sel.value = keep;
}

function tabs(initial: string) {
  const go = (name: string) => {
    document.querySelectorAll<HTMLButtonElement>("#tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === name));
    document.querySelectorAll<HTMLElement>("[data-pane]").forEach((p) => (p.hidden = p.dataset.pane !== name));
    void api.storage.local.set({ tab: name });
  };
  document.querySelectorAll<HTMLButtonElement>("#tabs button").forEach((b) => b.addEventListener("click", () => go(b.dataset.tab!)));
  go(initial);
}

async function main() {
  i18n();
  const { tab } = await api.storage.local.get("tab");
  tabs(typeof tab === "string" ? tab : "number");
  render(await loadSettings());
  voices();
  speechSynthesis.onvoiceschanged = () => {
    voices();
    void loadSettings().then(render);
  };
  void ensureInjected();

  const calc = () => {
    numberTab();
    percentTab();
    billTab();
    unitTab();
    timeTab();
  };
  document.querySelectorAll("input:not([type=checkbox]):not([type=range]), select:not(#voice):not(#numberLang)").forEach((el) => {
    el.addEventListener("input", calc);
    el.addEventListener("change", calc);
  });
  calc();

  $("explainSel").addEventListener("click", () => send({ type: "explain" }));
  $("explainTyped").addEventListener("click", () => {
    const v = $<HTMLInputElement>("numIn").value.trim();
    if (v) void send({ type: "explain", text: v });
  });
  $<HTMLInputElement>("enabled").addEventListener("change", (e) => set({ enabled: (e.target as HTMLInputElement).checked }));
  $<HTMLInputElement>("hover").addEventListener("change", (e) => set({ hover: (e.target as HTMLInputElement).checked, enabled: true }));
  $<HTMLSelectElement>("numberLang").addEventListener("change", (e) => set({ numberLang: (e.target as HTMLSelectElement).value }));
  $<HTMLSelectElement>("voice").addEventListener("change", (e) => set({ voice: (e.target as HTMLSelectElement).value }));
  $<HTMLInputElement>("rate").addEventListener("input", (e) => set({ rate: Number((e.target as HTMLInputElement).value) }));
  $("reset").addEventListener("click", () => set({ ...DEFAULTS }));

  const all = $<HTMLInputElement>("allSites");
  all.checked = await api.permissions.contains({ origins: ["<all_urls>"] });
  all.addEventListener("change", async () => {
    // permissions.request must run inside the click handler (user gesture).
    if (all.checked) all.checked = await api.permissions.request({ origins: ["<all_urls>"] });
    else await api.permissions.remove({ origins: ["<all_urls>"] });
  });
}

void main();
