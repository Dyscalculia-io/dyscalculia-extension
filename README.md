# Dyscalculia.io Number Helper (browser extension)

Manifest V3, no remote code, no network requests, no analytics. One build → Chrome/Edge/Opera/Brave zip + Firefox zip.

    npm ci
    npm run check          # tsc + build + unit tests + web-ext lint
    # e2e (Playwright Chromium; needs `npx playwright install chromium` once):
    #   serve test/ on :8766 (page.html → index.html, page-de.html → de.html),
    #   then node test/e2e-runner.mjs dist/chrome http://localhost:8766/ dysc test/e2e-steps.mjs

src/numbers.ts    parsing (1,234.5 / 1.234,5 / currency / %), "in parts" for 7 languages, full words en/de/es/tr,
                  place values, expanded form, rounding ladder, number line axis, notes-and-coins split — pure, unit-tested
src/content.ts    number panel + opt-in hover tooltips (shadow DOM); labels follow the number language (bundled _locales)
src/background.ts context menu, shortcuts (Alt+Shift+N explain, Alt+Shift+H tooltips), "every site" registration
src/popup.ts      Number / % / Bill / Unit price / Time / Settings tabs; writes storage, content script follows storage.onChanged
test/             numbers.test.mjs (known values per language), Playwright e2e harness + test pages
store/            STORE.md (listing, permissions, privacy answers), screenshots, promo tile, make-store-assets.mjs

Words for fr/nl/pt are not written out (the panel says so); add a converter + test cases in test/numbers.test.mjs before enabling.
