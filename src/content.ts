// Content script: the number panel and the opt-in hover tooltips.
// Injected on demand (popup, menu, shortcut via activeTab) or on every page when
// the user granted <all_urls>. Idempotent: a second injection only refreshes.
import {
  expanded, findNumbers, fmt, fmtMoney, groupName, intlLocale, moneyBreakdown, numberLine, parseNumber,
  partsText, pickLang, placeValues, roundings, words, type Lang, type Parsed,
} from "./numbers";
import { api, DEFAULTS, loadSettings, type Msg, type Settings } from "./settings";

// Panel labels follow the number language (explicit setting, else page language),
// so a German page gets German labels. Bundled from the same _locales files.
import en from "../static/_locales/en/messages.json";
import de from "../static/_locales/de/messages.json";
import fr from "../static/_locales/fr/messages.json";
import es from "../static/_locales/es/messages.json";
import nl from "../static/_locales/nl/messages.json";
import pt from "../static/_locales/pt_BR/messages.json";
import tr from "../static/_locales/tr/messages.json";
type Messages = Record<string, { message: string }>;
const MESSAGES: Record<Lang, Messages> = { en, de, fr, es, nl, pt, tr } as Record<Lang, Messages>;
let labelLang: Lang = "en";

function t(key: string, subs: string[] = []) {
  const msg = MESSAGES[labelLang]?.[key]?.message ?? MESSAGES.en[key]?.message;
  if (!msg) return api.i18n.getMessage(key, subs) || key;
  return msg.replace(/\$P(\d)\$/g, (_, n) => subs[Number(n) - 1] ?? "");
}

const GROUP_COLORS = ["#4f46e5", "#d97706", "#16a34a", "#db2777", "#0284c7"]; // ones, thousands, millions, billions, trillions
const DEC_COLOR = "#64748b";

