# Input Reconciliation - Project Studio Refactor

## Inputs Checked

- `_bmad-output/project-context.md`
- `_bmad-output/brainstorming/brainstorm-general-projects-refactor-2026-07-09/.memlog.md`
- `README.md`
- `docs/architecture.md`
- `docs/code-map.md`

## Coverage Summary

- The PRD preserves project-context constraints: Chrome MV3, plain classic JavaScript, no bundler, ordered loaders, shared globals, code-map-first edits, exact filename behavior, and account-switch recovery.
- The PRD captures user decisions from the brainstorm: larger Project Studio page, manual asset upload, required JSON references, blocked prompts for missing refs, no auto-created placeholders, and manual video queue execution.
- The PRD adapts the existing prompt-index JSON workflow into a general project-aware import flow without retaining Jack as a hardcoded universal reference.
- The PRD preserves the existing two-variant image generation behavior and formalizes selection as canonical metadata.
- The PRD keeps video reference handling conservative: selected image as start frame by default, advanced modes deferred.

## Known Gaps Preserved as Open Questions

- Legacy Jack migration behavior.
- Preferred JSON field name.
- Asset alias uniqueness rules.
- Exact Project Studio entry points.
- Whether selected image should auto-create a Video Draft or require a click.
- First Image Review layout.
