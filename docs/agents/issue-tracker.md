# Issue tracker: GitHub

Issues and specs live in GitHub Issues for `FilipMessa/zoznam-nakupny`.
Use the `gh` CLI.

## Operations

- Create: `gh issue create --title "..." --body-file <file>`
- Read: `gh issue view <number> --comments` and fetch its labels.
- List: `gh issue list --state open`, using `--label`, `--state`, and
  `--json` as needed.
- Comment: `gh issue comment <number> --body-file <file>`
- Label: `gh issue edit <number> --add-label "..."` or `--remove-label "..."`
- Close: `gh issue close <number> --comment "..."`

Infer the repository from `origin`. Publishing to the issue tracker means
creating a GitHub issue; fetching a ticket means reading its issue and comments.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## Wayfinding operations

- A map is an issue labelled `wayfinder:map`; tickets are child issues labelled
  `wayfinder:<type>` (`research`, `prototype`, `grilling`, or `task`).
- Link children using GitHub sub-issues. If unavailable, add them to the map's
  task list and put `Part of #<map>` in each child.
- Use GitHub's native issue dependencies for blockers. If unavailable, add
  `Blocked by: #<number>` to the child. A ticket is unblocked when all blockers
  are closed.
- Choose the first open child in map order with no open blockers or assignee.
  Claim it with `gh issue edit <number> --add-assignee @me`.
- On resolution, comment with the answer, close the ticket, and add a summary
  and link to the map's Decisions-so-far.