function compactFmt(l: Lang) {
  return new Intl.NumberFormat(intlLocale(l), { notation: "compact" });
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function init() {
  let s: Settings = { ...DEFAULTS };

  const host = document.createElement("dysc-number-helper");
  host.style.cssText = "all:initial;position:fixed;inset:0;pointer-events:none;z-index:2147483646;";
  const root = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = UI_CSS;
  const tip = el("div", "tip");
  tip.hidden = true;
  const panel = el("div", "panel");
  panel.hidden = true;
  root.append(style, tip, panel);
  document.documentElement.appendChild(host);

  const lang = (): Lang => pickLang(s.numberLang === "auto" ? document.documentElement.lang || navigator.language : s.numberLang);

  // ---------- speech ----------
  function say(text: string, l: Lang) {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = intlLocale(l);
    u.rate = s.rate;
    const voices = speechSynthesis.getVoices();
    const v = (s.voice && voices.find((v) => v.voiceURI === s.voice)) || voices.find((v) => v.lang.toLowerCase().startsWith(l));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  }

  // ---------- panel ----------
  function explain(text?: string) {
    const raw = (text ?? getSelection()?.toString() ?? "").trim();
    const l = lang();
    labelLang = l;
    const p = raw ? parseNumber(raw, l) : null;
    if (!p) {
      toast(raw ? t("noNumber") : t("selectFirst"));
      return;
    }
    render(p, l);
  }

  function render(p: Parsed, l: Lang) {
    labelLang = l;
    panel.replaceChildren();
    const maxFrac = Math.max(2, p.frac.length);
    const shown = `${p.negative ? "−" : ""}${p.currency && !/^[A-Z]/.test(p.currency) ? p.currency : ""}${fmt(Math.abs(p.value), l, maxFrac)}${p.percent ? "%" : ""}${/^[A-Z]/.test(p.currency) ? " " + p.currency : ""}`;

    // header
    const head = el("div", "head");
    head.append(el("div", "big", shown));
    const close = el("button", "x", "✕");
    close.title = t("close");
    close.addEventListener("click", () => (panel.hidden = true));
    head.append(close);
    panel.append(head);

    const body = el("div", "body");
    panel.append(body);

    // in parts
    body.append(section(t("secParts"), el("div", "parts", partsText(p, l))));

    // place value table
    const pv = placeValues(p);
    const table = el("div", "pv");
    for (const cell of pv) {
      const g = cell.pow >= 0 ? Math.floor(cell.pow / 3) : -1;
      const c = el("div", "cell");
      c.style.setProperty("--c", g >= 0 ? GROUP_COLORS[Math.min(g, 4)] : DEC_COLOR);
      if (cell.pow === -1) table.append(el("div", "dot", fmt(1.5, l, 1).charAt(1)));
      if (cell.pow >= 0 && cell.pow % 3 === 2 && cell.pow !== pv[0].pow) c.classList.add("gap");
      // Place labels: full up to 1,000, compact above (10K, 1M …) so ten digits fit on one row.
      const place = Number(`1e${cell.pow}`);
      c.append(el("div", "d", cell.digit), el("div", "pl", cell.pow > 3 ? compactFmt(l).format(place) : fmt(place, l, 6)));
      table.append(c);
    }
    const legend = el("div", "legend");
    const groups = new Set(pv.map((x) => (x.pow >= 0 ? Math.floor(x.pow / 3) : -1)));
    for (const g of [...groups].sort((a, b) => b - a)) {
      const name = g === -1 ? t("groupDecimals") : g === 0 ? t("groupOnes") : groupName(g * 3, l) ?? `10^${g * 3}`;
      const chip = el("span", "chip", name);
      chip.style.setProperty("--c", g >= 0 ? GROUP_COLORS[Math.min(g, 4)] : DEC_COLOR);
      legend.append(chip);
    }
    body.append(section(t("secPlace"), table, legend));

    // expanded form
    const terms = expanded(p).map((n) => fmt(n, l, maxFrac));
    if (terms.length > 1) body.append(section(t("secExpanded"), el("div", "mono", terms.join(" + "))));

    // words + listen
    const w = words(p, l);
    const wordsBox = el("div", "words", w ?? t("wordsMissing"));
    if (!w) wordsBox.classList.add("muted");
    const listen = el("button", "pill", `🔊 ${t("listen")}`);
    listen.addEventListener("click", () => say(w ?? partsText(p, l), l));
    body.append(section(t("secWords"), wordsBox, listen));

    // rounding
    const r = roundings(p.value);
    if (r.length) {
      const list = el("div", "round");
      for (const x of r) list.append(el("div", "", t("roundTo", [fmt(x.to, l), fmt(x.result, l)])));
      body.append(section(t("secRound"), list));
    }

    // number line
    body.append(section(t("secLine"), line(p.value, l)));

    // money
    const coins = moneyBreakdown(Math.abs(p.value));
    if (coins && (p.currency || p.frac.length <= 2)) {
      const box = el("div", "money");
      for (const c of coins) {
        const item = el("div", c.denom >= 5 ? "note" : "coin");
        item.append(el("b", "", `${c.count}×`), el("span", "", fmtMoney(c.denom, l)));
        box.append(item);
      }
      const wrap = section(t("secMoney"), box, el("small", "muted", t("moneyNote")));
      if (!p.currency) {
        const btn = el("button", "pill ghost", t("showMoney"));
        box.hidden = true;
        btn.addEventListener("click", () => {
          box.hidden = !box.hidden;
        });
        wrap.insertBefore(btn, box);
      }
      body.append(wrap);
    }

    const foot = el("a", "foot", t("panelFooter"));
    foot.href = siteLink(l, "placeValueChart");
    foot.target = "_blank";
    foot.rel = "noopener";
    body.append(foot);

    panel.hidden = false;
    panel.scrollTop = 0;
  }

  function section(title: string, ...children: Node[]) {
    const sec = el("section");
    sec.append(el("h3", "", title), ...children);
    return sec;
  }

  function line(value: number, l: Lang): SVGSVGElement {
    const { min, max, step } = numberLine(value);
    const NS = "http://www.w3.org/2000/svg";
    const W = 380, H = 66, X0 = 14, X1 = W - 14, Y = 34;
    const x = (v: number) => X0 + ((v - min) / (max - min)) * (X1 - X0);
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("class", "line");
    const mk = (tag: string, attrs: Record<string, string | number>, text?: string) => {
      const e = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
      if (text) e.textContent = text;
      svg.appendChild(e);
      return e;
    };
    const compact = new Intl.NumberFormat(intlLocale(l), { notation: "compact", maximumFractionDigits: 2 });
    mk("line", { x1: X0, x2: X1, y1: Y, y2: Y, stroke: "#94a3b8", "stroke-width": 2 });
    for (let i = 0; i <= 10; i++) {
      const v = min + i * step;
      mk("line", { x1: x(v), x2: x(v), y1: Y - (i % 5 ? 4 : 7), y2: Y + (i % 5 ? 4 : 7), stroke: "#94a3b8", "stroke-width": 1.5 });
      if (i % 5 === 0) mk("text", { x: x(v), y: Y + 22, "text-anchor": "middle", "font-size": 11, fill: "#64748b" }, compact.format(v));
    }
    const vx = Math.max(X0, Math.min(X1, x(value)));
    mk("circle", { cx: vx, cy: Y, r: 6, fill: "#f59e0b", stroke: "#fff", "stroke-width": 2 });
    mk("text", { x: Math.max(30, Math.min(W - 30, vx)), y: 14, "text-anchor": "middle", "font-size": 12, "font-weight": 700, fill: "#14132b" }, compact.format(value));
    return svg;
  }

  // ---------- hover tooltips ----------
  let lastMove = 0;
  let hoverHit: Parsed | null = null;
  function caretAt(x: number, y: number): { node: Node; offset: number } | null {
    const d = document as any;
    if (d.caretPositionFromPoint) {
      const c = d.caretPositionFromPoint(x, y);
      return c ? { node: c.offsetNode, offset: c.offset } : null;
    }
    const r: Range | null = d.caretRangeFromPoint?.(x, y);
    return r ? { node: r.startContainer, offset: r.startOffset } : null;
  }
  addEventListener(
    "mousemove",
    (e) => {
      if (!s.enabled || !s.hover) return;
      const now = performance.now();
      if (now - lastMove < 90) return;
      lastMove = now;
      const c = caretAt(e.clientX, e.clientY);
      hoverHit = null;
      if (c && c.node.nodeType === Node.TEXT_NODE && !(e.composedPath().includes(host))) {
        const text = c.node.nodeValue ?? "";
        const l = lang();
        const hit = findNumbers(text, l).find((n) => c.offset >= n.start && c.offset <= n.end);
        if (hit && (hit.parsed.int.length >= 4 || hit.parsed.frac || hit.parsed.currency || hit.parsed.percent)) {
          hoverHit = hit.parsed;
          labelLang = l;
          tip.replaceChildren(el("b", "", partsText(hit.parsed, l)));
          const w = words(hit.parsed, l);
          if (w) tip.append(el("div", "", w.length > 90 ? w.slice(0, 88) + "…" : w));
          tip.append(el("small", "", t("tipHint")));
          tip.hidden = false;
          tip.style.left = `${Math.min(innerWidth - 300, e.clientX + 12)}px`;
          tip.style.top = `${e.clientY + 18 + 90 > innerHeight ? e.clientY - 90 : e.clientY + 18}px`;
          return;
        }
      }
      tip.hidden = true;
    },
    { passive: true },
  );
  addEventListener("dblclick", () => {
    if (s.enabled && s.hover && hoverHit) render(hoverHit, lang());
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape") panel.hidden = true;
  });

  function toast(msg: string) {
    const e = el("div", "toast", msg);
    root.appendChild(e);
    setTimeout(() => e.remove(), 2600);
  }

  function apply() {
    if (!s.enabled || !s.hover) tip.hidden = true;
    if (!s.enabled) panel.hidden = true;
  }

  async function refresh() {
    s = await loadSettings();
    if (!host.isConnected) document.documentElement.appendChild(host);
    apply();
  }

  api.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.settings) {
      s = { ...DEFAULTS, ...(changes.settings.newValue ?? {}) };
      apply();
    }
  });

  api.runtime.onMessage.addListener((msg: Msg, _sender, reply) => {
    if (msg.type === "ping") void refresh();
    if (msg.type === "explain") explain(msg.text);
    reply(true);
    return false;
  });

  void refresh();
  return { refresh };
}

