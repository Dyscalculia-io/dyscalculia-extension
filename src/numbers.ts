// Number parsing and naming. Pure functions, no DOM — shared by the content
// script, the popup and test/numbers.test.mjs.
//
// Full words are written out for en, de, es and tr only; the "in parts" form
// (1 million 234 thousand 567) is given for every site language. Unit tests in
// test/numbers.test.mjs pin known values per language.

export const LANGS = ["en", "de", "fr", "es", "nl", "pt", "tr"] as const;
export type Lang = (typeof LANGS)[number];
export const WORD_LANGS: Lang[] = ["en", "de", "es", "tr"];

export function pickLang(lang: string | undefined): Lang {
  const k = (lang || "en").toLowerCase().slice(0, 2);
  return (LANGS as readonly string[]).includes(k) ? (k as Lang) : "en";
}

const COMMA_DECIMAL: Lang[] = ["de", "fr", "es", "nl", "pt", "tr"];

export interface Parsed {
  raw: string; // the matched text
  negative: boolean;
  int: string; // integer digits, no leading zeros ("0" for zero)
  frac: string; // decimal digits ("" if none)
  value: number;
  currency: string; // symbol or code found next to the number, "" if none
  percent: boolean;
}

const CUR = "[$€£¥₺₹₽₩₪฿]|USD|EUR|GBP|TRY|TL|CHF|BRL|R\\$|MXN|CAD|AUD";
const NUM = "\\d{1,3}(?:[.,\\s\\u00a0\\u202f'’]\\d{3})+(?:[.,]\\d+)?|\\d+(?:[.,]\\d+)?";
// optional sign, optional currency before, number, optional currency or % after
const RE = new RegExp(`([-−]?)\\s?(${CUR})?\\s?(${NUM})\\s?(%|${CUR})?`, "g");

/** Every number in a string with its start/end offsets (used by hover mode). */
export function findNumbers(text: string, lang: string): { start: number; end: number; parsed: Parsed }[] {
  const out: { start: number; end: number; parsed: Parsed }[] = [];
  RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RE.exec(text))) {
    const p = fromMatch(m, lang);
    if (p) out.push({ start: m.index, end: m.index + m[0].length, parsed: p });
  }
  return out;
}

export function parseNumber(text: string, lang: string): Parsed | null {
  RE.lastIndex = 0;
  const m = RE.exec(text.trim());
  return m ? fromMatch(m, lang) : null;
}

function fromMatch(m: RegExpExecArray, lang: string): Parsed | null {
  const [whole, sign, curBefore, core, after] = m;
  const { int, frac } = splitSeparators(core, pickLang(lang));
  if (int.length > 15) return null; // beyond trillions: not supported
  const cleanInt = int.replace(/^0+(?=\d)/, "");
  return {
    raw: whole.trim(),
    negative: sign === "-" || sign === "−",
    int: cleanInt,
    frac,
    value: (sign ? -1 : 1) * Number(`${cleanInt}.${frac || "0"}`),
    currency: curBefore || (after && after !== "%" ? after : "") || "",
    percent: after === "%",
  };
}

