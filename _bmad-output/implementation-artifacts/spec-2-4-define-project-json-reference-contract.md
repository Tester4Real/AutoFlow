---
title: 'Story 2.4: Define Project JSON Reference Contract'
type: 'feature'
created: '2026-07-10'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'NO_VCS'
context:
  - '_bmad-output/project-context.md'
  - '_bmad-output/planning-artifacts/epics.md'
  - '_bmad-output/planning-artifacts/prds/prd-AutoFlow-project-studio-refactor-2026-07-09/prd.md'
  - '_bmad-output/implementation-artifacts/spec-2-3-edit-assets-aliases-safe-deletion.md'
  - 'docs/code-map.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** Project-aware JSON import needs a stable reference contract before import/resolution code is built. Without a contract, future stories may disagree on field names, alias scope, missing-reference behavior, and whether legacy Jack behavior applies.

**Approach:** Define the contract in docs and executable shared code. Canonical reference field is `references`; compatibility fields are accepted and normalized. Aliases are unique per Asset type. Prompt records without references remain valid with no hardcoded Jack/global reference. Legacy Jack behavior is explicitly scoped to the existing side-panel importer.

## Boundaries & Constraints

**Always:** Keep this contract DOM-free and loadable in extension pages/service worker. Do not change legacy import behavior yet.

**Ask First:** Replacing the side-panel legacy importer, importing Prompt Records into Projects, resolving Assets, blocking generation, or migrating Jack compatibility.

**Never:** Do not auto-attach `assets/reference/Jack.jpg` for new project-aware imports; do not create placeholder Assets/files.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Canonical references | Record uses `references` | Parser normalizes references with name/type/required | Invalid references produce specific errors |
| Compatibility fields | Record uses `refs` or `reference_names` | Parser accepts and warns canonical field is `references` | No mutation of input object required |
| No references | Record omits reference field | Record remains valid with `references: []` | No hardcoded Jack/global reference |
| Alias ambiguity policy | Multiple types share alias | Contract says aliases are unique per type; untyped ambiguous refs block later | Resolution deferred to later story |
| Legacy importer | Existing prompt-index JSON path | Behavior unchanged but documented as legacy boundary | No migration in this story |

</frozen-after-approval>

## Code Map

`src/shared/project-domain/01-project-json-contract.js` -- executable DOM-free parser and constants.
`src/background/runtime.js`, `src/sidepanel/index.html`, `src/project-studio/index.html` -- ordered loader wiring.
`docs/project-json-contract.md` -- human-readable contract.
`docs/code-map.md`, `docs/architecture.md` -- ownership and loader documentation.

## Tasks & Acceptance

**Execution:**
- [x] Add shared project JSON contract parser/constants.
- [x] Load the contract after `TFProjectDomain` in background, side panel, and Project Studio.
- [x] Document accepted reference fields, alias scope, empty-reference behavior, and legacy Jack boundary.
- [x] Update architecture/code map.

**Acceptance Criteria:**
- Given project-aware JSON import is about to be implemented, accepted reference field names and alias scope are documented.
- Given a prompt has no reference list, parser treats it as valid with empty references and no hardcoded global character.
- Given legacy Jack behavior still exists, new project-aware contract explicitly does not attach `assets/reference/Jack.jpg` unless mapped by Project Asset or migration.
- Given changed JavaScript files, `node --check` passes for each changed JS file.

## Verification

- `node --check src/shared/project-domain/01-project-json-contract.js`
- `node --check src/background/runtime.js`
- `node --check src/shared/project-domain/00-project-domain.js`
- VM smoke test: parse prompt JSON with no references, parse compatibility `refs`, assert alias scope is `per_asset_type`.
- Loader path check for `src/background/runtime.js`, `src/project-studio/index.html`, and `src/sidepanel/index.html`.
- `node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); console.log('manifest ok')"`

## Suggested Review Order

**Executable Contract**
- `src/shared/project-domain/01-project-json-contract.js` -- constants and parser for project-aware prompt JSON.

**Loader Wiring**
- `src/background/runtime.js`
- `src/sidepanel/index.html`
- `src/project-studio/index.html`

**Docs**
- `docs/project-json-contract.md`
- `docs/code-map.md`
- `docs/architecture.md`
- `_bmad-output/project-context.md`