const SLUGS: Record<string, Partial<Record<Lang, string>>> = {
  placeValueChart: { en: "/place-value-chart", de: "/de/stellenwerttafel", fr: "/fr/tableau-de-numeration", pt: "/pt-br/quadro-valor-de-lugar" },
};
function siteLink(l: Lang, key: string) {
  return `https://dyscalculia.io${SLUGS[key][l] ?? SLUGS[key].en}?utm_source=extension&utm_medium=panel`;
}

const UI_CSS = `
:host{all:initial}
*{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
[hidden]{display:none!important}
.panel{position:fixed;right:16px;bottom:16px;width:min(420px,calc(100vw - 24px));max-height:min(640px,calc(100vh - 32px));overflow:auto;background:#fafaff;color:#14132b;border:1px solid #e4e4f0;border-radius:18px;box-shadow:0 20px 56px rgba(20,19,43,.28);pointer-events:auto}
.head{position:sticky;top:0;display:flex;align-items:center;gap:8px;padding:12px 14px;background:#4f46e5;color:#fff;z-index:1}
.big{flex:1;font-size:26px;font-weight:800;letter-spacing:.02em;font-variant-numeric:tabular-nums;word-break:break-all}
.x{all:unset;cursor:pointer;width:30px;height:30px;text-align:center;line-height:30px;border-radius:8px;background:rgba(255,255,255,.18)}
.x:hover{background:rgba(255,255,255,.32)}
.body{padding:4px 14px 14px}
section{padding:10px 0;border-bottom:1px solid #e4e4f0}
h3{margin:0 0 6px;font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:#7c7b99;font-weight:700}
.parts{font-size:19px;font-weight:700;line-height:1.4;overflow-wrap:anywhere}
.pv{display:flex;flex-wrap:wrap;gap:3px;row-gap:6px;align-items:flex-end}
.cell{min-width:31px;text-align:center;border-radius:9px;padding:6px 2px 4px;background:color-mix(in srgb,var(--c) 12%,#fff);border:1.5px solid color-mix(in srgb,var(--c) 45%,#fff)}
.cell.gap{margin-left:6px}
.cell .d{font-size:24px;font-weight:800;color:var(--c);line-height:1.1}
.cell .pl{font-size:9.5px;color:#45446a;white-space:nowrap;margin-top:2px}
.dot{font-size:28px;font-weight:800;padding:0 2px 16px;color:#14132b}
.legend{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.chip{font-size:11.5px;padding:2px 9px;border-radius:999px;color:#fff;background:var(--c)}
.mono{font-size:16px;font-variant-numeric:tabular-nums;line-height:1.5}
.words{font-size:16px;line-height:1.5;margin-bottom:8px;overflow-wrap:anywhere}
.muted{color:#7c7b99;font-size:12px}
.pill{all:unset;cursor:pointer;background:#4f46e5;color:#fff;border-radius:999px;padding:6px 14px;font-size:13px;white-space:nowrap}
.pill.ghost{background:#eceafe;color:#4f46e5;margin-bottom:6px}
.round{display:grid;gap:3px;font-size:14px;font-variant-numeric:tabular-nums}
.line{width:100%;height:auto;display:block}
.money{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 6px}
.note,.coin{display:flex;align-items:center;gap:5px;font-size:13px;font-variant-numeric:tabular-nums}
.note span{display:inline-block;min-width:44px;padding:5px 6px;text-align:center;border-radius:5px;background:#dcfce7;border:1.5px solid #16a34a;color:#14532d;font-weight:700}
.coin span{display:inline-grid;place-items:center;width:38px;height:38px;border-radius:50%;background:#fef3c7;border:1.5px solid #d97706;color:#78350f;font-weight:700;font-size:11.5px}
.foot{display:block;margin-top:12px;color:#4f46e5;font-weight:600;font-size:13px}
.tip{position:fixed;max-width:290px;background:#14132b;color:#fff;border-radius:12px;padding:8px 11px;font-size:13px;line-height:1.4;box-shadow:0 10px 30px rgba(0,0,0,.25);pointer-events:none}
.tip b{font-size:15px}
.tip small{display:block;margin-top:3px;color:#c9c9e0;font-size:11px}
.toast{position:fixed;top:16px;left:50%;transform:translateX(-50%);background:#14132b;color:#fff;padding:9px 16px;border-radius:999px;font-size:14px;pointer-events:none}
`;

// Bootstrap last: UI_CSS above must be initialised before init() runs.
const W = window as any;
if (W.__dyscNumberHelper) {
  W.__dyscNumberHelper.refresh();
} else {
  W.__dyscNumberHelper = init();
}
