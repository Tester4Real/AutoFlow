---
title: "AutoFlow Project Studio Experience"
status: final
created: "2026-07-09"
updated: "2026-07-09"
sources:
  - "../../prds/prd-AutoFlow-project-studio-refactor-2026-07-09/prd.md"
  - "../../../project-context.md"
  - "../../../brainstorming/brainstorm-general-projects-refactor-2026-07-09/.memlog.md"
---

# EXPERIENCE.md: AutoFlow Project Studio

## Foundation

AutoFlow has two coordinated surfaces:

- **Side Panel** - A narrow Chrome side panel for current project status, queue operation, connection/account state, Sync Folder, Retry Failed, and quick entry into Project Studio.
- **Project Studio** - A larger full extension page/tab for project setup, asset management, JSON import/resolution, image variant review, video queue preparation, and gallery/download inspection.

The UX inherits the visual identity from `DESIGN.md`. Visual states reference tokens such as `{colors.blocked}`, `{colors.selected}`, `{colors.primary}`, `{components.tool-panel}`, and `{components.selected-variant}`.

The UI system is plain browser HTML/CSS/JS within the existing Chrome MV3 extension. [ASSUMPTION: UX should not require a third-party component library or build tool.]

## Information Architecture

### Surface Map

| Surface | Purpose | Reached From |
|---|---|---|
| Side Panel - Operations | Active Project, connection status, queue summary, run/stop/retry, Sync Folder, Open Project Studio | Chrome side panel |
| Project Studio - Project Settings | Project metadata, output naming defaults, Flow context visibility | Studio nav |
| Project Studio - Assets | Create/edit typed Assets, aliases, manual file uploads | Studio nav |
| Project Studio - Import / Resolve | Import JSON, resolve references, block prompts with missing refs | Studio nav, side panel Import |
| Project Studio - Image Review | Compare generated variants and select canonical images | Studio nav, Gallery, import completion |
| Project Studio - Video Queue Builder | Create and prepare video drafts from selected variants | Studio nav, Image Review |
| Project Studio - Gallery / Downloads | Inspect generated media, selected outputs, downloads, Sync Folder repair | Studio nav, side panel Gallery status |
| Details Inspector | Edit or inspect selected project, asset, prompt, variant, or job | Right panel in Studio |

### Global Navigation

Project Studio uses:

- Top bar: active Project selector, Flow context indicator, blocked prompt count, queue count, primary action for current section.
- Left nav: Project Settings, Assets, Import / Resolve, Image Review, Video Queue, Gallery / Downloads.
- Main workspace: section-specific rows, grids, or queues.
- Right details inspector: contextual edit/review panel.

The side panel uses:

- Active Project selector.
- Connection/account state.
- Compact queue summary.
- Current blockers and failed jobs.
- Import JSON, Open Project Studio, Sync Folder, Retry Failed, Run/Stop controls.

## Voice and Tone

Tone is operational, compact, and specific. Avoid cheerleading and vague encouragement.

| Do | Don't |
|---|---|
| "3 prompts blocked: missing bedroom." | "Something went wrong." |
| "Upload reference files for bedroom." | "Let's add your creative assets!" |
| "Video draft needs selected image." | "Video not ready." |
| "Selected scene_04__2.png for scene_04.png." | "Great choice!" |
| "Flow context changed. Reupload references before running." | "References may have an issue." |

Use the user's terms consistently: Project, Asset, Reference, Prompt, Variant, Selected Variant, Video Draft, Queue, Flow Context.

## Component Patterns

### Project Selector

- Shows active Project name and status counts.
- Supports create, switch, and search.
- Switching Project changes visible assets, imports, review state, video drafts, and gallery.
- If current queue is running, switching Project does not stop the queue; show a warning if the switch hides active work.

### Asset Manager

- Default layout is a dense list with optional thumbnail preview, not a visual-only gallery.
- Asset rows show type, display name, aliases, file count, usage count, and warning state.
- Asset edit opens in the details inspector or a single dialog, never nested modals.
- Asset deletion requires showing affected prompts/jobs first.
- Manual upload is the only way to resolve a missing reference into an Asset.

### JSON Import / Resolve

