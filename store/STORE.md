# Store listing — Dyscalculia.io Number Helper

Upload: `dist/dyscalculia-extension-chrome-<v>.zip` → Chrome Web Store, Edge Add-ons (same zip; Opera/Brave/Vivaldi install from CWS).
`dist/dyscalculia-extension-firefox-<v>.zip` → addons.mozilla.org (readable, unminified bundle; if source is asked,
upload this repo without node_modules/dist + "npm ci && npm run build").

## Name
Dyscalculia.io Number Helper  (localised in _locales/*/messages.json, 7 languages)

## Summary (≤132)
Understand any number on a web page: place value, number in words, rounding, number line, plus percent, bill and time helpers.

## Category
Chrome: Accessibility (alt: Education) · Edge: Accessibility · Firefox: Accessibility (+ Education)

## Description
See any number on a web page in a way that is easier to take in — without an account and without sending anything anywhere.

EXPLAIN A NUMBER
• Select a number and press Alt+Shift+N (or right-click → Explain this number).
• In parts: 4,072,500,000 → "4 billion 72 million 500 thousand".
• Place value: every digit in a coloured column with its value underneath (1, 10, 100 … 0.1, 0.01).
• Expanded form: 30 + 7 + 0.8 + 0.05.
• In words, with read-aloud (English, German, Spanish and Turkish; the "in parts" view works in all seven languages).
• Rounding steps from coarse to fine, a number line, and — for amounts — a breakdown into notes and coins.
• Understands 1,234.56 and 1.234,56, spaces as thousands separators, currency signs and percentages.

TOOLTIPS (OPTIONAL)
• Turn on "Show tooltips on numbers" and hover over a long number to see it in parts; double-click for the full breakdown.

EVERYDAY MATHS, STEP BY STEP (in the toolbar popup)
• Percent of a number, percent change, discounts.
• Tip and bill splitting.
• Unit price: which pack is better value, per 100 g, 100 ml or per item.
• Time between two clock times (counting up to the next hour, like on paper) and minutes to hours.
• Every answer shows how it was worked out.

LANGUAGES
English, Deutsch, Français, Español, Nederlands, Português (Brasil), Türkçe. Number words and labels follow the page language, or the language you pick.

PRIVACY
No account, no analytics, no tracking. Everything is worked out in your browser; settings are saved in your browser's sync storage. The extension only touches a page when you use it there (popup, menu item or shortcut) — or, if you choose "Keep on for every site", on every page you visit so tooltips work.

Made by Dyscalculia.io — free dyscalculia test, place value chart and maths tools at dyscalculia.io.

## Single purpose (CWS field)
Help people understand numbers on web pages: show a selected number in parts, place value, words, rounding and on a number line, and work out everyday percent, bill, unit-price and time calculations step by step.

## Permission justifications (paste each into its own CWS field)

**activeTab**
Show the number panel on the page the user is on when they open the popup, use the context menu or a shortcut.

**scripting**
Inject the number-helper script into that page.

**storage**
Remember settings (tooltips on/off, number language, voice, speed) and the last popup tab.

**contextMenus**
"Explain this number" on selected text.

**optional host permission <all_urls>**
Requested only if the user turns on "Keep on for every site", so hover tooltips work on every page without opening the popup.

**Remote code**
No. All code is in the package; no network requests.

## Data usage (CWS privacy tab)
Collects nothing. Tick none of the data types. Certify: not sold to third parties, not used for unrelated purposes, not used for creditworthiness/lending.
Privacy policy URL: https://dyscalculia.io/extension#privacy  (section must exist on the landing before submission)

Firefox `data_collection_permissions`: required ["none"] (already in the Firefox manifest).

## Assets
- Icon 128: static/icons/128.png (from the site logo)
- Screenshots 1280×800: store/screenshot-1-place-value.png, -2-number-line-money.png, -3-hover.png, -4-calculators.png, -5-unit-price.png
- Small promo tile 440×280: store/promo-small-440x280.png
- Homepage: https://dyscalculia.io/extension
- Regenerate assets: serve test/page.html on :8766, build, then
  `STORE_DIR=$PWD/store node test/e2e-runner.mjs dist/chrome http://localhost:8766/ store store/make-store-assets.mjs`

## Not claimed
No claim that the extension treats, improves or diagnoses dyscalculia. It is a reading aid for numbers and a step-by-step calculator.


## CWS panel — every field, in panel order
Nothing on this list is optional to check; fields marked (leave empty) really stay empty.

### Package
Upload `dist/dyscalculia-extension-chrome-<version>.zip`.

### Store listing
- Description: "Description" section above (paste as-is).
- Category: Accessibility
- Language: English (other languages come from _locales automatically).
- Store icon: static/icons/128.png
- Screenshots: every store/screenshot-*.png (1280×800), in file-name order.
- Small promo tile: store/promo-small-440x280.png
- Marquee promo tile, promo video: (leave empty)
- Official URL: https://dyscalculia.io (shows only after the domain is verified in Search Console with this same Google account)
- Homepage URL: https://dyscalculia.io/extension
- Support URL: https://dyscalculia.io/extension
- Mature content: No

### Privacy
- Single purpose: "Single purpose" section above.
- Permission justifications: one field per permission, text from "Permission justifications" above.
- Are you using remote code? **No** (justification field: leave empty)
- Data usage — "What user data do you plan to collect?": tick **none** of the 9 boxes
  (personally identifiable, health, financial/payment, authentication, personal communications,
  location, web history, user activity, website content). Reading the open page or camera
  locally is not "collecting": nothing leaves the browser.
- Data usage — tick **all 3** certifications (not sold/transferred, not used for unrelated
  purposes, not used for creditworthiness/lending).
- Privacy policy URL: https://dyscalculia.io/extension#privacy (must be live before "Submit for review")

### Distribution
- Payments: Free (no in-app purchases)
- Visibility: Public
- Regions: All regions

### Test instructions
- Doesn't need one. Select a number on any page and right-click → Explain this number, or open the toolbar popup for the percentage, bill-split, unit-price and time helpers.
- Username / password: (leave empty)

### Account (once per developer account)
- Trader declaration: non-trader (user's decision 2026-11-25)
- Publisher display name: brand name; verify the contact email.


## 1.0.1 update — panel steps (Chrome Web Store)
What changed: store-SEO names + summaries in all 7 languages (from `_locales`), a "Rate it in the store" link in the popup
(only after use on 5 separate days, dismissible for good, no reward), `.DS_Store` excluded from zips, Firefox source zip.
The popup header still shows the short name (`popupTitle`).

1. Wait until 1.0.0 is approved (uploading now restarts the review).
2. Run `npm run build` → `dist/dyscalculia-extension-chrome-1.0.1.zip`.
3. CWS → item → **Package → Upload new package** → that zip. Name and summary update automatically from the zip.
4. **Store listing → language dropdown**: for each language below choose it, paste the description file, save.
   Screenshots/tile can stay the same in every language.

| Listing language | Description file |
|---|---|
| English (United States) | `store/descriptions/en.md` |
| Deutsch | `store/descriptions/de.md` |
| Español | `store/descriptions/es.md` |
| Français | `store/descriptions/fr.md` |
| Nederlands | `store/descriptions/nl.md` |
| Português (Brasil) | `store/descriptions/pt_BR.md` |
| Türkçe | `store/descriptions/tr.md` |

5. **Submit for review.**

### Keyword research behind the names (DataForSEO, Google Ads monthly volume, 2026-11-25)
FR, NL and PT names do not promise number-to-words, because full words are only written out in en/de/es/tr.

| Locale | Name (extName) | Summary (extDesc, ≤132) | Volumes used |
|---|---|---|---|
| en | Dyscalculia.io: Place Value Chart, Number to Words | Explain any number on a page: place value chart, number to words, rounding, number line. Plus percentage, bill split and unit price. | place value chart 40,500 · number to words 14,800 · unit price calculator 2,900 · bill split calculator 1,600 · dyscalculia app 70 |
| de | Dyscalculia.io: Prozentrechner & Zahl in Worten | Zahlen auf Webseiten verstehen: Zahl in Worten, Stellenwerttafel, Zahlenstrahl. Dazu Prozentrechner, Rabatt, Grundpreis, Trinkgeld. | Prozentrechner 246,000 · Rabattrechner 5,400 · Zahl in Worten 2,900 · Stellenwerttafel 5,400 · Zahlenstrahl 6,600 |
| es | Dyscalculia.io: porcentajes y números a letras | Entiende los números de una web: números a letras, valor posicional, recta numérica. Y calcular porcentaje, descuento y propina. | calcular porcentaje 40,500 · números a letras 2,900 · calculadora de descuento 1,900 (name shortened to ≤50 for AMO: "porcentajes") |
| fr | Dyscalculia.io : calcul de pourcentage et remise | Comprendre les nombres d'une page : tableau de numération, arrondi, droite numérique. Calcul de pourcentage, remise, prix unitaire. | calcul pourcentage 74,000 · calcul remise 2,400 · tableau de numération 3,600 (chiffre en lettre 27,100 skipped: not supported in fr) |
| nl | Dyscalculia.io: procent en korting berekenen | Begrijp de getallen op een pagina: plaatswaarde, afronden, getallenlijn. Plus procent berekenen, korting, fooi en prijs per eenheid. | procent berekenen 9,900 · korting berekenen 6,600 · getallenlijn 1,600 (getallen in woorden 40) |
| pt_BR | Dyscalculia.io: calcular porcentagem e números | Entenda os números de uma página: valor posicional, arredondamento, reta numérica. E calcular porcentagem, desconto e dividir conta. | calcular porcentagem 74,000 · calculadora de desconto 2,400 · dividir conta 2,900 (número por extenso 74,000 skipped: not supported in pt) |
| tr | Dyscalculia.io: Yüzde ve İndirim Hesaplama | Sayfadaki sayıları anla: basamak değeri, sayının okunuşu, sayı doğrusu. Yüzde hesaplama, indirim, birim fiyat ve hesap bölme. | yüzde hesaplama 673,000 · indirim hesaplama 40,500 · birim fiyat hesaplama 480 · sayıyı yazıya çevirme 390 |

Store-only searches ("… chrome extension") have almost no Google volume (percentage calculator extension 10,
calculator chrome extension 210), so the names use the plain task words people also type into the store search.

## Microsoft Edge Add-ons (Partner Center) — every field
Open https://partner.microsoft.com/dashboard/microsoftedge → **Create new extension**.

### Packages
- Upload `dist/dyscalculia-extension-chrome-1.0.1.zip` (the Chrome zip; Edge uses it unchanged).

### Availability
- Visibility: **Public**
- Markets: **All markets** (select all)

### Properties
- Category: **Accessibility** (alternative: Productivity)
- Privacy policy required? **Yes** → URL: `https://dyscalculia.io/extension#privacy`
- Website URL: `https://dyscalculia.io/extension`
- Support contact details: `https://dyscalculia.io/extension`
- Mature content: **No** (Edge has no age-rating questionnaire; this checkbox is the only content rating)

### Store listings (add every language below; Edge has a listing per language)
Same assets in every language:
- Extension store logo (300×300): `store/edge-logo-300x300.png` (the site logo)
- Small promotional tile (440×280): `store/promo-small-440x280.png`
- Screenshots (1280×800): `store/screenshot-1…5-*.png`
- Large promotional tile, YouTube video: leave empty

#### English (United States)
- Description (≥250 chars): `store/descriptions/en.md` (paste all)
- Short description: Explain any number on a page: place value chart, number to words, rounding, number line. Plus percentage, bill split and unit price.
- Search terms (7, ≤30 chars each, ≤21 words): `place value chart` · `number to words` · `percentage calculator` · `unit price calculator` · `bill split calculator` · `dyscalculia` · `number line`

#### Deutsch
- Description (≥250 chars): `store/descriptions/de.md` (paste all)
- Short description: Zahlen auf Webseiten verstehen: Zahl in Worten, Stellenwerttafel, Zahlenstrahl. Dazu Prozentrechner, Rabatt, Grundpreis, Trinkgeld.
- Search terms (7, ≤30 chars each, ≤21 words): `Prozentrechner` · `Zahl in Worten` · `Rabattrechner` · `Stellenwerttafel` · `Zahlenstrahl` · `Dyskalkulie` · `Grundpreis Rechner`

#### Español
- Description (≥250 chars): `store/descriptions/es.md` (paste all)
- Short description: Entiende los números de una web: números a letras, valor posicional, recta numérica. Y calcular porcentaje, descuento y propina.
- Search terms (7, ≤30 chars each, ≤21 words): `calcular porcentaje` · `números a letras` · `calculadora de descuento` · `valor posicional` · `recta numérica` · `discalculia` · `dividir la cuenta`

#### Français
- Description (≥250 chars): `store/descriptions/fr.md` (paste all)
- Short description: Comprendre les nombres d'une page : tableau de numération, arrondi, droite numérique. Calcul de pourcentage, remise, prix unitaire.
- Search terms (7, ≤30 chars each, ≤21 words): `calcul pourcentage` · `calcul remise` · `tableau de numération` · `droite numérique` · `dyscalculie` · `prix unitaire` · `pourboire`

#### Nederlands
- Description (≥250 chars): `store/descriptions/nl.md` (paste all)
- Short description: Begrijp de getallen op een pagina: plaatswaarde, afronden, getallenlijn. Plus procent berekenen, korting, fooi en prijs per eenheid.
- Search terms (7, ≤30 chars each, ≤21 words): `procent berekenen` · `korting berekenen` · `getallenlijn` · `plaatswaarde` · `dyscalculie` · `prijs per eenheid` · `fooi berekenen`

#### Português (Brasil)
- Description (≥250 chars): `store/descriptions/pt_BR.md` (paste all)
- Short description: Entenda os números de uma página: valor posicional, arredondamento, reta numérica. E calcular porcentagem, desconto e dividir conta.
- Search terms (7, ≤30 chars each, ≤21 words): `calcular porcentagem` · `calculadora de desconto` · `dividir conta` · `valor posicional` · `reta numérica` · `discalculia` · `preço por unidade`

#### Türkçe
- Description (≥250 chars): `store/descriptions/tr.md` (paste all)
- Short description: Sayfadaki sayıları anla: basamak değeri, sayının okunuşu, sayı doğrusu. Yüzde hesaplama, indirim, birim fiyat ve hesap bölme.
- Search terms (7, ≤30 chars each, ≤21 words): `yüzde hesaplama` · `indirim hesaplama` · `birim fiyat hesaplama` · `sayıyı yazıya çevirme` · `basamak değeri` · `diskalkuli` · `sayı doğrusu`

### Submission
- Notes for certification:
  `No account or login needed. Select any number on a web page and right-click → "Explain this number" (or Alt+Shift+N); the toolbar popup has percentage, bill, unit-price and time helpers. All calculations run locally; the extension makes no network requests and collects no data. Optional host permission <all_urls> is requested only if the user turns on "Keep on for every site" for hover tooltips. Source: https://github.com/Dyscalculia-io/dyscalculia-extension (MIT).`
- **Publish**. Review takes up to 7 business days.

## Firefox Add-ons (AMO) — every field
Open https://addons.mozilla.org/developers/addon/submit/ → **On this site** (listed).

### Upload
- File: `dist/dyscalculia-extension-firefox-1.0.1.zip`
- Compatible with: **Firefox** and **Firefox for Android** (both ticked)
- "Do you need to submit source code?" → **Yes** → upload `dist/dyscalculia-extension-source-1.0.1.zip`
  (the bundles are readable esbuild output, but esbuild counts as a build tool for AMO).

### Describe add-on
- Name and summary: imported from the zip's `_locales` in all 7 languages (keep; every name is ≤50 chars, the AMO limit).
- Add-on URL: `dyscalculia-number-helper`
- Summary (≤250; English, extend the imported one):
  `Explain any number on a web page: place value chart, number to words, rounding and number line. Plus step-by-step percentage, discount, tip, bill split, unit price and time helpers. Free, no account, no data collected.`
- Description: `store/descriptions/en.md`. Other languages: after submission, **Edit Product Page → language dropdown** →
  paste `store/descriptions/<locale>.md` for de, es, fr, nl, pt_BR (Português do Brasil), tr.
- This add-on is experimental: **No** · Requires payment: **No**
- Firefox categories (up to 2): **Shopping** (prices, discounts, unit price) + **Other**
- Firefox for Android categories: **Shopping** + **Other**
- Tags (AMO offers a fixed list; pick the ones present): `accessibility`, `shopping`, `utility`
- Support email: leave empty · Support website: `https://dyscalculia.io/extension`
- Homepage: `https://dyscalculia.io/extension`
- License: **MIT License**
- Privacy policy: tick "This add-on has a privacy policy" and paste:
  `Dyscalculia.io Number Helper collects no personal data: no account, no analytics, no tracking, no network requests. Settings are kept in the browser's own storage and are deleted when the add-on is removed. Full policy: https://dyscalculia.io/extension#privacy`

### Notes to reviewer
```
No login needed. Test: open any page with numbers (e.g. a Wikipedia article), select a number, right-click →
"Explain this number" (or Alt+Shift+N). The toolbar popup has percentage, bill, unit-price and time tabs.

Build: the bundles are unminified esbuild output (IIFE). Source zip attached; it is the same as the public repo
https://github.com/Dyscalculia-io/dyscalculia-extension (MIT).
Reproduce: Node 22, `npm ci && npm run build` → dist/firefox (identical files) and the zip.
No remote code, no network requests, no data collection (data_collection_permissions: none).
```
- **Submit Version**. Listed review usually takes hours to a few days.

