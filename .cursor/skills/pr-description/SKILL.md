# pr-description

Write a PR description that summarizes all changes in the current branch compared to `staging`, grouped into clear sections with bullet lists.

## Goal

Produce a concise, accurate PR description covering everything introduced by this branch against `staging`.

## Required behavior

- Compare `staging...HEAD` as the source of truth.
- Include all commits and file changes in the branch diff.
- Group changes into meaningful sections, not a flat list.
- Include one bullet for every distinct feature, improvement, or bug fix.
- Write bullets from a user-impact perspective (what users/reviewers care about).
- Do not include speculation or unverifiable claims.

## Workflow

1. Gather git context:
   - `git status --short`
   - `git log --oneline staging..HEAD`
   - `git diff --name-status staging...HEAD`
   - `git diff --stat staging...HEAD`
2. Review diff content by area to understand intent:
   - `git diff staging...HEAD -- <path>`
3. Build grouped sections from the actual changes.
4. Draft final PR description in markdown.

## Sectioning guidance

Use sections that match the branch contents. Common examples:

- `## Summary`
- `## UI/UX`
- `## API/Backend`
- `## Data Model / Migrations`
- `## Performance`
- `## Refactors`
- `## Fixes`
- `## Tests`
- `## Docs`

Only include sections that have real changes.

## Output format

Return markdown using this structure:

```md
## Summary

- <high-level branch intent>

## <Section Name>

- <change 1>
- <change 2>

## <Section Name>

- <change 1>

## Risks / Notes

- <known caveats, rollout notes, or "None">

## Test Plan

- [ ] <validation step 1>
- [ ] <validation step 2>
```

## Writing rules

- Keep bullets concise and specific.
- Start bullets with action verbs.
- Focus on user-visible behavior and why it matters.
- Do not cap bullet count; cover every meaningful change in `staging...HEAD`.
- Merge purely internal refactors into user-facing outcomes when possible.
- Avoid implementation trivia unless it impacts reviewers.
- If no tests were added, explicitly say why in `Test Plan`.
