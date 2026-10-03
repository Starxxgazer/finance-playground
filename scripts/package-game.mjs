// Produce a file://-compatible launcher. Art stays in public/; fonts are inlined
// because Chromium restricts font requests between local file origins.
import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { resolve, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { evidence } from "../src/game/content.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");
let html = await readFile(resolve(dist, "index.html"), "utf8");
const scriptTags = [
  ...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g),
];
if (scriptTags.length !== 1)
  throw new Error("Expected exactly one bundled game script.");
const scriptPath = resolve(dist, scriptTags[0][1]);
if (!scriptPath.startsWith(dist + sep))
  throw new Error("Script outside the build directory.");
let js = await readFile(scriptPath, "utf8");
if (/\bimport\s*(?:\(|["'{*])|\bexport\s*(?:\{|default)/.test(js)) {
  throw new Error(
    "Split JavaScript chunks are not supported by the offline launcher.",
  );
}
js = js.replace(/<\/script/gi, "<\\/script");
html = html.replace(
  scriptTags[0][0],
  () =>
    `<script>window.__GAME_ASSET_BASE__='./public/';</script>\n<script type="module">${js}</script>`,
);
for (const match of [
  ...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g),
]) {
  const cssPath = resolve(dist, match[1]);
  let css = await readFile(cssPath, "utf8");
  const urls = [...css.matchAll(/url\(([^)]+)\)/g)];
  for (const url of urls) {
    const source = url[1].replace(/^["']|["']$/g, "");
    if (source.startsWith("data:")) continue;
    const file = resolve(dirname(cssPath), source);
    if (
      !file.startsWith(resolve(dist, "fonts") + sep) ||
      !file.endsWith(".woff2")
    ) {
      throw new Error(`Unexpected CSS resource: ${source}`);
    }
    const font = await readFile(file);
    css = css.replace(
      url[0],
      `url(data:font/woff2;base64,${font.toString("base64")})`,
    );
  }
  html = html.replace(
    match[0],
    () => `<style>${css.replace(/<\/style/gi, "<\\/style")}</style>`,
  );
}
html = html.replaceAll("./scenes/", "./public/scenes/");
const markup = html
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
  .replace(/<style>[\s\S]*?<\/style>/gi, "");
if (
  markup.includes('rel="modulepreload"') ||
  /<script[^>]+src=/.test(markup) ||
  /rel="stylesheet"/.test(markup)
) {
  throw new Error("External scripts/styles remain in the offline launcher.");
}
// Keep the source asset directory limited to runtime resources and font notices.
async function checkAssets(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = resolve(dir, entry.name);
    if (entry.isDirectory()) await checkAssets(p);
    else {
      const name = relative(resolve(root, "public"), p).split(sep).join("/");
      if (
        !/^(scenes|characters|items|ui)\/[a-z0-9-]+\.webp$/.test(name) &&
        !/^fonts\/ui\/[\w.-]+\.(woff2|txt)$/.test(name)
      ) {
        throw new Error(`Non-runtime file in public/: ${name}`);
      }
      if (!(await stat(p)).size) throw new Error(`Empty asset: ${name}`);
    }
  }
}
await checkAssets(resolve(root, "public"));
const itemFiles = (await readdir(resolve(root, "public/items"))).sort();
const expectedItems = evidence.map(({ id }) => `${id}.webp`).sort();
if (JSON.stringify(itemFiles) !== JSON.stringify(expectedItems)) {
  throw new Error(
    "Every document must have exactly one generated inventory image.",
  );
}
const uiFiles = (await readdir(resolve(root, "public/ui"))).sort();
const expectedUi = [
  "brass-tab.webp",
  "document-paper.webp",
  "field-case.webp",
  "item-pocket.webp",
  "notebook-fiber.webp",
  "satchel.webp",
];
if (JSON.stringify(uiFiles) !== JSON.stringify(expectedUi)) {
  throw new Error("The offline game must include the complete UI material set.");
}
await writeFile(resolve(root, "开始游戏.html"), html);
console.log("已生成 开始游戏.html：双击即可游玩，无需 Node.js 或本地服务器。");
