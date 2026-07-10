---
type: feature
status: done
baseline_commit: NO_VCS
story_key: 3-5-handle-selection-changes-after-downstream-work
---

# Video Draft / Queue Foundation For Safe Selection Changes

## Intent

Build the smallest working Video Draft / Ready Video Job foundation needed for Story 3.5, then make Selected Variant changes safe once downstream video preparation exists.

## Boundaries & Constraints

- Keep the existing classic-script Chrome extension architecture.
- Store video jobs in the existing Project state envelope; do not create a parallel store.
- Do not auto-run video generation or wire background execution in this change.
- Running and Complete video jobs must not be silently mutated when selection changes.
- Keep Project Studio compact and operational; avoid broad redesign or documentation expansion.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| --- | --- | --- | --- |
| Draftable prompt | Prompt has `animation_prompt` and a Selected Variant | User can create/update a Draft video job | Missing selection shows Not Ready |
| Queue draft | Draft job exists and still matches current selection | User can mark it Ready | Stale selection blocks queueing |
| Selection changes before run | Draft or Ready job exists | Draft updates or Ready job becomes Needs Review | Repair action is shown |
| Selection changes after run | Running or Complete job exists | Existing job remains unchanged | User can create a new draft |
| Missing selected image | Selected Variant metadata exists but local file is missing | Video row shows Not Ready / repair reason | Draft creation is blocked |

## Code Map

- `src/shared/project-domain/00-project-domain.js` - normalize persisted `video_jobs`.
- `src/project-studio/app/00-studio-state.js` - derive video readiness, create/update drafts, mark drafts Ready, reconcile jobs after selection changes.
- `src/project-studio/app/01-studio-shell.js` - render Video Queue Builder and bind draft/queue actions.
- `src/project-studio/studio.css` - style Video Queue rows using existing Project Studio tokens.
- `docs/code-map.md` - note the new Video Draft / Queue foundation ownership.

## Tasks & Acceptance

- [x] Persist Project-scoped `video_jobs` records in the existing Project state envelope.
- [x] Add Studio state helpers for video readiness, Draft creation/update, Ready queue state, and selection-change reconciliation.
- [x] Render a working Video Queue Builder view with Not Ready, Draft, Ready, Needs Review, Running, Failed, and Complete states where applicable.
- [x] Keep Running and Complete jobs unchanged when a Selected Variant changes.
- [x] Run syntax checks for changed JavaScript files.

## Dev Agent Record

### Debug Log

- Baseline: `NO_VCS`.

### Completion Notes

- Added Project-scoped `video_jobs` normalization and update support.
- Added Video Draft creation/update, Ready queue state, and selection-change reconciliation in Studio state.
- Added Project Studio Video Queue Builder rows and actions.

### Verification

- `node --check src/shared/project-domain/00-project-domain.js`
- `node --check src/project-studio/app/00-studio-state.js`
- `node --check src/project-studio/app/01-studio-shell.js`
- Node VM smoke test: create draft, mark Ready, change Selected Variant to Needs Review, protect Running job from mutation.

## File List

- `src/shared/project-domain/00-project-domain.js`
- `src/project-studio/app/00-studio-state.js`
- `src/project-studio/app/01-studio-shell.js`
- `src/project-studio/studio.css`
- `docs/code-map.md`
- `_bmad-output/implementation-artifacts/epic-3-context.md`
- `_bmad-output/implementation-artifacts/spec-3-5-video-draft-queue-foundation.md`

## Change Log

- 2026-07-10: Started implementation from previous session dependency note.
- 2026-07-10: Implemented Video Draft / Ready Video Job foundation and selection-change safety.

## Status

Done.

## Suggested Review Order

**State Model**

- Project envelope now preserves and updates Video Jobs. [`00-project-domain.js:56`](../../src/shared/project-domain/00-project-domain.js#L56)
- Domain patch writes `video_jobs` through the existing command path. [`00-project-domain.js:295`](../../src/shared/project-domain/00-project-domain.js#L295)

**Video Draft Behavior**

- Queue item derivation centralizes readiness and protected-job states. [`00-studio-state.js:814`](../../src/project-studio/app/00-studio-state.js#L814)
- Draft creation stores prompt, selected variant, animation, and output metadata. [`00-studio-state.js:1626`](../../src/project-studio/app/00-studio-state.js#L1626)
- Drafts become Ready only after current selection validation. [`00-studio-state.js:1674`](../../src/project-studio/app/00-studio-state.js#L1674)
- Selection changes reconcile downstream jobs without mutating Running or Complete work. [`00-studio-state.js:784`](../../src/project-studio/app/00-studio-state.js#L784)

**Project Studio UI**

- Video Queue Builder renders readiness, reasons, and actions. [`01-studio-shell.js:732`](../../src/project-studio/app/01-studio-shell.js#L732)
- Video view routes to the real builder instead of placeholder metrics. [`01-studio-shell.js:875`](../../src/project-studio/app/01-studio-shell.js#L875)
- Draft and Ready actions are bound through delegated Studio events. [`01-studio-shell.js:1289`](../../src/project-studio/app/01-studio-shell.js#L1289)

**Supporting Changes**

- Queue rows reuse the existing compact Studio visual system. [`studio.css:741`](../../src/project-studio/studio.css#L741)
- Code map records the new responsibility boundary. [`code-map.md:30`](../../docs/code-map.md#L30)
