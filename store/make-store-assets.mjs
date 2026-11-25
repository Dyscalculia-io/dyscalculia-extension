export default async ({ sw, page, tabId, ctx }) => {
  const out = process.env.STORE_DIR;
  const set = (s) => sw.evaluate(async (s) => chrome.storage.sync.set({ settings: s }), s);
  const msg = (m) => sw.evaluate(async ([id, m]) => chrome.tabs.sendMessage(id, m), [tabId, m]);
  await msg({ type: "explain", text: "4,072,500,000" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/screenshot-1-place-value.png` });
  await msg({ type: "explain", text: "$37.85" });
  await page.waitForTimeout(400);
  await page.evaluate(() => { const p = document.querySelector("dysc-number-helper").shadowRoot.querySelector(".panel"); p.style.maxHeight = "768px"; const secs = p.querySelectorAll("section"); p.scrollTop = secs[1].offsetTop - p.querySelector(".head").offsetHeight; });
  await page.screenshot({ path: `${out}/screenshot-2-number-line-money.png` });
  await page.keyboard.press("Escape");
  await set({ hover: true });
  await page.waitForTimeout(300);
  const box = await page.locator("#budget").boundingBox();
  await page.mouse.move(box.x + 30, box.y + box.height / 2);
  await page.waitForTimeout(150);
  await page.mouse.move(box.x + 34, box.y + box.height / 2);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/screenshot-3-hover.png` });
  await set({ hover: false });
  // popup tabs
  const p = await ctx.newPage();
  await p.setViewportSize({ width: 350, height: 600 });
  const id = sw.url().split("/")[2];
  const shots = [];
  for (const tab of ["number", "percent", "unit", "time"]) {
    await p.goto(`chrome-extension://${id}/popup.html`);
    await p.waitForTimeout(300);
    await p.evaluate(() => (document.getElementById("notice").hidden = true));
    await p.click(`#tabs button[data-tab=${tab}]`);
    if (tab === "number") await p.fill("#numIn", "2,500,750");
    await p.waitForTimeout(200);
    const file = `/tmp/dysc-store-popup-${tab}.png`;
    await p.screenshot({ path: file, clip: { x: 0, y: 0, width: 350, height: await p.evaluate(() => Math.min(600, document.body.scrollHeight)) } });
    shots.push(file);
  }
  const comp = await ctx.newPage();
  await comp.setViewportSize({ width: 1280, height: 800 });
  const img = (f) => `<img style="width:315px;display:block" src="data:image/png;base64,${require_b64(f)}">`;
  function require_b64(f) { return globalThis.__b64[f]; }
  globalThis.__b64 = Object.fromEntries(await Promise.all(shots.map(async (f) => [f, (await import("node:fs")).readFileSync(f).toString("base64")])));
  const html = (title, sub, files) => `<!doctype html><html><body style="margin:0;width:1280px;height:800px;background:linear-gradient(135deg,#eceafe,#fafaff);font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;color:#14132b;overflow:hidden">
    <div style="padding:38px 56px 0"><div style="font-size:15px;letter-spacing:.08em;color:#4f46e5;font-weight:700">DYSCALCULIA.IO NUMBER HELPER</div>
    <div style="font-size:36px;font-weight:800;margin:6px 0 4px">${title}</div><div style="font-size:18px;color:#45446a">${sub}</div></div>
    <div style="display:flex;gap:36px;justify-content:center;align-items:flex-start;margin-top:34px">${files.map((f) => `<div style="border-radius:16px;overflow:hidden;box-shadow:0 18px 50px rgba(20,19,43,.22);background:#fff">${img(f)}</div>`).join("")}</div></body></html>`;
  await comp.setContent(html("Everyday maths, step by step", "Percent, discounts, tips and bill splitting — every answer shows how it was worked out.", shots.slice(0, 2).concat(shots.slice(3, 4))));
  await comp.waitForTimeout(300);
  await comp.screenshot({ path: `${out}/screenshot-4-calculators.png` });
  await comp.setContent(html("Which pack is better value?", "Unit prices per 100 g, 100 ml or per item, and any number in parts and in words.", [shots[2], shots[0]]));
  await comp.waitForTimeout(300);
  await comp.screenshot({ path: `${out}/screenshot-5-unit-price.png` });
  // promo tile
  await comp.setViewportSize({ width: 440, height: 280 });
  await comp.setContent(`<!doctype html><html><body style="margin:0">
<div style="width:440px;height:280px;background:linear-gradient(135deg,#4f46e5,#6d5ef5);color:#fff;font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;display:flex;flex-direction:column;justify-content:center;padding:0 34px;box-sizing:border-box;position:relative;overflow:hidden">
<div style="font-size:15px;opacity:.85;letter-spacing:.08em">DYSCALCULIA.IO</div>
<div style="font-size:34px;font-weight:800;line-height:1.15;margin:6px 0 14px">Number Helper</div>
<div style="display:flex;gap:5px;margin-bottom:14px">${[["4","#db2777"],["0","#16a34a"],["7","#16a34a"],["2","#16a34a"],["5","#d97706"],["0","#d97706"],["0","#d97706"]].map(([d,c],i)=>`<div style="width:34px;height:42px;border-radius:9px;background:#fff;color:${c};font-weight:800;font-size:26px;display:grid;place-items:center;${i===1||i===4?"margin-left:8px":""}">${d}</div>`).join("")}</div>
<div style="font-size:15px;letter-spacing:.03em">Place value · In words · % · Unit price · Time</div>
</div></body></html>`);
  await comp.screenshot({ path: `${out}/promo-small-440x280.png` });
};
