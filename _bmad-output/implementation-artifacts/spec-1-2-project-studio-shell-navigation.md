---
title: 'Story 1.2: Add Project Studio Shell And Navigation'
type: 'feature'
created: '2026-07-09'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'NO_VCS'
context:
  - '_bmad-output/project-context.md'
  - '_bmad-output/planning-artifacts/architecture/architecture-AutoFlow-2026-07-09/ARCHITECTURE-SPINE.md'
  - '_bmad-output/planning-artifacts/epics.md'
  - 'docs/code-map.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** AutoFlow needs a general Project Studio surface before project-specific characters, places, prompt references, image choices, and video queue states can be made editable. The current side panel remains tied to the legacy generation workflow and has no room for a larger project workspace.

**Approach:** Add a standalone extension page for Project Studio with a compact production shell: top bar, active project selector/readout, left navigation, main workspace, and details inspector. Load the shared `TFProjectDomain` module and render active project state from `autoflowProjectStateV1`. Add a side-panel entry button that opens the Studio page.

## Boundaries & Constraints

**Always:** Preserve Manifest V3 classic scripts, ordered loaders, shared globals, no bundler, and tiny loader files. The Studio shell must read project state through `TFProjectDomain` and must not duplicate storage access.

**Ask First:** Any change to project creation/editing UX, asset upload, prompt-index import, image review selection, video queue execution, legacy queue migration, or extension permissions.

**Never:** Do not change Google Flow generation behavior, auto-generate videos, migrate legacy data, hardcode Jack into new project-aware logic, or change `manifest.json` for this shell.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Side panel opener | User clicks Project Studio in the side panel | Chrome opens `src/project-studio/index.html` as an extension page | Button re-enables if Chrome reports an open failure |
| Fresh project state | `autoflowProjectStateV1` has no projects | Studio loads with no active project selected and zero counts | No exception escapes to the page |
| Existing project state | One or more projects exist | Studio renders active project name, ID, schema info, and project count | Invalid active project is normalized by `TFProjectDomain.load()` |
| Project switch | User selects a different project in the top selector | `TFProjectDomain.setActiveProject()` updates state and the shell re-renders | Missing project ID shows a non-blocking error state |
| Domain unavailable | Shared domain script fails to load | Studio shows an error surface instead of a blank page | No project data writes occur |

</frozen-after-approval>

## Code Map

`src/project-studio/index.html` -- new extension page entry with ordered classic scripts.
`src/project-studio/studio.css` -- Project Studio layout, navigation, workspace, and inspector styling.
`src/project-studio/app/00-studio-state.js` -- Studio state helpers that load/switch active project through `TFProjectDomain`.
`src/project-studio/app/01-studio-shell.js` -- Shell rendering, navigation, project selector, counts, and error state.
`src/project-studio/app/07-studio-boot.js` -- tiny boot loader.
`src/sidepanel/index.html` -- adds Project Studio header button and ordered side-panel opener script.
`src/sidepanel/app/00a-project-studio-link.js` -- opens the Studio extension page from the side panel.
`docs/code-map.md` -- documents the new Studio shell and loader.

## Tasks & Acceptance

**Execution:**
- [x] Add Project Studio page, CSS, and ordered app shards.
- [x] Wire side-panel button to open the Project Studio extension page.
- [x] Render active project state using `TFProjectDomain` only.
- [x] Update `docs/code-map.md`.

**Acceptance Criteria:**
- Given the side panel is open, when the user clicks Project Studio, then Chrome opens `src/project-studio/index.html`.
- Given no projects exist, when Studio loads, then it shows no active project and zero project counts without throwing.
- Given projects exist, when Studio loads, then the active project selector and details inspector show current project state.
- Given the user changes the project selector, when `TFProjectDomain.setActiveProject()` succeeds, then top bar, workspace, and inspector refresh.
- Given changed JavaScript files, `node --check` passes for each changed JS file.

## Verification

- `node --check src/project-studio/app/00-studio-state.js`
- `node --check src/project-studio/app/01-studio-shell.js`
- `node --check src/project-studio/app/07-studio-boot.js`
- `node --check src/sidepanel/app/00a-project-studio-link.js`
- `node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); console.log('manifest ok')"`
- Node script-path check for `src/project-studio/index.html` and `src/sidepanel/index.html`

## Suggested Review Order

**Studio Shell**
- `src/project-studio/index.html` -- standalone extension page and ordered script loader.
- `src/project-studio/studio.css` -- top bar, navigation, workspace, metrics, empty/error states, and inspector.
- `src/project-studio/app/00-studio-state.js` -- `TFProjectDomain`-backed state and active project switching.
- `src/project-studio/app/01-studio-shell.js` -- shell rendering and nav/select events.
- `src/project-studio/app/07-studio-boot.js` -- tiny boot loader.

**Side Panel Entry**
- `src/sidepanel/index.html` -- Project Studio header button and script loader entry.
- `src/sidepanel/app/00a-project-studio-link.js` -- `chrome.tabs.create()` opener.
- `src/sidepanel/styles/05-badges-fixes-animation.css` -- scoped header button sizing override.

**Docs**
- `docs/code-map.md` -- Project Studio ownership and search recipes.
