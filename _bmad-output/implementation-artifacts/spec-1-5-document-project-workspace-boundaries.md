---
title: 'Story 1.5: Document Project Workspace Boundaries'
type: 'chore'
created: '2026-07-09'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'NO_VCS'
context:
  - '_bmad-output/project-context.md'
  - '_bmad-output/planning-artifacts/epics.md'
  - 'docs/code-map.md'
  - 'docs/architecture.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** Epic 1 added a shared project-domain module, Project Studio page, and side-panel project selector. The documentation must show the new boundaries so future stories edit the right files and do not bury feature logic in loaders.

**Approach:** Update the architecture/code-map documentation to reflect the shared project domain, standalone Project Studio, side-panel selector, and ordered loader responsibilities. Keep docs concise and implementation-facing.

## Boundaries & Constraints

**Always:** Document actual files and loader order. Keep loader files described as tiny maps/loaders.

**Never:** Do not document planned asset/import/review/video features as implemented.

</frozen-after-approval>

## Code Map

`docs/architecture.md` -- high-level architecture and edit boundaries.
`docs/code-map.md` -- detailed shard ownership already updated during Stories 1.2-1.4.

## Tasks & Acceptance

**Execution:**
- [x] Update architecture docs with shared project-domain and Project Studio boundaries.
- [x] Confirm code-map already reflects actual loader order and shard ownership.

**Acceptance Criteria:**
- Given future implementation starts, when docs are read, then Project Studio and project-domain ownership are visible.
- Given loader files exist, when docs describe them, then they remain documented as loaders rather than feature-logic homes.

## Verification

- `rtk rg -n "project-domain|Project Studio|autoflowProjectStateV1|src/project-studio|TFProjectDomain" docs/architecture.md docs/code-map.md`
- `node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); console.log('manifest ok')"`

## Suggested Review Order

**Docs**
- `docs/architecture.md` -- high-level Project Studio and project-domain boundaries.
- `docs/code-map.md` -- detailed shard map already aligned during Stories 1.2-1.4.
