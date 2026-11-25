export default async ({ sw, page, tabId, shot, ctx }) => {
  const set = (s) => sw.evaluate(async (s) => chrome.storage.sync.set({ settings: s }), s);
  const msg = (m) => sw.evaluate(async ([id, m]) => chrome.tabs.sendMessage(id, m), [tabId, m]);
  const panelText = () => page.evaluate(() => document.querySelector("dysc-number-helper").shadowRoot.querySelector(".panel").innerText);
  await msg({ type: "explain", text: "4,072,500,000" });
  await page.waitForTimeout(500);
  await shot("1-budget");
  console.log("PANEL1:", (await panelText()).replace(/\n+/g, " | ").slice(0, 600));
  await msg({ type: "explain", text: "$37.85" });
  await page.waitForTimeout(400);
  await shot("2-money");
  console.log("PANEL2:", (await panelText()).replace(/\n+/g, " | ").slice(0, 600));
  await msg({ type: "explain", text: "0.065" });
  await page.waitForTimeout(300);
  await shot("3-decimal");
  console.log("PANEL3:", (await panelText()).replace(/\n+/g, " | ").slice(0, 400));
  // selection-based explain
  await page.evaluate(() => { const r = document.createRange(); r.selectNodeContents(document.getElementById("pop")); getSelection().removeAllRanges(); getSelection().addRange(r); });
  await msg({ type: "explain" });
  await page.waitForTimeout(300);
  console.log("PANEL4:", (await panelText()).split("\n")[0]);
  await page.keyboard.press("Escape");
  // hover
  await set({ hover: true });
  await page.waitForTimeout(300);
  const box = await page.locator("#budget").boundingBox();
  await page.mouse.move(box.x + 30, box.y + box.height / 2);
  await page.waitForTimeout(150);
  await page.mouse.move(box.x + 34, box.y + box.height / 2);
  await page.waitForTimeout(300);
  await shot("4-hover");
  await page.mouse.dblclick(box.x + 34, box.y + box.height / 2);
  await page.waitForTimeout(300);
  console.log("PANEL5 dblclick:", (await panelText()).split("\n")[0]);
  // German page
  await page.goto("http://localhost:8766/de.html");
  await page.waitForTimeout(500);
  const t2 = await sw.evaluate(async () => (await chrome.tabs.query({})).find(t => t.url?.includes("de.html"))?.id);
  await sw.evaluate(async (id) => chrome.scripting.executeScript({ target: { tabId: id }, files: ["content.js"] }), t2);
  await sw.evaluate(async (id) => chrome.tabs.sendMessage(id, { type: "explain", text: "1.234.567,89" }), t2);
  await page.waitForTimeout(400);
  await shot("5-de");
  console.log("PANEL6 de:", (await panelText()).replace(/\n+/g, " | ").slice(0, 400));
  // popup tabs
  const p = await ctx.newPage();
  await p.setViewportSize({ width: 350, height: 760 });
  const id = sw.url().split("/")[2];
  for (const tab of ["number", "percent", "bill", "unit", "time", "settings"]) {
    await p.goto(`chrome-extension://${id}/popup.html`);
    await p.waitForTimeout(300);
    await p.click(`#tabs button[data-tab=${tab}]`);
    if (tab === "number") await p.fill("#numIn", "2,500,750");
    await p.waitForTimeout(200);
    await p.screenshot({ path: `/tmp/ext-test-dysc/popup-${tab}.png`, fullPage: true });
    const res = await p.evaluate(() => [...document.querySelectorAll("section:not([hidden]) .result")].map(r => r.innerText.replace(/\n/g, " / ")));
    console.log("POPUP", tab, res);
  }
};
