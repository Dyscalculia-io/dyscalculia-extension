// Build: esbuild bundles src/*.ts, static/ is copied, then one folder + zip per browser.
// Chrome zip also goes to Edge and Opera; Firefox gets its own manifest (background.scripts + gecko id).
import { build } from "esbuild";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, copyFileSync } from "node:fs";
import { execSync } from "node:child_process";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const base = JSON.parse(readFileSync("static/manifest.json", "utf8"));
base.version = pkg.version;

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist/tmp", { recursive: true });

await build({
  entryPoints: { background: "src/background.ts", content: "src/content.ts", popup: "src/popup.ts" },
  bundle: true,
  minify: false, // readable bundles: AMO asks for source otherwise, CWS reviews faster
  format: "iife",
  target: ["chrome110", "firefox115"],
  outdir: "dist/tmp",
  legalComments: "eof",
});

function out(target, manifest) {
  const dir = `dist/${target}`;
  cpSync("static", dir, { recursive: true });
  for (const f of ["background.js", "content.js", "popup.js"]) copyFileSync(`dist/tmp/${f}`, `${dir}/${f}`);
  writeFileSync(`${dir}/manifest.json`, JSON.stringify(manifest, null, 2));
  execSync(`cd ${dir} && zip -qr ../${pkg.name}-${target}-${pkg.version}.zip . -x "*.DS_Store" -x "__MACOSX/*"`);
}

out("chrome", base);

const ff = structuredClone(base);
ff.background = { scripts: ["background.js"] };
ff.browser_specific_settings = {
  gecko: { id: "number-helper@dyscalculia.io", strict_min_version: "140.0", data_collection_permissions: { required: ["none"] } },
  gecko_android: { strict_min_version: "142.0" },
};
out("firefox", ff);
rmSync("dist/tmp", { recursive: true, force: true });

// Source zip for Firefox AMO review: everything needed for `npm ci && npm run build` to reproduce the zips.
execSync(
  `zip -qr dist/${pkg.name}-source-${pkg.version}.zip build.mjs package.json package-lock.json tsconfig.json src static LICENSE README.md -x "*.DS_Store"`,
);
console.log("built", pkg.version, "→ dist/chrome, dist/firefox + zips");
