---
title: 'Story 1.4: Edit Project Metadata Safely'
type: 'feature'
created: '2026-07-09'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'NO_VCS'
context:
  - '_bmad-output/project-context.md'
  - '_bmad-output/planning-artifacts/epics.md'
  - '_bmad-output/planning-artifacts/prds/prd-AutoFlow-project-studio-refactor-2026-07-09/prd.md'
  - 'docs/code-map.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** Projects now exist and can be selected, but the larger Project Studio has no safe way to edit Project display metadata. Renaming a Project must not affect stable identity or future references from prompts, assets, variants, jobs, or downloaded media.

**Approach:** Add a Project Settings form in Project Studio for the active Project display name. Save through `TFProjectDomain.updateProject()` and re-render the top selector, readout, workspace facts, and details inspector from the returned state. Show the stable `project_id` as read-only identity, not an editable name.

## Boundaries & Constraints

**Always:** Preserve stable `project_id`, ordered classic scripts, no bundler, no permissions changes, and project writes through `TFProjectDomain`.

**Ask First:** Any new settings field beyond display name, any migration of existing queue/gallery/import records, or any destructive rename of local generated files.

**Never:** Do not key media mappings by Project display name, change `project_id`, alter generation behavior, or add framework/toolchain dependencies.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Active Project | User edits display name and saves | `display_name` updates, `project_id` remains unchanged, Studio re-renders | Save status shows success |
| Empty name | User submits blank display name | Domain applies safe default display name | No blank selector option persists |
| Long name | User enters long display name | UI wraps/truncates safely without resizing controls incoherently | Full value remains readable in input/details |
| Missing Project | Active Project missing before save | Save is blocked with a visible error | No storage write attempted |
| Domain failure | Storage/API failure during save | Error shown in the form/status area | Existing rendered state remains visible |

</frozen-after-approval>

## Code Map

`src/project-studio/app/00-studio-state.js` -- add active Project update helper through `TFProjectDomain.updateProject()`.
`src/project-studio/app/01-studio-shell.js` -- render and bind Project Settings form, save status, and refreshed metadata.
`src/project-studio/studio.css` -- style compact settings form, stable ID row, long-name handling.
`docs/code-map.md` -- document Project metadata edit ownership.

## Tasks & Acceptance

**Execution:**
- [x] Add state helper for active Project metadata updates.
- [x] Render Project Settings form only in Project view.
- [x] Bind save behavior and refresh shell from saved domain state.
- [x] Add CSS for long names and compact form layout.
- [x] Update `docs/code-map.md`.

**Acceptance Criteria:**
- Given an existing Project, when the user edits Project display metadata in Project Studio, then the original `project_id` is retained and the updated metadata persists.
- Given references may later belong to a Project, when display name changes, then no code keys mappings by display name.
- Given long Project names, when Project Settings renders, then text remains readable without resizing buttons or breaking layout.
- Given changed JavaScript files, `node --check` passes for each changed JS file.

## Verification

- `node --check src/project-studio/app/00-studio-state.js`
- `node --check src/project-studio/app/01-studio-shell.js`
- `node --check src/sidepanel/app/00b-project-selector.js`
- `node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); console.log('manifest ok')"`
- Node smoke test: create Project, update `display_name`, assert `project_id` remains stable.
- Node script-path check for `src/project-studio/index.html` and `src/sidepanel/index.html`

## Suggested Review Order

**Project Settings Edit**
- `src/project-studio/app/00-studio-state.js` -- `updateActiveProject()` wrapper through `TFProjectDomain.updateProject()`.
- `src/project-studio/app/01-studio-shell.js` -- Project Settings form, save handling, and project-domain storage refresh hook.
- `src/project-studio/studio.css` -- compact form, stable ID row, long-name-safe layout.

**Cross-Page Refresh**
- `src/sidepanel/app/00b-project-selector.js` -- storage refresh hook so side-panel Project selector sees Studio renames.

**Docs**
- `docs/code-map.md` -- Project Settings edit ownership.
