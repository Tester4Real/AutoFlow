---
title: 'Story 2.1: Build Typed Asset Library'
type: 'feature'
created: '2026-07-09'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'NO_VCS'
context:
  - '_bmad-output/project-context.md'
  - '_bmad-output/planning-artifacts/epics.md'
  - '_bmad-output/planning-artifacts/prds/prd-AutoFlow-project-studio-refactor-2026-07-09/prd.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-AutoFlow-2026-07-09/wireframes/key-screens.md'
  - 'docs/code-map.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** Projects need reusable typed Assets before JSON references can resolve to stable identities. The Assets view currently only shows shell metrics, so users cannot create characters, places, props, styles, or generic references.

**Approach:** Add a typed Asset Manager inside Project Studio's Assets view. Users can create an Asset with type, display name, and aliases. Each Asset receives a stable `asset_id`, is stored under the active Project's `assets` array, and renders in a dense grouped/filterable list with file count, usage count, and warning state.

## Boundaries & Constraints

**Always:** Assets are Project-scoped and keyed by stable `asset_id`; display names and aliases are editable resolver metadata. Projects with zero character Assets remain valid.

**Ask First:** File upload/primary file management, safe delete flows, JSON import resolution, usage graph computation, Flow upload cache behavior.

**Never:** Do not invent missing Assets automatically, upload files silently, change `project_id`, or key prompt/media references only by Asset display name.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Active Project | User creates character/place/prop/style/reference Asset | Asset stored with stable `asset_id`, type, display name, aliases, empty files | Save errors render in Assets view |
| Zero characters | Project has no character Assets | Assets view remains valid and can filter to empty Characters | Empty state is explicit |
| Existing Assets | Assets exist | Dense list shows type, display name, aliases, file count, usage count, state | Unknown fields are preserved on save |
| Type filter | User filters by type | List narrows to selected type and keeps grouped layout | Empty filtered result shows no-match state |
| No files | Asset has zero files | State shows warning `No files` | No upload is attempted in this story |

</frozen-after-approval>

## Code Map

`src/shared/project-domain/00-project-domain.js` -- allow `updateProject()` to persist Project `assets`.
`src/project-studio/app/00-studio-state.js` -- asset type constants, alias parsing, asset creation, filtered Asset reads.
`src/project-studio/app/01-studio-shell.js` -- render and bind Assets manager.
`src/project-studio/studio.css` -- dense Asset form, filters, grouped rows, and state chips.
`docs/code-map.md` -- document Asset Manager ownership.

## Tasks & Acceptance

**Execution:**
- [x] Allow active Project `assets` array to persist through project-domain update.
- [x] Add Project Studio state helpers for typed Asset creation and filtering.
- [x] Render Assets manager in the Assets view.
- [x] Style dense list, filters, aliases, and warning states.
- [x] Update docs.

**Acceptance Criteria:**
- Given an active Project, when the user opens Assets, then they can create typed Assets: character, place, prop, style, generic reference.
- Given Projects have zero character Assets, when the Assets view renders, then the Project remains valid.
- Given Assets exist, when Asset Manager renders, then it shows type, display name, aliases, file count, usage count, and warning state.
- Given the type filter changes, when Assets render, then the list narrows by type without changing stored Asset IDs.
- Given changed JavaScript files, `node --check` passes for each changed JS file.

## Verification

- `node --check src/shared/project-domain/00-project-domain.js`
- `node --check src/project-studio/app/00-studio-state.js`
- `node --check src/project-studio/app/01-studio-shell.js`
- `node --check src/sidepanel/app/00b-project-selector.js`
- Node smoke test: create Project, persist one Asset under Project `assets`, reload, assert `asset_id` and display name remain stable.
- `node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); console.log('manifest ok')"`
- Node script-path check for `src/project-studio/index.html` and `src/sidepanel/index.html`

## Suggested Review Order

**Project Domain**
- `src/shared/project-domain/00-project-domain.js` -- `updateProject()` now persists the Project `assets` array.

**Project Studio Assets**
- `src/project-studio/app/00-studio-state.js` -- Asset type constants, alias parsing, stable Asset creation, filtering.
- `src/project-studio/app/01-studio-shell.js` -- Asset create form, grouped/filterable dense list, warning state rendering.
- `src/project-studio/studio.css` -- Asset Manager layout, rows, aliases, state chips.

**Docs**
- `docs/code-map.md` and `docs/architecture.md` -- updated Asset Manager ownership.
