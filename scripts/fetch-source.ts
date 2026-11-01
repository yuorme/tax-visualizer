// Downloads one official publication and caches a readable text extract of it, so a data collector and the reviewer
// after them check figures against the same text, and a reviewer who can't read PDFs still can.
//   npm run fetch-source -- <year> <url> [<name>]          writes docs/verification/<year>/sources/<name>.txt
//   npm run fetch-source -- <year> <url> <name> --force    replaces an extract that already exists
//   npm run fetch-source -- <year> <url> <name> --pages 3-7,12    keeps only those PDF pages
//   npm run fetch-source -- <year> <url> <name> --title "T4114 Canada Child Benefit"    sets the index title
//
// The name defaults to the last part of the URL without its extension (t4114-25e.pdf gives t4114-25e). The script
// also adds or replaces the name's row in docs/verification/<year>/sources/INDEX.md: title, URL, date fetched and
// the SHA-256 of the original file, so anyone can download it again and confirm it hasn't changed. (Web pages embed
// per-request tracking code, so their hash changes on every fetch; compare the text instead.) It refuses to replace
// an existing extract without --force, and checks that before downloading anything.
//
// - PDFs go through unpdf (PDF.js, pure JavaScript) page by page; each page starts with a `--- PDF page N of M ---`
//   line. PDF page numbers count from the first sheet of the file, not the numbers printed on the pages.
// - HTML keeps only the page's <main> element (or <body>), without scripts, forms, navigation and the "Page details"
//   footer; headings become `#` lines, list items `- ` lines and table rows `cell | cell` lines.
// - Plain text is kept as it is.
//
// The original file is never written to the repo, only the text. An extract over MAX_KB kilobytes is refused: for
// a large PDF, pass --pages with the pages the data relies on. The extracts live under docs/ and are never imported
// by src/, so the build doesn't bundle them.
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { extractText, getDocumentProxy, getMeta } from "unpdf";

/** The largest extract the script writes, in kilobytes of UTF-8 text. */
export const MAX_KB = 250;
const ROOT = path.join(import.meta.dirname, "..");
const NAME = /^[a-z0-9][a-z0-9._-]*$/;

export interface Extract {
  title: string;
  /** The publication's own last-modified date, when it states one (YYYY-MM-DD). */
  modified?: string;
  /** For a PDF, which pages were kept, and how many the file has. */
  pages?: { kept: number[]; total: number };
  text: string;
}

// ---------------------------------------------------------------------------------------------------------------
// HTML.

const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "wbr"]);
/** Elements dropped with everything inside them. */
const DROP = new Set([
  "script",
  "style",
  "noscript",
  "template",
  "svg",
  "canvas",
  "iframe",
  "object",
  "form",
  "button",
  "select",
  "nav",
]);
/** Classes that mark a dropped element: canada.ca's "Page details" footer (feedback widget, date modified). */
const DROP_CLASS = /\bpagedetails\b/;
/** Elements that start a paragraph: a blank line before and after. */
const PARAGRAPH = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "dl",
  "table",
  "blockquote",
  "pre",
  "figure",
  "details",
  "section",
  "article",
  "aside",
  "header",
  "footer",
]);
/** Elements that start a new line. */
const LINE = new Set([
  "br",
  "div",
  "li",
  "dt",
  "dd",
  "tr",
  "caption",
  "summary",
  "figcaption",
  "hr",
  "main",
  "address",
]);

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  laquo: "«",
  raquo: "»",
  hellip: "…",
  bull: "•",
  middot: "·",
  times: "×",
  divide: "÷",
  minus: "−",
  deg: "°",
  copy: "©",
  reg: "®",
  trade: "™",
  sect: "§",
  frac12: "½",
  frac14: "¼",
  frac34: "¾",
  sup1: "¹",
  sup2: "²",
  sup3: "³",
  shy: "",
  agrave: "à",
  acirc: "â",
  ccedil: "ç",
  eacute: "é",
  egrave: "è",
  ecirc: "ê",
  euml: "ë",
  icirc: "î",
  iuml: "ï",
  ocirc: "ô",
  ugrave: "ù",
  ucirc: "û",
  Eacute: "É",
  Agrave: "À",
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (whole, ref: string) => {
    if (ref[0] === "#") {
      const code = ref[1] === "x" || ref[1] === "X" ? Number.parseInt(ref.slice(2), 16) : Number(ref.slice(1));
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return ENTITIES[ref] ?? whole;
  });
}

