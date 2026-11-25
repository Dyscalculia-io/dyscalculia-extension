// Known values per language. Run: npm test (bundles src/numbers.ts with esbuild first).
import { build } from "esbuild";
import assert from "node:assert/strict";
const out = "/tmp/dysc-numbers-test.mjs";
await build({ entryPoints: ["src/numbers.ts"], bundle: true, format: "esm", outfile: out, logLevel: "silent" });
const N = await import(out + "?" + Date.now());
const w = (txt, lang) => N.words(N.parseNumber(txt, lang), lang);
const P = (txt, lang) => N.partsText(N.parseNumber(txt, lang), lang);
const cases = [
  // separators
  [() => N.parseNumber("1,234,567.89", "en").value, 1234567.89],
  [() => N.parseNumber("1.234.567,89", "de").value, 1234567.89],
  [() => N.parseNumber("1.234", "de").value, 1234],
  [() => N.parseNumber("1.234", "en").value, 1.234],
  [() => N.parseNumber("1,5", "en").value, 1.5],
  [() => N.parseNumber("12 500 €", "fr").value, 12500],
  [() => N.parseNumber("12 500 €", "fr").currency, "€"],
  [() => N.parseNumber("$1,299.99", "en").currency, "$"],
  [() => N.parseNumber("45%", "en").percent, true],
  [() => N.parseNumber("-3.5", "en").value, -3.5],
  // en
  [() => w("1234567", "en"), "one million two hundred thirty-four thousand five hundred sixty-seven"],
  [() => w("1000000", "en"), "one million"],
  [() => w("105", "en"), "one hundred five"],
  [() => w("2.05", "en"), "two point zero five"],
  [() => w("0", "en"), "zero"],
  // tr
  [() => w("1234", "tr"), "bin iki yüz otuz dört"],
  [() => w("1100", "tr"), "bin yüz"],
  [() => w("1000000", "tr"), "bir milyon"],
  [() => w("2001", "tr"), "iki bin bir"],
  [() => w("3.250.000", "tr"), "üç milyon iki yüz elli bin"],
  // de
  [() => w("1234567", "de"), "eine Million zweihundertvierunddreißigtausendfünfhundertsiebenundsechzig"],
  [() => w("101", "de"), "einhunderteins"],
  [() => w("21000", "de"), "einundzwanzigtausend"],
  [() => w("2000000", "de"), "zwei Millionen"],
  [() => w("1001", "de"), "eintausendeins"],
  [() => w("17", "de"), "siebzehn"],
  // es
  [() => w("100", "es"), "cien"],
  [() => w("101", "es"), "ciento uno"],
  [() => w("21000", "es"), "veintiún mil"],
  [() => w("1500000000", "es"), "mil quinientos millones"],
  [() => w("200100", "es"), "doscientos mil cien"],
  [() => w("1000000", "es"), "un millón"],
  [() => w("31", "es"), "treinta y uno"],
  // parts
  [() => P("1234567", "en"), "1 million 234 thousand 567"],
  [() => P("1.500.000.000", "es"), "1500 millones"], // es-ES does not group 4-digit numbers,
  [() => P("2.500.000", "de"), "2 Millionen 500 Tausend"],
  [() => P("3,25", "fr"), "3 virgule 2 5"],
  // money
  [() => JSON.stringify(N.moneyBreakdown(37.85)), JSON.stringify([{ denom: 20, count: 1 }, { denom: 10, count: 1 }, { denom: 5, count: 1 }, { denom: 2, count: 1 }, { denom: 0.5, count: 1 }, { denom: 0.2, count: 1 }, { denom: 0.1, count: 1 }, { denom: 0.05, count: 1 }])],
  [() => JSON.stringify(N.roundings(4072500000).map((r) => r.result)), JSON.stringify([4000000000, 4100000000, 4070000000, 4073000000])],
  [() => N.fmtMoney(0.5, "en"), "0.50"],
  [() => JSON.stringify(N.numberLine(1234567)), JSON.stringify({ min: 0, max: 2000000, step: 200000 })],
];
let fail = 0;
for (const [fn, want] of cases) {
  try {
    assert.equal(fn(), want);
  } catch (e) {
    fail++;
    console.log("FAIL", fn.toString(), "\n  got ", e.actual, "\n  want", want);
  }
}
console.log(`${cases.length - fail}/${cases.length} passed`);
process.exit(fail ? 1 : 0);
