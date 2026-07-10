---
title: "AutoFlow Project Studio Refactor Addendum"
created: "2026-07-09"
updated: "2026-07-09"
---

# AutoFlow Project Studio Refactor Addendum

## Source Boundary

Inputs used:

- `_bmad-output/project-context.md`
- `_bmad-output/brainstorming/brainstorm-general-projects-refactor-2026-07-09/.memlog.md`
- `README.md`
- `docs/architecture.md`
- `docs/code-map.md`

No code was modified during this PRD run.

## Product Decisions From Brainstorming

- Refactor away from a single hardcoded character/channel workflow.
- Add Projects as the top-level container.
- A Project can have zero characters.
- Project Assets can include characters, places, props, styles, and generic references.
- Users manually upload Assets.
- JSON-listed references are required by default.
- Missing JSON references block affected prompts.
- Missing references should not auto-create placeholder uploads.
- Image Review belongs in a larger full extension page/tab.
- Side panel remains a lightweight operations cockpit.
- Image generation can keep two variants per prompt.
- User selects the best variant before video queue preparation.
- Video generation should not run automatically.
- Video jobs should be added to queue manually.
- Default video continuity should use the selected image as start frame.

## Design Notes for Architecture

- Use stable internal IDs: `project_id`, `asset_id`, `file_id`, `prompt_id`, `variant_id`, and `job_id`.
- Treat display names, aliases, and file names as mutable labels.
- Keep selected image as metadata first; avoid destructive local renames on click.
- Cache Flow media/upload IDs per Flow Context because account/project switches can invalidate IDs.
- Preserve current ordered classic-script architecture unless a future architecture PRD explicitly changes it.

## Deferred Ideas

- Optional references in JSON.
- Advanced video reference modes.
- Automatic conversion of legacy Jack imports.
- Full export packaging.
- Cloud sync or multi-user collaboration.
- ES module/bundler refactor.