/** Turns spaces that never break (no-break, narrow no-break, thin) into plain ones, so searches for "$1,000" work. */
const plainSpaces = (s: string) => s.replace(/[\u00a0\u2007\u2009\u202f]/g, " ");

const attr = (attrs: string, name: string) =>
  attrs
    .match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"))
    ?.slice(1)
    .find(v => v !== undefined);

/** The text of the first element with this tag name, with tags stripped. */
const firstText = (html: string, tag: string) => {
  const m = html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m
    ? plainSpaces(decodeEntities(m[1].replace(/<[^>]*>/g, " ")))
        .replace(/\s+/g, " ")
        .trim()
    : "";
};

/** The page's main content as plain text: see the header comment for what is kept. */
export function htmlToText(html: string): string {
  const mainStart = html.search(/<main\b/i);
  const mainEnd = html.lastIndexOf("</main>");
  const bodyStart = html.search(/<body\b/i);
  const content =
    mainStart >= 0 && mainEnd > mainStart
      ? html.slice(mainStart, mainEnd)
      : bodyStart >= 0
        ? html.slice(bodyStart)
        : html;

  let out = "";
  // Line breaks wait until the next text, so `</tr><tr>` or `</p><p>` give one break, not two.
  let breaks = 0;
  const brk = (n: number) => {
    breaks = Math.max(breaks, n);
  };
  const emit = (s: string) => {
    out += "\n".repeat(breaks) + s;
    breaks = 0;
  };
  let skip: { tag: string; depth: number } | null = null;
  let inCell = false;
  let cells = 0;
  const token =
    /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<(\/?)([a-z][a-z0-9-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>|<|[^<]+/gi;
  for (const m of content.matchAll(token)) {
    const [whole, close, rawTag, attrs = ""] = m;
    if (!rawTag) {
      if (skip || whole.startsWith("<!")) continue;
      const text = plainSpaces(decodeEntities(whole)).replace(/\s+/g, " ");
      if (text.trim()) emit(text);
      else if (!breaks) out += " ";
      continue;
    }
    const tag = rawTag.toLowerCase();
    const selfClosing = VOID.has(tag) || attrs.trimEnd().endsWith("/");
    if (skip) {
      if (tag === skip.tag && !selfClosing) skip.depth += close ? -1 : 1;
      if (skip.depth === 0) skip = null;
      continue;
    }
    if (!close && !selfClosing) {
      const bare = attrs.replace(/"[^"]*"|'[^']*'/g, '""'); // attribute names only, so class="hidden" doesn't count
      const hidden = /(^|\s)hidden(\s|=|\/|$)/i.test(bare) || attr(attrs, "aria-hidden") === "true";
      if (DROP.has(tag) || hidden || DROP_CLASS.test(attr(attrs, "class") ?? "")) {
        skip = { tag, depth: 1 };
        continue;
      }
    }
    if (tag === "td" || tag === "th") {
      if (close) inCell = false;
      else {
        if (cells++ > 0) emit(" | ");
        inCell = true;
      }
      continue;
    }
    if (tag === "tr" || tag === "table") {
      inCell = false;
      cells = 0;
    }
    if (inCell && (PARAGRAPH.has(tag) || LINE.has(tag))) {
      out += " ";
      continue;
    }
    if (PARAGRAPH.has(tag)) brk(2);
    else if (LINE.has(tag)) brk(1);
    else if (tag === "sup" && !close) out += " "; // a footnote mark: "14.5% Footnote 1", not "14.5%Footnote 1"
    if (close) continue;
    const heading = tag.match(/^h([1-6])$/);
    if (heading) emit(`${"#".repeat(Number(heading[1]))} `);
    else if (tag === "li") emit("- ");
    else if (tag === "img") {
      const alt = attr(attrs, "alt")?.trim();
      if (alt) emit(` [image: ${decodeEntities(alt)}] `);
    }
  }
  // A row whose last cells are empty ends in " |".
  return tidy(out.replace(/([ \t]*\|)+[ \t]*$/gm, ""));
}

/** Trims every line, squeezes runs of spaces and keeps at most one blank line in a row. */
export function tidy(text: string): string {
  return `${text
    .split(/\r?\n/)
    .map(line => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^(#+|-) *$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()}\n`;
}

function extractHtml(html: string): Extract {
  const title = firstText(html, "h1") || firstText(html, "title");
  const modified =
    attr(html.match(/<meta\b[^>]*\bname\s*=\s*["']dcterms\.modified["'][^>]*>/i)?.[0] ?? "", "content") ??
    html.match(/<time\b[^>]*\bproperty\s*=\s*["']dateModified["'][^>]*>([^<]*)</i)?.[1];
  return { title, modified: modified?.trim() || undefined, text: htmlToText(html) };
}

// ---------------------------------------------------------------------------------------------------------------
// PDF.

/** Parses a page list such as "3-7,12" into sorted page numbers, all within 1..total. */
export function parsePages(spec: string, total: number): number[] {
  const pages = new Set<number>();
  for (const part of spec.split(",")) {
    const m = part.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (!m) throw new Error(`--pages: "${part}" isn't a page or a range like 3-7`);
    const from = Number(m[1]);
    const to = Number(m[2] ?? m[1]);
    if (from < 1 || to < from || to > total) throw new Error(`--pages: ${part.trim()} is outside 1-${total}`);
    for (let p = from; p <= to; p++) pages.add(p);
  }
  return [...pages].sort((a, b) => a - b);
}

/** "D:20250707110912-03'00'" → "2025-07-07". */
const pdfDate = (d: unknown) =>
  typeof d === "string"
    ? d
        .match(/^D:(\d{4})(\d{2})(\d{2})/)
        ?.slice(1)
        .join("-")
    : undefined;

async function extractPdf(bytes: Uint8Array, pageSpec: string | undefined): Promise<Extract> {
  // PDF.js takes ownership of the buffer it is given, so give it a copy and keep the original for hashing.
  const pdf = await getDocumentProxy(bytes.slice(), { verbosity: 0 });
  const { info } = await getMeta(pdf);
  const { totalPages, text } = await extractText(pdf, { mergePages: false });
  const kept = pageSpec ? parsePages(pageSpec, totalPages) : text.map((_, i) => i + 1);
  const body = kept.map(p => `--- PDF page ${p} of ${totalPages} ---\n\n${tidy(plainSpaces(text[p - 1]))}`).join("\n");
  const firstLine =
    text
      .join("\n")
      .split("\n")
      .map(l => l.trim())
      .find(Boolean) ?? "";
  return {
    title: String(info?.Title ?? "").trim() || firstLine,
    modified: pdfDate(info?.ModDate) ?? pdfDate(info?.CreationDate),
    pages: { kept, total: totalPages },
    text: body,
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Download and dispatch.

type Kind = "pdf" | "html" | "text";

export function kindOf(contentType: string, bytes: Uint8Array): Kind {
  const head = new TextDecoder().decode(bytes.subarray(0, 512)).trimStart().toLowerCase();
  if (/pdf/i.test(contentType) || head.startsWith("%pdf-")) return "pdf";
  if (/html|xml/i.test(contentType) || head.startsWith("<!doctype html") || head.startsWith("<html")) return "html";
  return "text";
}

/** UTF-8 when the bytes are valid UTF-8, otherwise Windows-1252, which older government text files use. */
export function decode(bytes: Uint8Array, contentType: string): string {
  const declared = contentType.match(/charset=([\w-]+)/i)?.[1];
  if (declared && !/utf-?8/i.test(declared)) return new TextDecoder(declared).decode(bytes);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

export async function extract(bytes: Uint8Array, contentType: string, pageSpec?: string): Promise<Extract> {
  const kind = kindOf(contentType, bytes);
  if (kind === "pdf") return extractPdf(bytes, pageSpec);
  if (pageSpec) throw new Error("--pages only applies to PDFs");
  const text = decode(bytes, contentType).replace(/^\uFEFF/, "");
  if (kind === "html") return extractHtml(text);
  // Plain text has no reliable title (CRA's start with a screen reader note): the name stands in unless --title.
  return {
    title: "",
    text: `${text
      .replace(/\r\n?/g, "\n")
      .replace(/[ \t]+$/gm, "")
      .trim()}\n`,
  };
}

/** The default name for a URL: its last path segment without the extension, lowercased. */
export function nameFromUrl(url: string): string {
  const last = new URL(url).pathname.split("/").filter(Boolean).pop() ?? "";
  return last
    .replace(/\.[a-z0-9]+$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[^a-z0-9]+/, "");
}

// ---------------------------------------------------------------------------------------------------------------
// The extract file and the index.

export interface Entry {
  name: string;
  title: string;
  url: string;
  fetched: string;
  sha256: string;
}

export function formatExtract(e: Extract, entry: Entry): string {
  const pages = e.pages
    ? e.pages.kept.length === e.pages.total
      ? `all ${e.pages.total}`
      : `${compactPages(e.pages.kept)} of ${e.pages.total}`
    : undefined;
  const header = [
    `Title: ${entry.title}`,
    `URL: ${entry.url}`,
    `Fetched: ${entry.fetched}`,
    `SHA-256 of the original: ${entry.sha256}`,
    e.modified && `Publication date modified: ${e.modified}`,
    pages && `PDF pages: ${pages}`,
    "Text extract made by `npm run fetch-source`. Check figures against the original when layout matters (tables).",
  ].filter(Boolean);
  return `${header.join("\n")}\n${"=".repeat(80)}\n\n${e.text}`;
}

/** [1,2,3,7] → "1-3,7". */
export function compactPages(pages: number[]): string {
  const runs: string[] = [];
  for (let i = 0; i < pages.length; ) {
    let j = i;
    while (j + 1 < pages.length && pages[j + 1] === pages[j] + 1) j++;
    runs.push(i === j ? `${pages[i]}` : `${pages[i]}-${pages[j]}`);
    i = j + 1;
  }
  return runs.join(",");
}

const HEADER = "| Name | Title | URL | Fetched | SHA-256 of the original |";
const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
const row = (e: Entry) =>
  `| [${e.name}](${e.name}.txt) | ${cell(e.title)} | ${e.url} | ${e.fetched} | \`${e.sha256}\` |`;
const rowName = (line: string) => line.match(/^\|\s*\[([^\]]+)\]\(/)?.[1];

function newIndex(year: string): string {
  return [
    `# ${year} source extracts`,
    "",
    `Text extracts of official publications used for the ${year} data, made with`,
    "`npm run fetch-source -- <year> <url> [<name>]`. A data collector and the reviewer read the same text, and a",
    "reviewer can check figures without opening PDFs. Each `.txt` file starts with the URL, the date fetched and the",
    "SHA-256 of the original file. For a PDF or text file, download it again and compare the hash to confirm it",
    "hasn't changed. Web pages embed per-request tracking code, so their hash differs on every fetch: refetch with",
    "`--force` and compare the text with `git diff` instead.",
    "",
    `The originals aren't kept in the repo, only the text, up to ${MAX_KB} KB per extract (for a larger PDF, \`--pages\``,
    "keeps the pages the data uses). Nothing under `docs/` is imported by `src/`, so the build never bundles these.",
    "",
    HEADER,
    "|---|---|---|---|---|",
    "",
  ].join("\n");
}

/** Adds the entry's row to INDEX.md, or replaces the row with the same name, keeping rows sorted by name. */
export function updateIndex(index: string | undefined, year: string, entry: Entry): string {
  const lines = (index ?? newIndex(year)).replace(/\n*$/, "\n").split("\n");
  const head = lines.findIndex(l => l.startsWith("| Name |"));
  if (head < 0) throw new Error(`INDEX.md has no table starting with "${HEADER}"`);
  let end = head + 2;
  while (end < lines.length && lines[end].startsWith("|")) end++;
  const rows = lines.slice(head + 2, end).filter(l => rowName(l) !== entry.name);
  rows.push(row(entry));
  rows.sort((a, b) => (rowName(a) ?? "").localeCompare(rowName(b) ?? ""));
  return [...lines.slice(0, head + 2), ...rows, ...lines.slice(end)].join("\n");
}

export const indexHas = (index: string | undefined, name: string) =>
  (index ?? "").split("\n").some(l => rowName(l) === name);

// ---------------------------------------------------------------------------------------------------------------
// Command line.

async function main() {
  const usage =
    "usage: npm run fetch-source -- <year> <url> [<name>] [--force] [--pages <list>] [--title <text>]\n" +
    "  e.g. npm run fetch-source -- 2025 https://www.canada.ca/.../t4114-25e.pdf t4114-25";
  const fail = (msg: string): never => {
    console.error(`${msg}\n${usage}`);
    process.exit(1);
  };
  const { positionals, values } = (() => {
    try {
      return parseArgs({
        allowPositionals: true,
        options: { force: { type: "boolean" }, pages: { type: "string" }, title: { type: "string" } },
      });
    } catch (e) {
      return fail((e as Error).message);
    }
  })();
  if (positionals.length < 2 || positionals.length > 3) fail("give a year, a URL and optionally a name");
  const [year, url, given] = positionals;
  if (!/^\d{4}$/.test(year)) fail("the year must have four digits");
  if (!URL.canParse(url) || !/^https?:$/.test(new URL(url).protocol)) fail(`not an http(s) URL: ${url}`);
  const name = given ?? nameFromUrl(url);
  if (!NAME.test(name)) fail(`"${name}" can't be a file name: use lowercase letters, digits, dots, - and _`);

  const dir = path.join(ROOT, "docs/verification", year, "sources");
  const file = path.join(dir, `${name}.txt`);
  const indexFile = path.join(dir, "INDEX.md");
  const index = fs.existsSync(indexFile) ? fs.readFileSync(indexFile, "utf8") : undefined;
  const rel = path.relative(ROOT, file);
  if (!values.force && (fs.existsSync(file) || indexHas(index, name))) {
    fail(`${rel} already exists: pass --force to fetch it again and replace it`);
  }

  const res = await fetch(url, {
    headers: { "user-agent": "tax-visualizer fetch-source (https://github.com/yuorme/tax-visualizer)" },
  });
  if (!res.ok) return fail(`${url}: HTTP ${res.status} ${res.statusText}`);
  // canada.ca answers a missing page with a redirect to /errors/404.html and status 200.
  if (res.redirected && /\/(errors?|404)\b|\b404\.html?$/i.test(new URL(res.url).pathname)) {
    fail(`${url}: redirected to the error page ${res.url}`);
  }
  const contentType = res.headers.get("content-type") ?? "";
  const bytes = new Uint8Array(await res.arrayBuffer());
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (/\.pdf$/i.test(new URL(url).pathname) && kindOf(contentType, bytes) !== "pdf") {
    fail(`${url}: expected a PDF but got ${contentType || "something else"} (an error page?)`);
  }

  const result = await (async () => {
    try {
      return await extract(bytes, contentType, values.pages);
    } catch (e) {
      return fail((e as Error).message);
    }
  })();
  if (!result.text.trim()) fail(`${url}: no text found (a scanned PDF?)`);
  const entry: Entry = {
    name,
    title: values.title ?? (result.title || name),
    url,
    fetched: new Date().toLocaleDateString("en-CA"),
    sha256,
  };
  const out = formatExtract(result, entry);
  const kb = Buffer.byteLength(out) / 1024;
  if (kb > MAX_KB) {
    const hint = result.pages
      ? `pass --pages with the pages the data uses (the file has ${result.pages.total})`
      : "fetch a narrower page";
    fail(`the extract is ${kb.toFixed(0)} KB, over the ${MAX_KB} KB limit: ${hint}`);
  }

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, out);
  fs.writeFileSync(indexFile, updateIndex(index, year, entry));
  const pages = result.pages ? `, ${result.pages.kept.length} of ${result.pages.total} PDF pages` : "";
  console.log(`wrote ${rel} (${kb.toFixed(0)} KB${pages}) and updated ${path.relative(ROOT, indexFile)}`);
  console.log(`  ${entry.title}`);
}

if (import.meta.main) {
  main().catch(e => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