/** Decide which of `.` and `,` is the decimal mark. */
export function splitSeparators(core: string, lang: Lang): { int: string; frac: string } {
  const s = core.replace(/[\s  '’]/g, "");
  const dots = (s.match(/\./g) ?? []).length;
  const commas = (s.match(/,/g) ?? []).length;
  let dec: "." | "," | null = null;
  if (dots && commas) dec = s.lastIndexOf(".") > s.lastIndexOf(",") ? "." : ",";
  else if (dots + commas === 1) {
    const c = dots ? "." : ",";
    const after = s.length - s.indexOf(c) - 1;
    if (after !== 3) dec = c;
    else dec = COMMA_DECIMAL.includes(lang) ? (c === "," ? "," : null) : c === "." ? "." : null;
  }
  // two or more of the same mark: thousands separators, no decimals
  if (!dec) return { int: s.replace(/[.,]/g, ""), frac: "" };
  const i = s.lastIndexOf(dec);
  return { int: s.slice(0, i).replace(/[.,]/g, "") || "0", frac: s.slice(i + 1) };
}

// ---------------- "in parts": 1 million 234 thousand 567 ----------------

type Scale = { pow: number; one: string; many: string };
const SCALES: Record<Lang, Scale[]> = {
  en: [s(12, "trillion"), s(9, "billion"), s(6, "million"), s(3, "thousand")],
  de: [s(12, "Billion", "Billionen"), s(9, "Milliarde", "Milliarden"), s(6, "Million", "Millionen"), s(3, "Tausend")],
  fr: [s(12, "billion", "billions"), s(9, "milliard", "milliards"), s(6, "million", "millions"), s(3, "mille")],
  // Spanish uses the long scale: 10^9 is "mil millones", so millions can run to 999 999.
  es: [s(12, "billón", "billones"), s(6, "millón", "millones"), s(3, "mil")],
  nl: [s(12, "biljoen"), s(9, "miljard"), s(6, "miljoen"), s(3, "duizend")],
  pt: [s(12, "trilhão", "trilhões"), s(9, "bilhão", "bilhões"), s(6, "milhão", "milhões"), s(3, "mil")],
  tr: [s(12, "trilyon"), s(9, "milyar"), s(6, "milyon"), s(3, "bin")],
};
function s(pow: number, one: string, many = one): Scale {
  return { pow, one, many };
}

export const POINT: Record<Lang, string> = { en: "point", de: "Komma", fr: "virgule", es: "coma", nl: "komma", pt: "vírgula", tr: "virgül" };
const INTL: Record<Lang, string> = { en: "en-US", de: "de-DE", fr: "fr-FR", es: "es-ES", nl: "nl-NL", pt: "pt-BR", tr: "tr-TR" };

export function fmt(n: number | bigint, lang: Lang, maxFrac = 2): string {
  return new Intl.NumberFormat(INTL[lang], { maximumFractionDigits: maxFrac }).format(n as number);
}

/** Money style: always two decimals unless the amount is whole. */
export function fmtMoney(n: number, lang: Lang): string {
  const whole = Math.abs(n - Math.round(n)) < 1e-9;
  return new Intl.NumberFormat(INTL[lang], { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 }).format(n);
}

/** Groups by scale word: [{ value: 1, word: "million" }, { value: 234, word: "thousand" }, { value: 567, word: "" }] */
export function parts(int: string, lang: Lang): { value: bigint; word: string; pow: number }[] {
  let n = BigInt(int || "0");
  const out: { value: bigint; word: string; pow: number }[] = [];
  for (const sc of SCALES[lang]) {
    const unit = 10n ** BigInt(sc.pow);
    const q = n / unit;
    if (q > 0n) {
      out.push({ value: q, word: q === 1n ? sc.one : sc.many, pow: sc.pow });
      n %= unit;
    }
  }
  if (n > 0n || out.length === 0) out.push({ value: n, word: "", pow: 0 });
  return out;
}

export function partsText(p: Parsed, lang: Lang): string {
  const body = parts(p.int, lang)
    .map((x) => `${fmt(x.value, lang)}${x.word ? " " + x.word : ""}`)
    .join(" ");
  const sign = p.negative ? "−" : "";
  return `${sign}${body}${p.frac ? ` ${POINT[lang]} ${p.frac.split("").join(" ")}` : ""}`;
}

// ---------------- full words ----------------

const EN_U = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const EN_T = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function en999(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const out: string[] = [];
  if (h) out.push(`${EN_U[h]} hundred`);
  if (r) out.push(r < 20 ? EN_U[r] : EN_T[Math.floor(r / 10)] + (r % 10 ? `-${EN_U[r % 10]}` : ""));
  return out.join(" ");
}
function enWords(int: bigint): string {
  if (int === 0n) return "zero";
  const names = ["", "thousand", "million", "billion", "trillion"];
  const out: string[] = [];
  let i = 0;
  while (int > 0n) {
    const g = Number(int % 1000n);
    if (g) out.unshift(en999(g) + (names[i] ? ` ${names[i]}` : ""));
    int /= 1000n;
    i++;
  }
  return out.join(" ");
}

const TR_U = ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"];
const TR_T = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"];
function tr999(n: number): string {
  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const u = n % 10;
  const out: string[] = [];
  if (h) out.push(h === 1 ? "yüz" : `${TR_U[h]} yüz`);
  if (t) out.push(TR_T[t]);
  if (u) out.push(TR_U[u]);
  return out.join(" ");
}
function trWords(int: bigint): string {
  if (int === 0n) return "sıfır";
  const names = ["", "bin", "milyon", "milyar", "trilyon"];
  const out: string[] = [];
  let i = 0;
  while (int > 0n) {
    const g = Number(int % 1000n);
    // "bin", never "bir bin"; but "bir milyon"
    if (g) out.unshift(i === 1 && g === 1 ? "bin" : tr999(g) + (names[i] ? ` ${names[i]}` : ""));
    int /= 1000n;
    i++;
  }
  return out.join(" ");
}

const DE_U = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"];
const DE_T = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"];
function de99(n: number, final: boolean): string {
  if (n === 1) return final ? "eins" : "ein";
  if (n < 20) return DE_U[n];
  const u = n % 10;
  const t = DE_T[Math.floor(n / 10)];
  return u ? `${u === 1 ? "ein" : DE_U[u]}und${t}` : t;
}
function de999(n: number, final: boolean): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return (h ? `${h === 1 ? "ein" : DE_U[h]}hundert` : "") + (r ? de99(r, final) : "");
}
function deWords(int: bigint): string {
  if (int === 0n) return "null";
  const big: [bigint, string, string][] = [
    [10n ** 12n, "Billion", "Billionen"],
    [10n ** 9n, "Milliarde", "Milliarden"],
    [10n ** 6n, "Million", "Millionen"],
  ];
  const out: string[] = [];
  for (const [unit, one, many] of big) {
    const q = Number(int / unit);
    if (q) out.push(q === 1 ? `eine ${one}` : `${de999(q, false)}${q % 100 === 1 ? "e" : ""} ${many}`);
    int %= unit;
  }
  const th = Number(int / 1000n);
  const r = Number(int % 1000n);
  const low = (th ? `${de999(th, false)}tausend` : "") + (r ? de999(r, true) : "");
  if (low) out.push(low);
  return out.join(" ");
}

const ES_U = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
const ES_T = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const ES_H = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];
/** apoc: "un"/"veintiún" before mil, millón, billón */
function es99(n: number, apoc: boolean): string {
  if (n === 1) return apoc ? "un" : "uno";
  if (n === 21) return apoc ? "veintiún" : "veintiuno";
  if (n < 30) return ES_U[n];
  const u = n % 10;
  const t = ES_T[Math.floor(n / 10)];
  return u ? `${t} y ${u === 1 ? (apoc ? "un" : "uno") : ES_U[u]}` : t;
}
function es999(n: number, apoc: boolean): string {
  if (n === 100) return "cien";
  const h = Math.floor(n / 100);
  const r = n % 100;
  return [h ? ES_H[h] : "", r ? es99(r, apoc) : ""].filter(Boolean).join(" ");
}
function es999999(n: number, apoc: boolean): string {
  const th = Math.floor(n / 1000);
  const r = n % 1000;
  const a = th ? (th === 1 ? "mil" : `${es999(th, true)} mil`) : "";
  return [a, r ? es999(r, apoc) : ""].filter(Boolean).join(" ");
}
function esWords(int: bigint): string {
  if (int === 0n) return "cero";
  const out: string[] = [];
  const bil = Number(int / 10n ** 12n);
  const mil = Number((int % 10n ** 12n) / 10n ** 6n);
  const rest = Number(int % 10n ** 6n);
  if (bil) out.push(bil === 1 ? "un billón" : `${es999999(bil, true)} billones`);
  if (mil) out.push(mil === 1 ? "un millón" : `${es999999(mil, true)} millones`);
  if (rest) out.push(es999999(rest, false));
  return out.join(" ");
}