- Import result is a resolution report, not just a success toast.
- Group prompt records into Ready and Blocked.
- For each blocked prompt, show missing reference names and affected file names.
- Resolving a missing reference is done by mapping to an existing Asset or uploading/editing an Asset manually.
- A blocked prompt cannot be sent to image generation.

### Image Review

- MVP layout is a scene-row board.
- Each row contains expected file name, prompt excerpt, reference chips, two variant slots, selected state, and video readiness.
- Variant thumbnails have stable aspect ratio and fixed slot dimensions.
- Selecting a variant updates metadata and shows explicit "Selected" state.
- Non-selected variants remain visible and recoverable.

### Video Queue Builder

- Shows only prompts with `animation_prompt`.
- Prompts without Selected Variant are Not Ready.
- Prompts with Selected Variant become Video Drafts.
- Video Drafts do not auto-run.
- User can add drafts to the queue, remove them, reorder them, or leave them unqueued.
- If Selected Variant changes before run, the draft updates or becomes Needs Review.
- If a video is already running/done, selection changes do not mutate that job.

### Details Inspector

- Uses one right-side panel for selected item details.
- Shows dependencies and consequences, especially when renaming aliases, changing selected variants, deleting assets, or reusing cached Flow media.
- Offers focused actions, not navigation.

## State Patterns

### Prompt States

| State | Meaning | Required UX |
|---|---|---|
| Ready | Prompt can generate images | Normal row; enabled Generate action |
| Blocked | Required reference unresolved | `{colors.blocked}` row; disabled Generate; visible missing refs |
| Generating | Image generation in progress | Progress indicator; disable destructive changes |
| Generated | Variants exist | Link to Image Review |
| Needs Review | Variant selection or video dependency needs user decision | Warning badge and action |

### Asset States

| State | Meaning | Required UX |
|---|---|---|
| Complete | Has usable file(s) | Normal row |
| No files | Asset exists but no uploaded file | Warning state; prompts depending on it blocked |
| In use | Referenced by imported prompts/jobs | Show usage count |
| Stale Flow upload | Upload cache may not match current Flow Context | Needs Reference Upload warning |

### Variant States

| State | Meaning | Required UX |
|---|---|---|
| Unselected | Variant exists but is not canonical | Thumbnail available, no final badge |
| Selected | Canonical image for prompt | `{components.selected-variant}` and explicit label |
| Missing local file | Metadata exists but local/downloaded file cannot be found | Warning and Sync Folder action |

### Video Job States

| State | Meaning | Required UX |
|---|---|---|
| Not Ready | Missing Selected Variant or animation prompt | Disabled queue action with reason |
| Draft | Can be reviewed before queueing | Add to Queue action |
| Ready | Queued or queueable | Enabled queue/run action |
| Needs Review | Upstream selection/reference changed | Warning and update/recreate action |
| Running | Generation active | Stop/status controls |
| Failed | Generation failed | Retry and error detail |
| Complete | Output exists | Download/gallery link |

### Flow Context States

- Connected: current Flow tab/project available.
- Disconnected: no suitable Flow tab/project found.
- Stale Context: Project state references cached media from another Flow Context.
- Needs Reference Upload: local Asset Files or Selected Variants must be uploaded/relinked before job can run.

## Interaction Primitives

- **Select Project** - Updates all Studio sections and side-panel summaries.
- **Create Asset** - Choose type, name, aliases, upload files, save.
- **Upload Asset File** - Manual file picker/drop zone; no automatic placeholder assets.
- **Import JSON** - Parse, resolve references, create Ready/Blocked prompt records.
- **Resolve Missing Reference** - Map to existing Asset or manually create/upload Asset, then re-run resolution.
- **Generate Images** - Runs only Ready prompts.
- **Select Variant** - Marks Selected Variant metadata; keeps alternates.
- **Create/Update Video Draft** - Uses Selected Variant and animation prompt.
- **Add To Queue** - Moves Video Draft into queue by explicit user action.
- **Sync Folder** - Repairs local media, thumbnails, and selected mapping where possible.
- **Retry Failed** - Retries failed jobs within current Project and Flow Context.

Keyboard shortcuts are optional for MVP. If added later, they must never be the only way to complete a task.

