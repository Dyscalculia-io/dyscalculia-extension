import { api, loadSettings, saveSettings, type Msg } from "./settings";

const SITE = "https://dyscalculia.io";
const CS_ID = "number-helper-all-sites";

api.runtime.onInstalled.addListener(async (details) => {
  api.contextMenus.removeAll(() => {
    api.contextMenus.create({ id: "explain", title: api.i18n.getMessage("menuExplain"), contexts: ["selection"] });
  });
  if (details.reason === "install") {
    api.tabs.create({ url: `${SITE}/extension?installed=1&utm_source=extension&utm_medium=install` });
  }
  api.runtime.setUninstallURL(`${SITE}/extension?uninstalled=1&utm_source=extension&utm_medium=uninstall`);
  await syncAllSites();
});

api.runtime.onStartup?.addListener(() => void syncAllSites());
api.permissions.onAdded.addListener(() => void syncAllSites());
api.permissions.onRemoved.addListener(() => void syncAllSites());

/** "Keep on for every site": registered only while the user has granted <all_urls>. */
async function syncAllSites() {
  const has = await api.permissions.contains({ origins: ["<all_urls>"] });
  const existing = await api.scripting.getRegisteredContentScripts({ ids: [CS_ID] }).catch(() => []);
  if (has && existing.length === 0) {
    await api.scripting.registerContentScripts([
      { id: CS_ID, matches: ["<all_urls>"], js: ["content.js"], runAt: "document_idle", allFrames: false },
    ]);
  } else if (!has && existing.length > 0) {
    await api.scripting.unregisterContentScripts({ ids: [CS_ID] });
  }
}

async function send(tabId: number, msg: Msg) {
  try {
    await api.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
    await api.tabs.sendMessage(tabId, msg);
  } catch {
    /* chrome:// pages, the store, PDFs */
  }
}

api.contextMenus.onClicked.addListener((info, tab) => {
  if (tab?.id && info.menuItemId === "explain") void send(tab.id, { type: "explain", text: info.selectionText ?? "" });
});

api.commands.onCommand.addListener(async (command, tab) => {
  const t = tab ?? (await api.tabs.query({ active: true, currentWindow: true }))[0];
  if (!t?.id) return;
  if (command === "explain-number") void send(t.id, { type: "explain" });
  if (command === "toggle-hover") {
    const s = await loadSettings();
    await saveSettings({ hover: !s.hover, enabled: true });
    void send(t.id, { type: "ping" });
  }
});
