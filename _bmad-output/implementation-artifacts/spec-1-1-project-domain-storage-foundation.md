---
title: 'Story 1.1: Create Project Domain Storage Foundation'
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

**Problem:** AutoFlow currently stores side-panel queue, batches, gallery, and mapper state in several legacy `chrome.storage.local` keys, but the Project Studio refactor needs a stable project-domain foundation before assets, prompts, variants, and jobs can be safely added. Without this, later stories will invent incompatible storage shapes or couple project identity to display names and filenames.

**Approach:** Add a small DOM-free shared classic-script project-domain module that creates and migrates one versioned storage envelope named `autoflowProjectStateV1`. Load that module before existing background and side-panel logic, expose its API as `globalThis.TFProjectDomain`, and document the new boundary without changing current queue/import/generation behavior yet.

## Boundaries & Constraints

**Always:** Preserve Chrome MV3 classic-script runtime, ordered loaders, shared globals, and tiny loader files. Project identity must use stable opaque `project_id` values; display names and filenames are metadata only. The shared domain module must be safe in both the service worker and extension pages, so it must not access DOM APIs.

**Ask First:** Any change that migrates existing queue, batch, gallery, mapper, Jack-reference, prompt-index, or download data into the new project envelope. Any change to `manifest.json`, extension permissions, or legacy storage key names.

**Never:** Do not introduce npm, TypeScript, ES modules, a bundler, a UI framework, automatic project conversion of existing batches, Project Studio UI, asset CRUD, JSON import refactor, image review, or video queue logic in this story.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Fresh install | `chrome.storage.local` has no `autoflowProjectStateV1` | Domain API initializes a versioned envelope with an empty project list, no active project, and schema metadata | Initialization resolves without throwing |
| Existing envelope | Storage contains a valid `autoflowProjectStateV1` envelope | Domain API normalizes and returns it without changing IDs | Unknown extra fields are preserved |
| Corrupt envelope | Storage key exists but is not an object or has an invalid shape | Domain API falls back to a valid empty envelope and records a migration warning in metadata | No exception escapes to loaders |
| Project create | Caller creates a project with display name | Domain API creates a stable opaque `project_id`, stores display metadata, sets active project when appropriate | Empty names receive a safe default display name |
| Project rename | Caller updates project display metadata | Existing `project_id` remains unchanged and state persists | Missing project ID returns a structured error result |

</frozen-after-approval>

## Code Map

`src/shared/project-domain/00-project-domain.js` -- new DOM-free shared classic script containing schema constants, envelope normalization, ID generation, storage read/write helpers, and `TFProjectDomain` API.

`src/background/runtime.js` -- ordered background loader; add the shared project-domain script before existing runtime shards.

`src/sidepanel/index.html` -- ordered side-panel loader; add the shared project-domain script before `app/00-state-storage.js`.

`docs/code-map.md` -- document the shared project-domain module, loader order, storage envelope, and Story 1.1 search recipes.

## Tasks & Acceptance

**Execution:**
- [x] `src/shared/project-domain/00-project-domain.js` -- add a DOM-free classic-script module exposing `globalThis.TFProjectDomain`.
- [x] `src/background/runtime.js` -- load the shared module via `importScripts("../shared/project-domain/00-project-domain.js", ...)` before existing runtime shards.
- [x] `src/sidepanel/index.html` -- load `../shared/project-domain/00-project-domain.js` before existing side-panel app shards.
- [x] `docs/code-map.md` -- update loading model, shared domain ownership, common edits, and future file rules for project-domain storage.

**Acceptance Criteria:**
- Given the extension loads with no project-domain state, when `TFProjectDomain.load()` runs, then `autoflowProjectStateV1` exists with schema version metadata and a valid empty project-domain state.
- Given a project is created through `TFProjectDomain.createProject()`, when state is persisted and reloaded, then the Project has a stable `project_id` that is not derived from display name or filename.
- Given a Project display name is updated through `TFProjectDomain.updateProject()`, when state is reloaded, then the original `project_id` remains unchanged.
- Given the shared module is loaded in a service worker or extension page, when it initializes, then it exposes APIs under `globalThis.TFProjectDomain` and does not access `document`, `window`, or page DOM APIs.
- Given existing side-panel/background loaders run, when the extension loads, then existing loader order and behavior are preserved after the new shared domain module loads first.

## Spec Change Log

## Verification

**Commands:**
- `node --check src/shared/project-domain/00-project-domain.js` -- expected: syntax check passes.
- `node --check src/background/runtime.js` -- expected: syntax check passes.
- `node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); console.log('manifest ok')"` -- expected: manifest still parses.

**Manual checks:**
- Reload unpacked extension and verify the side panel still opens.
- Inspect `chrome.storage.local` after side-panel load and confirm `autoflowProjectStateV1` is present with schema metadata.

## Suggested Review Order

**Project-domain state**
- Storage envelope and schema constants define the new domain boundary. [`00-project-domain.js:6`](../../src/shared/project-domain/00-project-domain.js#L6)
- Normalization protects fresh, existing, and corrupt envelopes. [`00-project-domain.js:89`](../../src/shared/project-domain/00-project-domain.js#L89)
- Load persists a normalized envelope for extension startup. [`00-project-domain.js:215`](../../src/shared/project-domain/00-project-domain.js#L215)
- Project creation keeps stable opaque IDs. [`00-project-domain.js:222`](../../src/shared/project-domain/00-project-domain.js#L222)
- Public API is exposed under the shared global. [`00-project-domain.js:298`](../../src/shared/project-domain/00-project-domain.js#L298)

**Loader wiring**
- Background loads the shared domain before runtime shards. [`runtime.js:2`](../../src/background/runtime.js#L2)
- Side panel loads the shared domain before app shards. [`index.html:1788`](../../src/sidepanel/index.html#L1788)

**Documentation**
- Code map now records the shared project-domain boundary. [`code-map.md:16`](../../docs/code-map.md#L16)
