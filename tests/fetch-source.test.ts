// The source cache helper (scripts/fetch-source.ts): its pure parts, with no network. How INDEX.md rows are merged,
// which pages --pages keeps, what the HTML extract drops and keeps, and how a download's type is recognized.
import assert from "node:assert/strict";
import test from "node:test";
import {
  compactPages,
  type Entry,
  htmlToText,
  indexHas,
  kindOf,
  nameFromUrl,
  parsePages,
  updateIndex,
} from "../scripts/fetch-source.ts";

const entry = (name: string, title = name.toUpperCase()): Entry => ({
  name,
  title,
  url: `https://example.ca/${name}.pdf`,
  fetched: "2026-11-01",
  sha256: "0".repeat(64),
});
const rows = (index: string) => index.split("\n").filter(l => l.startsWith("| ["));

test("updateIndex starts a new index with its explanation and table", () => {
  const index = updateIndex(undefined, "2025", entry("t4114-25"));
  assert.match(index, /^# 2025 source extracts\n/);
  assert.match(
    index,
    /\| Name \| Title \| URL \| Fetched \| SHA-256 of the original \|\n\|---\|---\|---\|---\|---\|\n/,
  );
  assert.deepEqual(rows(index), [
    `| [t4114-25](t4114-25.txt) | T4114-25 | https://example.ca/t4114-25.pdf | 2026-11-01 | \`${"0".repeat(64)}\` |`,
  ]);
  assert.ok(index.endsWith("|\n"), "ends with one newline after the last row");
});

test("updateIndex adds rows sorted by name and replaces a row with the same name", () => {
  let index = updateIndex(undefined, "2025", entry("t4114-25"));
  index = updateIndex(index, "2025", entry("cra-rates"));
  index = updateIndex(index, "2025", entry("rc4210-25"));
  assert.deepEqual(
    rows(index).map(r => r.split(" | ")[0]),
    ["| [cra-rates](cra-rates.txt)", "| [rc4210-25](rc4210-25.txt)", "| [t4114-25](t4114-25.txt)"],
    "added rows are sorted by name, not appended",
  );

  const replaced = updateIndex(index, "2025", { ...entry("rc4210-25", "New title"), fetched: "2027-01-02" });
  assert.equal(rows(replaced).length, 3, "replacing doesn't add a second row for the name");
  assert.match(replaced, /\| \[rc4210-25\]\(rc4210-25\.txt\) \| New title \| .* \| 2027-01-02 \|/);
  assert.doesNotMatch(replaced, /RC4210-25/, "the old row is gone");
  // A name that is a prefix of another is a different row.
  assert.equal(rows(updateIndex(replaced, "2025", entry("rc4210"))).length, 4);
});

test("updateIndex keeps edited prose around the table", () => {
  const edited = updateIndex(undefined, "2025", entry("a")).replace("# 2025 source extracts", "# Edited heading");
  const index = updateIndex(`${edited}\nA note after the table.\n`, "2025", entry("b"));
  assert.match(index, /^# Edited heading\n/);
  assert.match(index, /\| \[b\]\(b\.txt\) .*\|\n\nA note after the table\.\n$/);
  assert.throws(() => updateIndex("# No table here\n", "2025", entry("a")), /no table/);
});

test("updateIndex escapes | and flattens whitespace in titles, so the row keeps five cells", () => {
  const index = updateIndex(undefined, "2025", entry("x", "Income | tax\n  rates"));
  const [row] = rows(index);
  assert.match(row, /\| Income \\\| tax rates \|/);
  assert.equal(row.split(/(?<!\\)\|/).length - 2, 5);
});

test("indexHas matches a row's exact name", () => {
  const index = updateIndex(undefined, "2025", entry("rc4210-25"));
  assert.ok(indexHas(index, "rc4210-25"));
  assert.ok(!indexHas(index, "rc4210"));
  assert.ok(!indexHas(undefined, "rc4210-25"));
});

test("parsePages reads pages and ranges within the document", () => {
  assert.deepEqual(parsePages("3-5, 9,4", 10), [3, 4, 5, 9], "sorted, without duplicates");
  assert.deepEqual(parsePages("1", 1), [1]);
  assert.deepEqual(parsePages("10", 10), [10], "the last page is allowed");
  assert.deepEqual(parsePages("1-10", 10), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.throws(() => parsePages("0", 10), /outside 1-10/, "pages count from 1");
  assert.throws(() => parsePages("0-3", 10), /outside 1-10/);
  assert.throws(() => parsePages("11", 10), /outside 1-10/);
  assert.throws(() => parsePages("9-11", 10), /outside 1-10/);
  assert.throws(() => parsePages("5-3", 10), /outside/, "a backwards range");
  assert.throws(() => parsePages("3-", 10), /isn't a page/);
  assert.throws(() => parsePages("a", 10), /isn't a page/);
  assert.equal(compactPages([1, 2, 3, 7, 9, 10]), "1-3,7,9-10");
});

test("htmlToText keeps only <main> and drops hidden elements, scripts, forms and canada.ca's page details", () => {
  const html = `<html><head><title>T</title></head><body>
    <nav>site menu</nav><header>banner</header>
    <main>
      <h1>Rates &amp; brackets</h1>
      <p class="intro hidden-xs">visible: hidden only appears in a class</p>
      <div hidden>hidden attribute</div>
      <div hidden="">hidden attribute with a value</div>
      <span aria-hidden="true">aria hidden</span>
      <span aria-hidden="false">aria shown</span>
      <div><div hidden><div>nested hidden</div></div><p>after nested</p></div>
      <script>var html = "<p>in a script</p>";</script><style>p { color: red }</style>
      <form><label>search form</label></form>
      <aside class="wb-fnote"><p>footnote kept</p></aside>
      <section class="pagedetails"><h2>Page details</h2><div><div>Date modified: 2026-06-25</div></div></section>
    </main>
    <footer>site footer</footer></body></html>`;
  const text = htmlToText(html);
  for (const kept of ["# Rates & brackets", "visible: hidden only appears in a class", "aria shown", "after nested"]) {
    assert.ok(text.includes(kept), `keeps "${kept}"`);
  }
  assert.ok(text.includes("footnote kept"), "an aside inside <main> is content (canada.ca footnotes)");
  for (const dropped of [
    "site menu",
    "banner",
    "site footer",
    "hidden attribute",
    "aria hidden",
    "nested hidden",
    "in a script",
    "color: red",
    "search form",
    "Page details",
    "Date modified",
  ]) {
    assert.ok(!text.includes(dropped), `drops "${dropped}"`);
  }
});

test("htmlToText falls back to <body> without <main>", () => {
  assert.equal(htmlToText("<html><head><title>Not this</title></head><body><p>Body text</p></body>"), "Body text\n");
});

test("htmlToText writes headings, list items and table rows as lines", () => {
  const text = htmlToText(`<main>
    <h2>Federal</h2>
    <ul><li>one</li><li>two</li></ul>
    <table><caption>Federal rate: 2025</caption>
      <thead><tr><th colspan="2">Each portion</th><td></td></tr><tr><th>from</th><th>up to</th><th>rate</th></tr></thead>
      <tbody><tr><td>$0</td><td><p>$57,375</p></td><td>14.5%<sup><a href="#fn1">Footnote 1</a></sup></td></tr>
      <tr><td>$57,375.01</td><td>$114,750</td><td>20.5%</td></tr></tbody>
    </table>
    <p>a&nbsp;b&#160;c&#x2009;d<br>next line</p></main>`);
  assert.equal(
    text,
    [
      "## Federal",
      "",
      "- one",
      "- two",
      "",
      "Federal rate: 2025",
      "Each portion",
      "from | up to | rate",
      "$0 | $57,375 | 14.5% Footnote 1",
      "$57,375.01 | $114,750 | 20.5%",
      "",
      "a b c d",
      "next line",
      "",
    ].join("\n"),
  );
});

test("kindOf recognizes PDFs and HTML by content type or by their first bytes", () => {
  const bytes = (s: string) => new TextEncoder().encode(s);
  assert.equal(kindOf("application/pdf", bytes("anything")), "pdf");
  assert.equal(kindOf("application/octet-stream", bytes("%PDF-1.7\n...")), "pdf", "a PDF served as binary");
  assert.equal(kindOf("text/html;charset=utf-8", bytes("<p>")), "html");
  assert.equal(kindOf("", bytes("\n  <!DOCTYPE html><html>")), "html", "no content type, HTML bytes");
  assert.equal(kindOf("application/xhtml+xml", bytes("<?xml")), "html");
  assert.equal(kindOf("application/txt", bytes("RC4210(E) Revision 25")), "text", "CRA's .txt type");
  assert.equal(kindOf("text/plain", bytes("Use <p> tags")), "text", "text mentioning a tag isn't HTML");
});

test("nameFromUrl takes the last path segment without its extension", () => {
  assert.equal(nameFromUrl("https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4114/t4114-25e.pdf"), "t4114-25e");
  assert.equal(nameFromUrl("https://example.ca/a/Last Year.html?x=1#top"), "last-year");
  assert.equal(nameFromUrl("https://example.ca/rates/"), "rates");
});
