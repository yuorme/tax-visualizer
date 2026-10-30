// Fails if a tracked Markdown file has prose lines over 120 characters. Skips frontmatter, code blocks, tables
// and lines containing a URL, which can't be wrapped.
//   node scripts/check-docs.mjs
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const MAX = 120;
const files = execFileSync("git", ["ls-files", "*.md"], { encoding: "utf8" }).split("\n").filter(Boolean);
const long = [];

for (const file of files) {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  let fence = false,
    front = lines[0] === "---";
  lines.forEach((line, i) => {
    if (front) {
      if (i > 0 && line === "---") front = false;
      return;
    }
    if (line.startsWith("```")) {
      fence = !fence;
      return;
    }
    if (fence || line.startsWith("|") || /https?:\/\//.test(line)) return;
    if (line.length > MAX) long.push(`${file}:${i + 1}: ${line.length} characters`);
  });
}

if (long.length) {
  console.error(`Markdown lines over ${MAX} characters (rewrap them):\n${long.join("\n")}`);
  process.exit(1);
}
console.log(`docs: ${files.length} Markdown files within ${MAX} characters`);
