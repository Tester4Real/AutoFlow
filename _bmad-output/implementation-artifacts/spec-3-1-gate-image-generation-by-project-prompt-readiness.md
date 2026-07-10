---
title: 'Story 3.1: Gate Image Generation By Project Prompt Readiness'
type: 'feature'
created: '2026-07-10'
status: 'review'
review_loop_iteration: 0
baseline_commit: 'NO_VCS'
context:
  - '_bmad-output/project-context.md'
  - '_bmad-output/planning-artifacts/epics.md'
  - '_bmad-output/planning-artifacts/prds/prd-AutoFlow-project-studio-refactor-2026-07-09/prd.md'
  - '_bmad-output/implementation-artifacts/spec-2-7-resolve-missing-references-into-ready-prompts.md'
  - 'docs/code-map.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** Project Prompt Records now know whether they are Ready or Blocked, but image generation preparation does not yet use that state. Blocked prompts must not enter a generation run or silently skip required references.

**Approach:** Add a Project Studio image generation gate that builds an image-run request plan only from Ready Prompt Records. Request items include resolved Project Asset Files for each resolved reference and exclude Blocked prompts with visible disabled reasons. Store the run plan and mark included prompts as `generating` so Project Studio can show in-progress state.

## Boundaries & Constraints

**Always:** Preserve legacy side-panel generation behavior. Do not attach global Jack references to project-aware image runs.

**Ask First:** Sending the run to Google Flow, uploading Project Asset Files to Flow, persisting generated Image Variants, or changing side-panel queue behavior.

**Never:** Do not include Blocked prompts in run request data. Do not silently skip required references. Do not start video generation.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Ready and Blocked prompts | Mixed Prompt Records | Image run includes only Ready prompts | Blocked prompts remain visible with reasons |
| Ready prompt with Asset Files | Resolved references have active Assets with files | Request item includes resolved Asset File metadata | No global Jack reference |
| Ready prompt without refs | No references | Request item has empty `references` | Valid for projects with no characters |
| No Ready prompts | All prompts blocked/missing | No run created | Specific error shown |
| In-progress run | Run plan created | Included prompts show `Generating`; reference-changing actions can warn/disable later | No Flow call in this story |

</frozen-after-approval>

## Code Map

`src/shared/project-domain/00-project-domain.js` -- persist image generation run plans and prompt record state.
`src/project-studio/app/00-studio-state.js` -- ready-only run planning, reference file request data, generating state.
`src/project-studio/app/01-studio-shell.js` -- Image Generation gate UI and disabled reasons.
`src/project-studio/studio.css` -- image gate styling.
`docs/code-map.md`, `docs/architecture.md`, `docs/project-json-contract.md` -- generation gate ownership.

## Tasks & Acceptance

**Execution:**
- [x] Persist Project image generation run plans.
- [x] Add ready-only image generation request planning.
- [x] Include only resolved Project references and Asset File metadata.
- [x] Render Image Generation gate UI with Ready/Blocked counts and disabled reasons.
- [x] Update docs.

**Acceptance Criteria:**
- Given a Project contains Ready and Blocked prompts, starting image generation planning includes only Ready prompts and leaves Blocked prompts excluded with visible disabled reasons.
- Given a Ready prompt has resolved Asset Files, prepared request data includes only those resolved references and does not attach hardcoded Jack/global references.
- Given image generation planning is in progress, included prompt rows show Generating state.
- Given changed JavaScript files, `node --check` passes for each changed JS file.

## Dev Agent Record

### Debug Log

- 2026-07-10: Continued Story 3.1 from existing implementation state; no sprint-status file exists, so this artifact is the source of story status.
- 2026-07-10: Cleaned avoidable Serena diagnostics from image gate arrays and Project settings access without changing runtime behavior.

### Completion Notes

- Project Domain now persists Project `image_generation_runs`.
- Project Studio state now builds a ready-only image generation gate, resolves reference Asset File metadata, stores an image run plan, and marks included Prompt Records as `generating`.
- Project Studio UI now renders Ready, Blocked, and Generating image gate state with disabled reasons and latest run details.
- Docs and project context now document ready-only project-aware image generation planning and the no-hardcoded-Jack rule.
- Story 3.1 deliberately does not call Google Flow, upload files, persist generated image variants, or start video generation.

### Verification

- Passed: `node --check src/shared/project-domain/00-project-domain.js`
- Passed: `node --check src/shared/project-domain/01-project-json-contract.js`
- Passed: `node --check src/project-studio/app/00-studio-state.js`
- Passed: `node --check src/project-studio/app/01-studio-shell.js`
- Passed: `manifest.json` parse.
- Passed: Project Studio loader path check for all script tags.
- Passed: VM smoke test for mixed Ready/Blocked prompts, resolved Asset File metadata, no-file resolved Asset exclusion, no hardcoded Jack reference, run persistence, and included Prompt Records marked `generating`.
- Serena diagnostics: new Story 3.1 diagnostics cleared; remaining diagnostics are pre-existing classic-JS/global inference false positives in `src/shared/project-domain/00-project-domain.js` and unrelated helpers in `src/project-studio/app/00-studio-state.js`.

## File List

- `_bmad-output/implementation-artifacts/spec-3-1-gate-image-generation-by-project-prompt-readiness.md`
- `_bmad-output/project-context.md`
- `docs/architecture.md`
- `docs/code-map.md`
- `docs/project-json-contract.md`
- `src/project-studio/app/00-studio-state.js`
- `src/project-studio/app/01-studio-shell.js`
- `src/project-studio/studio.css`
- `src/shared/project-domain/00-project-domain.js`

## Change Log

- 2026-07-10: Implemented Project Studio image generation readiness gate and marked Story 3.1 ready for review.

## Status

review
