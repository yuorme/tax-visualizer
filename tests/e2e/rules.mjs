// The UI rules from CLAUDE.md that a browser can check. Each check reads the page's structure through the
// selectors documented here, so if the markup changes, update the selector and its comment together.
import AxeBuilder from "@axe-core/playwright";

// Chart columns: every child of the chart's list (#cols) is one column, and its label is the column's .code
// element. The label may carry a <sup> footnote marker (the † on Quebec's column), which isn't part of the code.
// Rule: one column for each of the 13 provinces and territories, each labelled with a code of one or two characters.
export const COLUMNS = "#cols > *";
export const COLUMN_LABEL = ".code";
export const COLUMN_COUNT = 13;
export const MAX_LABEL_LENGTH = 2;

// Explanations go in info tooltips, not visible hint text. How the page marks each:
//  - tooltip text lives in the data-tip attribute of an info button (button.info[data-tip]), so it isn't page text,
//    and it's shown in the shared tooltip element ([role=tooltip]) only while one is open;
//  - secondary explanatory text is marked with the class "note" (small muted type); "hint" and "help" count too, so
//    hint text added under either name is caught.
// Rule: no visible element with one of those classes, except inside <header> (title and introduction), <footer>
// (the methodology notes and sources) and the tooltip itself.
export const HINT_TEXT = ".note, .hint, .help";
export const HINT_ALLOWED_IN = "header, footer, [role=tooltip]";

// Failures already on the page when these checks were added, reported on every run but not failed, so
// `npm run check` stays green. Each entry is a CSS selector: a finding inside a matching element counts as known.
// Each entry names the GitHub issue that tracks it; when that issue is fixed, delete the entry. The test prints a
// note when an entry no longer matches anything.
export const KNOWN = {
  contrast: {
    // Income tax ledger rows for brackets the income doesn't reach are dimmed: 2.53:1 light, 3.23:1 dark.
    "tr.idle": "#56: dimmed unused-bracket rows in the income tax detail fail colour contrast",
    // The highlighted home column's code, marginal rate and tag on its tinted background: 3.89:1 and 4.43:1 (light).
    ".col.is-home": "#56: home column text on its highlight fails colour contrast in light mode",
  },
  hint: {
    // The comparison's summary line, row annotations and explanatory notes are all p.note / small.note.
    "#detail-body": "#57: explanatory .note text is visible in the home vs destination comparison",
  },
};

/** Reads the page for the per-state rules: sideways scrolling, chart column labels and visible hint text. */
export const inspect = page =>
  page.evaluate(
    ({ COLUMNS, COLUMN_LABEL, HINT_TEXT, HINT_ALLOWED_IN, known }) => {
      const where = el => {
        const id = el.closest("[id]");
        if (id) return `#${id.id}`;
        const named = el.closest("[aria-label]");
        return named ? `${named.tagName.toLowerCase()}[aria-label="${named.getAttribute("aria-label")}"]` : "body";
      };
      const labels = [...document.querySelectorAll(COLUMNS)].map(col => {
        const label = col.querySelector(COLUMN_LABEL)?.cloneNode(true);
        if (!label) return null;
        for (const sup of label.querySelectorAll("sup")) sup.remove();
        return label.textContent.trim();
      });
      const hints = [...document.querySelectorAll(HINT_TEXT)]
        .filter(el => !el.closest(HINT_ALLOWED_IN) && el.checkVisibility() && el.textContent.trim())
        .map(el => ({
          where: where(el),
          text: el.textContent.trim().replace(/\s+/g, " ").slice(0, 120),
          known: known.find(sel => el.closest(sel)) ?? null,
        }));
      return { scrollWidth: document.documentElement.scrollWidth, labels, hints };
    },
    { COLUMNS, COLUMN_LABEL, HINT_TEXT, HINT_ALLOWED_IN, known: Object.keys(KNOWN.hint) },
  );

/** Runs axe-core's colour-contrast rule on the page as it is now and returns each failing element. */
export async function contrastViolations(page) {
  const { violations } = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
  const nodes = violations.flatMap(v => v.nodes).map(n => ({ target: n.target, message: n.any[0]?.message ?? "" }));
  return page.evaluate(
    ({ nodes, known }) =>
      nodes.map(({ target, message }) => {
        const el = typeof target[0] === "string" ? document.querySelector(target[0]) : null;
        return {
          target: target.join(" "),
          message: message.replace(/\s*Expected contrast.*$/, ""),
          known: (el && known.find(sel => el.closest(sel))) ?? null,
        };
      }),
    { nodes, known: Object.keys(KNOWN.contrast) },
  );
}
