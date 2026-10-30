// Builds dist/index.html: one self-contained page with the stylesheet, the app and every year of validated data
// inlined. It works from a file, on GitHub Pages, or as a published artifact.
//   npm run build            one build
//   npm run dev              rebuild on every change to src/ or data/
import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { DATA_DIR, listYears, loadYear } from "../src/data/load.ts";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "dist/index.html");
const watch = process.argv.includes("--watch");

/** Serializes the data as a JS expression (JSON can't hold Infinity, used for the open-ended top bracket). */
function yearsModule(): string {
  const years = Object.fromEntries(listYears().map(y => [y, loadYear(y)]));
  const json = JSON.stringify(years, (_k, v) => (v === Infinity ? "__INF__" : v));
  return `export default ${json.replaceAll('"__INF__"', "Infinity")};`;
}

const virtualYears: esbuild.Plugin = {
  name: "virtual-years",
  setup(b) {
    b.onResolve({ filter: /^virtual:years$/ }, () => ({ path: "years", namespace: "virtual" }));
    b.onLoad({ filter: /.*/, namespace: "virtual" }, () => ({ contents: yearsModule(), loader: "js" }));
  },
};

async function bundle(): Promise<string> {
  const res = await esbuild.build({
    entryPoints: [path.join(root, "src/ui/app.js")],
    bundle: true,
    format: "iife",
    target: "es2020",
    minify: !watch,
    write: false,
    plugins: [virtualYears],
    logLevel: "warning",
  });
  return res.outputFiles[0].text;
}

async function build() {
  const t0 = Date.now();
  const js = (await bundle()).replaceAll("</script", "<\\/script");
  const css = fs.readFileSync(path.join(root, "src/ui/styles.css"), "utf8");
  const year = String(Math.max(...listYears()));
  const html = fs
    .readFileSync(path.join(root, "src/ui/index.html"), "utf8")
    .replace("{{YEAR}}", year)
    .replace("/*{{CSS}}*/", () => css)
    .replace("/*{{JS}}*/", () => js);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log(`dist/index.html  ${(html.length / 1024).toFixed(0)} KB  (${Date.now() - t0} ms)`);
}

await build();
if (watch) {
  let timer: NodeJS.Timeout | undefined;
  const again = () => {
    clearTimeout(timer);
    timer = setTimeout(() => build().catch(e => console.error(e.message)), 100);
  };
  for (const dir of [path.join(root, "src"), DATA_DIR]) fs.watch(dir, { recursive: true }, again);
  console.log("watching src/ and data/ …");
}