## Accessibility Floor

- Every state indicated by color also has text and/or icon.
- Image variant thumbnails have accessible labels that include prompt filename, variant number, and selected state.
- Upload and queue controls are keyboard reachable.
- Focus order follows the visible layout: top bar, left nav, main row list, row actions, details inspector.
- Disabled controls include a visible reason, such as "Missing bedroom reference."
- Dialogs/drawers trap focus and return focus to the invoking control when closed.
- Confirmation for destructive actions states exactly what will be affected.
- Long prompt text and filenames are readable through expansion, tooltip, or details inspector.

## Key Flows

### Flow 1: Create Project And Assets

**Protagonist:** Nas preparing a new production project with optional characters and places.

1. Nas opens the side panel and clicks Open Project Studio.
2. In Project Studio, Nas creates a Project.
3. Nas opens Assets and adds a Character, a Place, or no Assets at all depending on the project.
4. Nas uploads reference files manually and adds aliases.
5. The Assets list shows usable Assets and any missing-file warnings.

**Climax:** Nas has a reusable project library that JSON imports can reference.

### Flow 2: Import JSON And Resolve Missing References

**Protagonist:** Nas importing scene JSON that references project assets.

1. Nas opens Import / Resolve and imports JSON.
2. AutoFlow parses Prompt Records and resolves reference names against Project Assets.
3. Ready prompts appear in the Ready group.
4. Missing references appear in the Blocked group with affected prompts.
5. Nas manually uploads or maps missing Assets.
6. AutoFlow re-runs resolution and moves fixed prompts to Ready.

**Climax:** Blocked prompts cannot generate until their listed references resolve.

### Flow 3: Generate Images And Select Variants

**Protagonist:** Nas choosing the best visual take before making videos.

1. Nas generates images for Ready prompts.
2. AutoFlow creates two Image Variants per prompt.
3. Nas opens Image Review in Project Studio.
4. Each prompt row shows prompt, references, expected filename, and two variant thumbnails.
5. Nas selects the best variant.
6. AutoFlow stores Selected Variant metadata and updates video readiness.

**Climax:** The selected image becomes the canonical image for that prompt without deleting alternates.

### Flow 4: Build And Run Video Queue

**Protagonist:** Nas preparing video jobs deliberately.

1. Nas opens Video Queue Builder.
2. Prompts with Selected Variant and animation prompt show as Video Drafts.
3. Prompts without Selected Variant show Not Ready with reason.
4. Nas reviews drafts and adds chosen jobs to the queue.
5. Nas starts video generation manually.
6. Failed jobs remain visible for retry.

**Climax:** Videos run only from selected images and only when Nas starts them.

### Flow 5: Recover After Account Or Project Switch

**Protagonist:** Nas switched Google accounts or Flow projects and needs to continue.

1. Side panel shows changed or stale Flow Context.
2. Nas opens Project Studio or uses Sync Folder.
3. AutoFlow identifies selected images, local files, and jobs needing reference upload/relink.
4. Nas repairs missing local links or reuploads references.
5. Failed or stale video jobs become retryable in the current Flow Context.

**Climax:** Local Project state survives account/project changes.

## Responsive And Platform

- Side panel is narrow and single-column. It must not contain the full Image Review workflow.
- Project Studio targets a larger browser tab. It should remain usable at laptop width.
- At narrow widths, Project Studio left nav can collapse, but Image Review still needs stable variant comparison; if too narrow, rows stack one prompt at a time.
- Project Studio should not rely on browser file-system permissions beyond current extension/download behavior unless architecture explicitly adds them later.

## Key Screen Wireframes

See `wireframes/key-screens.md`. These wireframes are behavioral references; `DESIGN.md` and `EXPERIENCE.md` are the source of truth on conflict.

## Open Questions

1. Should selecting a variant automatically create a Video Draft, or should the user click "Create Video Draft"?
2. Should Project Studio be opened only from the side panel or also from the extension action/menu?
3. Should Asset aliases be unique across the Project or unique per Asset type?
4. Should legacy Jack workflows migrate automatically to a Project Asset?
5. Should Image Review MVP use row board only, or include a grid board toggle?