const DIGIT_WORDS: Partial<Record<Lang, (d: number) => string>> = {
  en: (d) => EN_U[d],
  de: (d) => DE_U[d],
  es: (d) => ES_U[d],
  tr: (d) => (d === 0 ? "sıfır" : TR_U[d]),
};

/** Full words, or null when this language is not covered. */
export function words(p: Parsed, lang: Lang): string | null {
  const fn = { en: enWords, de: deWords, es: esWords, tr: trWords }[lang as "en"];
  if (!fn) return null;
  const minus = { en: "minus", de: "minus", es: "menos", tr: "eksi" }[lang as "en"];
  let w = fn(BigInt(p.int || "0"));
  if (p.frac) w += ` ${POINT[lang]} ${p.frac.split("").map((d) => DIGIT_WORDS[lang]!(Number(d))).join(" ")}`;
  return p.negative ? `${minus} ${w}` : w;
}

// ---------------- place value ----------------

/** Value of each digit position, highest first: "4072" → [{d:"4",place:1000},{d:"0",place:100},…] */
export function placeValues(p: Parsed): { digit: string; pow: number }[] {
  const out: { digit: string; pow: number }[] = [];
  const L = p.int.length;
  p.int.split("").forEach((d, i) => out.push({ digit: d, pow: L - 1 - i }));
  p.frac.split("").forEach((d, i) => out.push({ digit: d, pow: -(i + 1) }));
  return out;
}

