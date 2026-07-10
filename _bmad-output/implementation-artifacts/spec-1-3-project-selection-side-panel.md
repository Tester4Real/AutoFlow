---
title: 'Story 1.3: Add Project Selection To Side Panel'
type: 'feature'
created: '2026-07-09'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'NO_VCS'
context:
  - '_bmad-output/project-context.md'
  - '_bmad-output/planning-artifacts/epics.md'
  - 'docs/code-map.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** The side panel is still the operational cockpit, but it has no visible active Project state. Users need to see and switch the active Project without losing access to connection, queue, run, stop, retry, and Sync Folder controls.

**Approach:** Add a compact Project strip below the side-panel header. It loads project state through `TFProjectDomain`, shows the active Project selector/status, allows creating a default Project, switches active Project by stable `project_id`, and warns before switching while queue work appears active.

## Boundaries & Constraints

**Always:** Keep existing side-panel controls reachable, preserve ordered classic scripts, and write project state only through `TFProjectDomain`.

**Ask First:** Any migration of queue/gallery/import data into project scope, any rename/settings editor, or any change to generation behavior.

**Never:** Do not stop active queue work when switching Projects, change `project_id`, add a framework, or alter `manifest.json`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| No Projects | Empty `autoflowProjectStateV1` | Side panel shows no Project and enables default Project creation | Storage/domain errors show compact status |
| One Project | Existing active Project | Selector shows the current Project and status text | Invalid active id normalized by domain load |
| Multiple Projects | User selects another Project | Active Project changes through `setActiveProject()` without ID mutation | Missing Project shows non-blocking error status |
| Running work | Queue/batch/generation appears active | Switch asks for confirmation and does not stop work | Cancel restores selector to current active Project |
| Future listeners | Project changes | `TF_PROJECT_CHANGED` event dispatches with active project details | Event failure does not block selector |

</frozen-after-approval>

## Code Map

`src/sidepanel/index.html` -- Project strip markup and ordered loader entry.
`src/sidepanel/app/00b-project-selector.js` -- side-panel project load/create/switch behavior.
`src/sidepanel/styles/05-badges-fixes-animation.css` -- compact dark-theme Project strip styling.
`docs/code-map.md` -- side-panel project selector ownership.

## Tasks & Acceptance

**Execution:**
- [x] Add side-panel Project strip markup.
- [x] Add ordered project selector shard after shared helpers.
- [x] Add compact styling without hiding existing controls.
- [x] Update `docs/code-map.md`.

**Acceptance Criteria:**
- Given the side panel loads with one Project, then the selector shows the active Project status.
- Given multiple Projects exist, when the user switches active Project, then `project_id` remains stable and the selector/status update.
- Given queue work appears active, when the user switches Project, then the UI warns and does not stop work.
- Given changed JavaScript files, `node --check` passes for each changed JS file.

## Verification

- `node --check src/shared/project-domain/00-project-domain.js`
- `node --check src/sidepanel/app/00a-project-studio-link.js`
- `node --check src/sidepanel/app/00b-project-selector.js`
- `node --check src/project-studio/app/00-studio-state.js`
- `node --check src/project-studio/app/01-studio-shell.js`
- `node --check src/project-studio/app/07-studio-boot.js`
- Node script-path check for `src/project-studio/index.html` and `src/sidepanel/index.html`

## Suggested Review Order

**Side Panel Project Strip**
- `src/sidepanel/index.html` -- Project strip placement below the existing header.
- `src/sidepanel/app/00b-project-selector.js` -- domain-backed load/create/switch behavior and running-work warning.
- `src/sidepanel/styles/05-badges-fixes-animation.css` -- compact strip styling.

**Project Studio Linkage**
- `src/sidepanel/app/00a-project-studio-link.js` -- Studio opener still loaded before project selector.
- `docs/code-map.md` -- updated side-panel selector ownership.
