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

## Permission justifications
- activeTab: show the number panel on the page the user is on when they open the popup, use the context menu or a shortcut.
- scripting: inject the number-helper script into that page.
- storage: remember settings (tooltips on/off, number language, voice, speed) and the last popup tab.
- contextMenus: "Explain this number" on selected text.
- optional host permission <all_urls>: requested only if the user turns on "Keep on for every site", so hover tooltips work on every page without opening the popup.
- Remote code: No. All code is in the package; no network requests.

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
