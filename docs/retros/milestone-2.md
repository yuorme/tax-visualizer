# Milestone 2 retro: New inputs

18 issues, closed November 1 to 4, 2026. Tokens exist only for the last session (November 4), which finished #14 alongside
#146 from milestone 3 and 11 unmilestoned fixes, all listed below. Earlier sessions kept no token record, so they give
rounds only.

## Per issue

Codex tokens come from each session's rollout: uncached tokens, then the total including cached input. Claude tokens are
the reviewer's reported total. Codex ran at `high` except as noted; #116's fix round ran at `medium`.

| Issue | Class, coder | Coder tokens | Reviewer, tokens | Rounds | What the extra rounds fixed |
|---|---|---|---|---|---|
| #14 engine (#192) | Normal, Astra | 248k / 16.0M | Astra, 129k / 3.7M | 2 | Quebec marginal `null` with a CPP election |
| #14 page (#193) | Normal, Astra | 166k / 10.0M | Astra, 97k / 2.5M | 1 | |
| #146 engine (#170) | Normal, Astra | 139k / 3.5M, fixes only | Opus `medium`, 54k, round 2 | 2 | Year-change rule, non-array input |
| #146 page (#179) | Complex, Opus | 276k | Astra, 84k / 1.5M | 1 | |
| #102 (#175) | Normal, Astra | 212k / 17.3M | Opus `medium`, 270k | 2 | Merged main three times; 53 combined cells |
| #103 (#187) | Normal, Astra | 203k / 13.2M | Opus `medium`, 251k | 2 | Merge conflict, solidarity sources |
| #162 (#181) | Normal, Astra | 174k / 9.7M | Opus `medium`, 136k + part of 46k | 2 | Missing tie-with-reduction golden |
| #188 (#190) | Normal, Astra | 150k / 7.9M | Opus `medium`, 141k | 2 | Missing `docs/SCOPE.md` estimate line |
| #106 (#183) | Normal, Astra | 137k / 7.6M | Opus `medium`, 123k + part of 46k | 2 | Stale `docs/SCOPE.md` line, Act name |
| #116 (#171) | Normal, Astra | 118k / 1.5M, fixes only | Opus `medium`, 90k | 2 | Verification note contradicted the head |
| #166 (#177) | Data, Sol | 214k / 14.3M | Sonnet, 112k | 1 | |
| #86 (#189) | Data, Sol | 164k / 7.1M | Sonnet, 54k | 2 | Lint failure, sources missing from the YAML |
| #168 (#173) | Simple, Sol | 104k / 4.0M | Astra, 78k / 2.1M | 1 | |
| #174 (#178, #184) | Simple, Sol | 113k / 3.4M | Astra, 119k / 2.8M | 1 each | First fix didn't cure the flake |
| #58 (#180) | Data, Sol | 70k / 2.6M | Sonnet, 28k | 1 | |
| #191 process rules | Simple, Sol `medium` | 73k / 2.2M | Astra `medium`, 55k / 961k | 4 | User changed the rule three times |

Earlier milestone issues, by verdicts on their pull requests: one round for #56, #63, #10, #8, #11, #84, #12, #7, #9
and #57; two for #61, #6, #13, #15 and #91; three for #92. #55 has no linked pull request to count.

Seven of 17 counted milestone issues needed more than one round, against six of seven in milestone 1. Across all 24
Codex sessions on November 4: 2.9M uncached tokens, 134.5M including cache, for 11 points of the weekly limit (75% to 86%).

## Defects found after merge

- #178's five-second wait didn't fix the #174 flake; it fired again on #180. #184 found the cause, a queued scroll event
  dismissing the tip, by reproducing it under CPU throttling (18 of 18 before, 0 of 18 after). The first fix was shipped
  without reproducing anything.
- Pre-existing bugs found in review, not caused by these pull requests: #188, #185, #186 and #176.

## Time lost

- **Golden merges:** #102, #162, #166 and #103 ran in parallel. Five merges of `main` cost 142k uncached and 21.6M with
  cache, 16% of the session. Provinces didn't overlap, but neighbouring lines still conflicted in git. Each #102 merge
  also needed a fresh review of its combined cells.
- **Stopping over file ownership:** five stops on #166, #106 and #162 for test files the briefs hadn't listed. The resumes
  that followed came to 11.4M with cache, 8%, partly on real work. All were approved at once.
- **Documentation-only second rounds:** #171, #183, #190 and #189, 10.5M with cache, 8%, plus their re-reviews. #189
  reported a passing check that a later edit had broken.
- **Briefs saying "stop on any failure":** a Chromium sandbox refusal on #178 and a script buffer overflow on #102 each
  cost a round; neither was an access block. The escalation route was in the docs but not the brief.
- **Orchestrator errors:** a flag conflict killed one Codex start (`--approve-for-me` refuses `--sandbox`). Worktrees were
  removed before a conflict appeared on #177 and #181, so both were recreated.
- **Worktree cleanup:** six merged worktrees are still held by idle plugin brokers from a previous session, because auto
  mode refused to stop them. They wait on the user, along with two leftover checkouts.
- **Reviewer scratch files:** reviewers share the session scratchpad; one may have overwritten another's throwaway files.
  No repository effect.

## Changes

1. **One pull request at a time changes existing goldens.** `tests/golden/*.json` now count as one file under the
   same-file rule, across provinces. Tied to the 21.6M above. Merged into the existing rule, adding no new one.
2. **Tests and helpers that encode the changed behaviour are in scope.** Coders edit them without stopping and list them
   in the pull request. Tied to the five stops above. Merged into the existing "stay inside that set" line.
3. **The self-check runs on the final head.** Coders confirm the verification note, `docs/SCOPE.md` and the pull request
   body describe the final head, and run checks after the last edit. Tied to the four documentation rounds above. It
   replaces the renamed-file check, which it covers.

#191 made three further changes during the milestone at the user's direction: no committed cell lists, Astra for Normal
and Data reviews, and new engine features limited to the latest two tax years.

Next retro: `tokens used` in a Codex log is cumulative per session and excludes cached input, so the last value is the
total, and resumed sessions shouldn't be summed. Compare golden merges, ownership stops and documentation-only rounds
against the numbers above. Check whether Astra reviews catch what Opus did: Opus found the missing #181 golden, and Astra
found the #192 Quebec bug.
