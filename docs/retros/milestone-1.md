# Milestone 1 retro: Foundations

Issues #1, #2, #3, #4, #5, #36, #37, #38, run October 30 to November 1, 2026, by one orchestrating session with
`coder`, `data-collector` and `reviewer` agents. Process changes made during the milestone: #65 (pull request #67).

## Per issue

Agent tokens are the implementing agent's total, including fix rounds; reviewers are listed separately.

| Issue | Agent tokens | Review tokens | Rounds to approval | What the extra round fixed |
|---|---|---|---|---|
| #36 multi-year tests | ~88k | ~29k | 2 | Lint exclusion too broad (orchestrator caught it before review) |
| #1 notes from data | ~200k | ~66k | 2 | New fields unsourced; a test copied the formula it checked |
| #38 e2e rule checks | ~150k | ~35k | 2 | Known-failure matching hid new failures in the same region |
| #37 2025 rule shapes | ~227k | ~58k, Opus | 2 | No test told family income from individual income |
| #2 page logic in TS | ~177k | ~103k | 1 | (reviewer hit its turn limit; no live comparison) |
| #4 layout prototype | ~152k | none | n/a | User sign-off |
| #3 2025 data | ~390k | ~54k | 2 | NU child benefit copied from the 2026 file (blocking) |
| #5 tabbed inputs | ~210k | ~66k, Opus | 2 | No e2e test for the acceptance criteria; summary ignored partner |

#5's row is provisional: its pull request (#68) was still open when this was written.

Six of seven reviewed issues needed a second round. Five of those six findings were checklist-shaped.

## Defects found after merge

None known when written (pull request #68 still open). One near-miss: the #37 review fixes were pushed after the user merged pull request #60, recreating
the deleted branch (follow-up pull request #62).

## Time lost

- #37 waited for #1 to merge because #1 owned `src/data/schema.ts`; both only added to it.
- #3 lost its work to a usage limit: it committed only at the end.
- Every merge left other queued pull requests behind `main`; six `gh pr update-branch` runs, each a CI run. Kept on
  purpose: the user prefers strict up-to-date checks to the risk of untested combinations.
- Agents rediscovered that the CLAUDE.md `fnm env` prefix is refused in their sandbox (fixed in #65).

## Changes

1. **Catch checklist findings before review.** Coder self-check gains "each UI acceptance criterion has an e2e
   assertion" (#5); "a plausible wrong reading fails a test" and "new fields sourced" were added in #65 (#1, #37).
   Invariant tests (#70) cover engine-wide properties.
2. **Catch carried-over data values.** `npm run year-diff` (#69) flags amounts unchanged from the neighbouring year;
   data pull requests include its output and reviewers check what it flags (#3).
3. **Cut the most expensive work.** The 2025 data year was the largest single cost (~390k tokens, plus a reviewer
   refetching the same CRA PDFs and unable to read some). Data years can now be split by region with a shared
   source cache (#71). Smaller, untied by numbers here (next retro should measure them): agents open their own pull
   requests and reviewers post verdicts on them, since the orchestrator opened 10 pull requests and reposted 10
   verdicts by hand; `schema.ts` additions no longer need exclusive ownership (#37 waited for #1 to merge).

Removed or merged: CLAUDE.md's worktree `npm ci` line (already in each agent file); two data-collector rules merged.

Next retro: compare rounds to approval and data-year tokens against this table.