/** Rounding ladder for estimation, coarse to fine: nearest billion, 100 million … Only steps that change the number. */
export function roundings(value: number): { to: number; result: number }[] {
  const a = Math.abs(value);
  const out: { to: number; result: number }[] = [];
  for (let k = a >= 10 ? Math.floor(Math.log10(a)) : 0; k >= 1 && out.length < 4; k--) {
    const to = 10 ** k;
    const result = Math.round(value / to) * to;
    if (result !== value && !out.some((o) => o.result === result)) out.push({ to, result });
  }
  // decimals: also to the nearest whole number
  if (!Number.isInteger(value) && out.length < 4) out.push({ to: 1, result: Math.round(value) });
  return out;
}

/** A "nice" axis for the number line: 0 … max (or −max … max), ten ticks. */
export function numberLine(value: number): { min: number; max: number; step: number } {
  const a = Math.abs(value) || 1;
  const pow = 10 ** Math.floor(Math.log10(a));
  const max = [1, 2, 5, 10].map((m) => m * pow).find((m) => m >= a) ?? 10 * pow;
  return value < 0 ? { min: -max, max: 0, step: max / 10 } : { min: 0, max, step: max / 10 };
}

/** Greedy split into a 1-2-5 series of notes and coins (the set most currencies use). */
export const DENOMS = [500, 200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.02, 0.01];
export function moneyBreakdown(amount: number): { denom: number; count: number }[] | null {
  if (!(amount > 0) || amount > 10000) return null;
  let cents = Math.round(amount * 100);
  const out: { denom: number; count: number }[] = [];
  for (const d of DENOMS) {
    const dc = Math.round(d * 100);
    const c = Math.floor(cents / dc);
    if (c) {
      out.push({ denom: d, count: c });
      cents -= c * dc;
    }
  }
  return out;
}

/** Name of a 3-digit group (pow 3 = thousands …), from the same scale table; pow 0 → null. */
export function groupName(pow: number, lang: Lang): string | null {
  if (pow === 0) return null;
  const sc = SCALES[lang].find((x) => x.pow === pow);
  if (sc) return sc.many;
  if (lang === "es" && pow === 9) return "mil millones";
  return null;
}

/** Expanded form terms, zeros skipped: 4072.5 → ["4000", "70", "2", "0.5"] as numbers */
export function expanded(p: Parsed): number[] {
  return placeValues(p)
    .filter((x) => x.digit !== "0")
    .map((x) => Number(`${x.digit}e${x.pow}`));
}

export function intlLocale(lang: Lang) {
  return INTL[lang];
}
