# Architecture Reconciliation

Run: `architecture-AutoFlow-2026-07-09`

## Inputs Checked

| Input | Landed In Spine |
| --- | --- |
| `_bmad-output/project-context.md` | AD-8 and AD-10 preserve MV3, classic scripts, ordered loaders, shared globals, content-script boundaries, no bundler, and docs/code-map discipline. |
| Project Studio PRD | AD-1 through AD-7 cover projects, typed assets, required refs, two variants, metadata selection, manual video queue, gallery/download recovery, and Flow-context caches. |
| UX `DESIGN.md` and `EXPERIENCE.md` | AD-3 fixes the two-surface model; state machine and capability map cover blocked refs, selected variants, video drafts, queue states, and stale Flow context. |
| `manifest.json` | Stack and AD-8 retain Manifest V3, side panel, current permissions posture, service worker, and content-script registration model. |
| `docs/architecture.md` and `docs/code-map.md` | Structural seed preserves existing background, content, side panel, loader, and shard boundaries while adding Project Studio and shared project-domain seed files. |
| Chrome official docs | Stack and memlog verify service worker `importScripts()`, `side_panel.default_path`, and MAIN/ISOLATED content-script execution worlds. |

## Decisions Preserved

- Projects are the top-level state boundary and may have zero characters.
- Assets are typed and manually uploaded; missing JSON refs do not create automatic placeholder uploads.
- JSON-listed refs are required by default and block affected prompts.
- Current two-image-variant behavior remains the MVP baseline.
- Variant selection is metadata-first and keeps alternates.
- Video generation is draft/queue/manual, never automatic after image generation.
- Selected image is the MVP video start frame; advanced video reference modes are deferred.
- Flow media IDs are context-specific caches, not durable source of truth.
- Loader order and classic-script runtime stay intact.

## Remaining Product Decisions

These are intentionally deferred rather than invented in the architecture:

- Preferred JSON reference field naming and normalization.
- Whether selecting a variant auto-creates a Video Draft or requires an explicit command.
- Automatic migration of legacy Jack prompt-index imports into normal Project Assets.
- Optional references and advanced video reference modes.
