---
title: 'Story 2.7: Resolve Missing References Into Ready Prompts'
type: 'feature'
created: '2026-07-10'
status: 'review'
review_loop_iteration: 0
baseline_commit: 'NO_VCS'
context:
  - '_bmad-output/project-context.md'
  - '_bmad-output/planning-artifacts/epics.md'
  - '_bmad-output/planning-artifacts/prds/prd-AutoFlow-project-studio-refactor-2026-07-09/prd.md'
  - '_bmad-output/implementation-artifacts/spec-2-6-resolve-references-and-block-unsafe-prompts.md'
  - 'docs/code-map.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** Blocked Prompt Records can now explain missing or ambiguous references, but the user cannot manually repair them. A blocked prompt should become Ready only after the user maps the unresolved reference to a valid Project Asset or creates/uploads the needed Asset and re-runs resolution.

**Approach:** Add manual reference mapping in Project Studio Import / Resolve. A blocked reference can be mapped to an existing active Asset. The Prompt Record stores the manual mapping, then the resolver re-runs and promotes the prompt to Ready only when all required references resolve.

## Boundaries & Constraints

**Always:** Preserve unrelated Prompt Records and Assets. Keep blocked prompts generation-disabled until they resolve. Use existing Asset creation/upload flow for missing Assets.

**Ask First:** Auto-creating Assets, automatic upload, image generation, queue creation, or replacing side-panel behavior.

**Never:** Do not silently mark a prompt Ready without a valid Asset mapping. Do not erase raw reference names or attach global Jack references.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Map missing ref | Blocked prompt and user selects active Asset | Reference stores manual Asset mapping; resolver re-runs | Prompt becomes Ready only if all required refs resolve |
| Asset does not exist | User submits missing/disabled Asset ID | No write | Specific error shown |
| Type mismatch | Reference has type and selected Asset has another type | No write | Specific error shown |
| New Asset created | User creates/uploads Asset through existing Asset flow | Re-run resolver can resolve by alias/display/slug or manual map | Unrelated prompts unchanged |
| Still blocked | Prompt still has unresolved refs | Prompt remains `blocked` and `can_generate_images: false` | UI keeps disabled reason visible |

</frozen-after-approval>

## Code Map

`src/project-studio/app/00-studio-state.js` -- manual mapping state update and resolver re-run.
`src/project-studio/app/01-studio-shell.js` -- blocked reference mapping controls.
`src/project-studio/studio.css` -- mapping control layout.
`docs/code-map.md`, `docs/architecture.md`, `docs/project-json-contract.md` -- manual mapping ownership.

## Tasks & Acceptance

**Execution:**
- [x] Add manual reference-to-Asset mapping state helper.
- [x] Re-run resolver after mapping and preserve unrelated Prompt Records.
- [x] Render mapping controls for missing/ambiguous blocked references.
- [x] Keep unresolved prompts blocked and generation-disabled with visible reason.
- [x] Update docs.

**Acceptance Criteria:**
- Given prompts are Blocked because of missing references, mapping the missing reference to an existing Asset re-runs resolution and prompts with all references resolved become Ready.
- Given no suitable Asset exists, creating/uploading an Asset through the existing Asset flow lets the resolver map the missing reference later and unrelated ready prompts remain unchanged.
- Given a prompt remains Blocked, it is not returned by generation-ready Prompt Record helpers and the UI names the missing/ambiguous reference.
- Given changed JavaScript files, `node --check` passes for each changed JS file.

## Dev Agent Record

### Debug Log

- 2026-07-10: Created Story 2.7 spec directly from approved epics/PRD context because no sprint-status file exists.
- 2026-07-10: Serena diagnostics checked after implementation. Remaining diagnostics are existing classic-JS/global false positives; Node syntax and VM behavior checks passed.

### Completion Notes

- Added `mapPromptReferenceToAsset()` to persist manual mappings on Prompt Record references as `manual_asset_id` and `resolution_source: "manual"`.
- Resolver now respects manual mappings and keeps prompts blocked if the mapped Asset is missing, disabled, or type-incompatible.
- Import / Resolve now renders mapping controls for blocked references using compatible active Assets.
- Manual mapping re-runs resolution and preserves unrelated Prompt Records when their resolution does not materially change.

### Verification

- `node --check src/shared/project-domain/00-project-domain.js`
- `node --check src/shared/project-domain/01-project-json-contract.js`
- `node --check src/project-studio/app/00-studio-state.js`
- `node --check src/project-studio/app/01-studio-shell.js`
- `node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8'))"`
- Project Studio script loader path check via Node stdin script
- VM smoke test for type mismatch rejection, new Asset resolver rerun, unrelated ready prompt preservation, manual missing-reference mapping, persisted manual mapping fields, and generation-ready filtering

## File List

- `src/project-studio/app/00-studio-state.js`
- `src/project-studio/app/01-studio-shell.js`
- `src/project-studio/studio.css`
- `docs/project-json-contract.md`
- `docs/code-map.md`
- `docs/architecture.md`
- `_bmad-output/project-context.md`
- `_bmad-output/implementation-artifacts/spec-2-7-resolve-missing-references-into-ready-prompts.md`

## Change Log

- 2026-07-10: Implemented manual blocked-reference mapping and documented manual resolver behavior.

## Status

review
