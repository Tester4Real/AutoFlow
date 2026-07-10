---
title: "AutoFlow Project Studio Refactor PRD"
status: "final"
created: "2026-07-09"
updated: "2026-07-09"
project_name: "AutoFlow"
source_bound: true
sources:
  - "_bmad-output/project-context.md"
  - "_bmad-output/brainstorming/brainstorm-general-projects-refactor-2026-07-09/.memlog.md"
  - "README.md"
  - "docs/architecture.md"
  - "docs/code-map.md"
---

# PRD: AutoFlow Project Studio Refactor

## 0. Document Purpose

This PRD defines a brownfield refactor of AutoFlow from a one-character, one-channel workflow into a general project-based production workspace. It is for downstream BMAD architecture, epics, and implementation stories. It does not modify code; it captures requirements and constraints for the refactor.

The main source inputs are `_bmad-output/project-context.md` and the BMAD brainstorming session for the project-based refactor. Existing AutoFlow constraints still apply: Chrome MV3, plain classic JavaScript, ordered shards, shared globals, tiny loaders, no bundler, and source-local changes guided by `docs/code-map.md`.

## 1. Vision

AutoFlow should become a reusable production workspace for Google Flow projects. Instead of being tied to one bundled character reference or one YouTube-channel workflow, it should let the operator create projects, define optional reusable assets, import scene JSON that references those assets, generate image variants, select the best images in a larger review page, and then manually prepare video jobs from those selected images.

The product shape is **Project Studio**: a larger full extension page for project setup, assets, JSON mapping, image review, and video queue preparation. [ASSUMPTION: Project Studio is the working name for the larger full extension page.] The existing side panel remains the lightweight operations cockpit for connection state, current project selection, queue status, run/stop/retry actions, and opening Project Studio.

The refactor should make the system more general without losing the reliability of the current prompt-index workflow: exact filenames, gallery/download repair, account-switch recovery, and conservative handling of Google Flow references.

## 2. Target User

### 2.1 Jobs To Be Done

- As a creator, I need separate projects so I can reuse AutoFlow for different channels, stories, styles, or campaigns without hardcoded character assumptions.
- As a creator, I need to define characters, places, props, styles, or generic references per project so each prompt can include the right references.
- As a creator, I need projects with zero characters to work normally, because some projects are product, place, style, or prompt-only workflows.
- As a creator, I need JSON imports to say which references each prompt requires so the extension attaches the right files and blocks unsafe missing-reference jobs.
- As a creator, I need a large review page to compare generated image variants and choose the best one before any video job is created.
- As a creator, I need video jobs to be added to a queue manually, not generated automatically after image generation.
- As the maintainer, I need the refactor to preserve the current Chrome MV3 architecture, ordered shards, exact filename behavior, and account-switch recovery paths.

### 2.2 Non-Users

- Users who want a hosted multi-user production manager.
- Users who want automatic video generation immediately after every image batch.
- Users who want the extension to create or infer missing reference assets without manual upload.
- Users who need non-Chrome or non-Google-Flow workflows in this refactor.

### 2.3 Key User Journeys

- **UJ-1. Nas creates a reusable project library.**
  - **Persona + context:** Nas is preparing a new story/channel/campaign and wants AutoFlow to stop assuming a single bundled character.
  - **Entry state:** AutoFlow is loaded as an unpacked Chrome extension and Google Flow is available in Chrome.
  - **Path:** Nas opens Project Studio, creates a project, adds optional assets such as characters, places, props, style references, or generic references, and uploads reference files manually.
  - **Climax:** The project has a reusable asset library with stable names/aliases that JSON imports can reference.
  - **Resolution:** Nas can import prompts into this project without touching global hardcoded reference logic.

- **UJ-2. Nas imports scene JSON and resolves missing references.**
  - **Persona + context:** Nas has a prompt JSON where each scene can list required references.
  - **Entry state:** The project exists; some referenced assets may already be uploaded and some may be missing.
  - **Path:** Nas imports JSON, AutoFlow resolves listed references to project assets, and affected prompts are marked Ready or Blocked.
  - **Climax:** Missing references block only the prompts that need them, and the Resolve References view tells Nas exactly what to upload manually.
  - **Resolution:** Once assets are uploaded/resolved, blocked prompts become ready for image generation.

- **UJ-3. Nas reviews image variants before creating videos.**
  - **Persona + context:** AutoFlow generates two image variants per prompt, and Nas wants to choose the better one for the final video.
  - **Entry state:** Image generation has completed and variants are available.
  - **Path:** Nas opens the larger Image Review page, compares variants by scene/prompt, selects the preferred image, and can change selection before video work begins.
  - **Climax:** The selected variant becomes the canonical image for that scene through metadata, without destroying alternates.
  - **Resolution:** Video drafts can be prepared from selected images and animation prompts.

- **UJ-4. Nas builds a video queue deliberately.**
  - **Persona + context:** Nas wants control over when videos are generated and does not want bad images to trigger video generation.
  - **Entry state:** A scene has a selected image variant and an animation prompt.
  - **Path:** AutoFlow creates a draft/ready video job using the selected image as start frame; Nas reviews, adds it to the queue, reorders/removes if needed, and starts generation manually.
  - **Climax:** Video jobs run only when Nas chooses to run them.
  - **Resolution:** The video queue uses selected images, not automatically generated first variants.

## 3. Glossary

- **Project** - A top-level workspace containing settings, assets, imports, batches, generated variants, selections, and queue state.
- **Project Studio** - A larger full extension page for project management, assets, JSON import/resolution, image review, video queue preparation, and gallery/download review.
- **Side Panel** - The existing Chrome side panel, retained as an operations cockpit.
- **Asset** - A reusable project item that can be referenced by prompts. Asset types include character, place, prop, style, and generic reference.
- **Character Asset** - A person/character reference. Projects may have zero character assets.
- **Place Asset** - A location reference, such as a bedroom, office, or kitchen.
- **Generic Reference Asset** - A reference image that is not specifically a character, place, prop, or style.
- **Asset File** - An uploaded file attached to an Asset. An Asset can contain one or more files.
- **Asset Alias** - A user-friendly name that JSON can use to resolve an Asset.
- **Prompt Record** - One imported JSON row/entry containing at minimum `file_name` and `image_prompt`, with optional references and optional `animation_prompt`.
- **Required Reference** - A JSON-listed reference that must resolve to an uploaded project Asset before the affected prompt can generate.
- **Blocked Prompt** - A Prompt Record that cannot generate because at least one Required Reference is unresolved.
- **Image Variant** - One generated image option for a Prompt Record. Current behavior generates two image variants per prompt.
- **Selected Variant** - The Image Variant chosen as the canonical image for a Prompt Record.
- **Canonical Image Mapping** - Metadata that says which variant represents the final image filename for a prompt.
- **Video Draft** - A not-yet-run video job prepared from a Selected Variant and an animation prompt.
- **Flow Context** - The current Google Flow account/project context in which uploaded references and generated media are valid.

## 4. Information Architecture

### 4.1 Side Panel

The side panel remains small and operational:

- Project selector.
- Current Google Flow connection/account/project status.
- Current queue summary.
- Run, stop, retry, and Sync Folder actions.
- Import JSON entry point.
- Open Project Studio action.
- Critical blocked/failed status indicators.

### 4.2 Project Studio

Project Studio is a larger full extension page/tab with these primary sections:

- **Project Settings** - Project name, output naming settings, current Flow context visibility, and project-level defaults.
- **Assets** - Characters, Places, Props, Styles, and Generic References with manual upload/edit flows.
- **Import / Resolve JSON** - Import prompt JSON, resolve references, and show blocked prompts.
- **Image Review** - Compare image variants and choose selected/canonical images.
- **Video Queue Builder** - Convert selected images and animation prompts into draft/ready video jobs.
- **Gallery / Downloads** - Inspect generated media, selection state, expected filenames, and sync/download repair status.

## 5. Features

### 5.1 Project Container

**Description:** AutoFlow introduces Projects as the top-level organizing object. A Project contains assets, imported prompt records, generation batches, image variants, selected images, video jobs, and repair/export state. Realizes UJ-1.

**Functional Requirements:**

#### FR-1: Create and select projects

The user can create, select, and switch between Projects.

**Consequences (testable):**
- A Project has a stable `project_id`.
- The UI can show the active Project in both side panel and Project Studio.
- A Project can exist without any character assets.
- Switching Projects changes visible assets, imports, queues, review state, and gallery/download context.

#### FR-2: Edit project metadata

The user can edit Project display metadata without breaking existing imported prompts or generated media.

**Consequences (testable):**
- Project display name can change without changing `project_id`.
- Project settings persist across extension reloads.
- Existing prompt, asset, variant, and job references remain valid after project display edits.

#### FR-3: Preserve existing side-panel operations

The side panel remains an operations cockpit rather than becoming the full management UI.

**Consequences (testable):**
- The side panel exposes active Project selection/status.
- The side panel can open Project Studio.
- Existing queue/run/retry/sync workflows remain reachable.
- Large image review is not constrained to the side panel.

### 5.2 Project Asset Library

**Description:** Each Project has a typed Asset library. Assets are manually created/uploaded by the user and can represent characters, places, props, styles, or generic references. Realizes UJ-1 and UJ-2.

**Functional Requirements:**

#### FR-4: Manage typed assets

The user can add, edit, and remove Assets inside a Project.

**Consequences (testable):**
- Supported Asset types include character, place, prop, style, and generic reference.
- Projects with no character Assets remain valid.
- Asset lists are grouped or filterable by type.
- Deleting or disabling an Asset clearly shows affected prompts/jobs before destructive action.

#### FR-5: Upload asset files manually

The user manually uploads files for each Asset.

**Consequences (testable):**
- AutoFlow does not auto-create placeholder upload files for missing JSON references.
- An Asset can have one or more Asset Files.
- One Asset File can be marked primary where the UI needs a default.
- Asset File names can be edited or replaced without changing `asset_id`.

#### FR-6: Resolve assets through stable identity

AutoFlow stores stable internal Asset identities and does not use display name or file name as the primary identity.

**Consequences (testable):**
- Each Asset has a stable `asset_id`.
- Display names can change without breaking imported Prompt Records.
- Aliases can resolve JSON names to Assets during import.
- After import, Prompt Records store resolved Asset IDs, not only raw user-facing names.

#### FR-7: Add assets after project creation

The user can add or update Assets at any time after creating a Project.

**Consequences (testable):**
- Blocked Prompts can become Ready after the missing Asset is uploaded/resolved.
- Existing unblocked prompts are not modified when unrelated Assets are added.
- Existing Video Drafts are updated or flagged only when their referenced Asset dependencies change.

### 5.3 JSON Import and Reference Resolution

**Description:** Prompt JSON becomes project-aware. Each Prompt Record can list required references. Missing references block affected prompts until the user manually resolves them. Realizes UJ-2.

**Functional Requirements:**

#### FR-8: Import project-aware prompt JSON

The user can import a JSON array of Prompt Records into the active Project.

**Consequences (testable):**
- A Prompt Record supports `file_name`, `image_prompt`, optional `animation_prompt`, and optional reference list.
- JSON without a reference list remains valid and generates with no project references unless the user explicitly maps references during import. [ASSUMPTION: JSON without listed references remains valid and does not use a hardcoded global character reference.]
- Imported prompts receive stable `prompt_id` values.
- Importing a new JSON file does not erase existing Project Assets.

#### FR-9: Resolve listed references against Project Assets

AutoFlow resolves JSON-listed references to Assets in the active Project.

**Consequences (testable):**
- References can resolve by Asset alias or accepted display/slug name.
- Resolved Prompt Records store `asset_id` references.
- The import UI shows which references resolved and which did not.
- Ambiguous references require user resolution before affected prompts become Ready.

#### FR-10: Block prompts with missing required references

JSON-listed references are required by default.

**Consequences (testable):**
- A Prompt Record with any unresolved listed reference is marked Blocked.
- Blocked Prompts cannot be added to an image generation run.
- The Resolve References view shows the exact missing reference names and affected prompts.
- Uploading/resolving the missing Asset changes affected prompts from Blocked to Ready.

#### FR-11: Preserve current prompt-index filename intent

The refactor preserves the current prompt-index goal of predictable media names.

**Consequences (testable):**
- `file_name` remains the expected canonical image filename for a Prompt Record.
- Variant filenames remain traceable back to the expected canonical file name.
- Filename normalization remains compatible with current `__1` / `__2` variant handling unless explicitly changed later.

### 5.4 Image Generation and Variant Review

**Description:** Image generation creates variants, and the user chooses the best variant in a larger Project Studio review page. Realizes UJ-3.

**Functional Requirements:**

#### FR-12: Generate image variants from ready prompts

The system can generate image variants for Ready Prompts using resolved Project references.

**Consequences (testable):**
- Blocked Prompts are excluded from generation runs.
- Ready Prompts include resolved Asset Files as references according to their imported reference list.
- Current behavior of generating two image variants per prompt is preserved for the initial refactor. [ASSUMPTION: Current two-image-per-prompt behavior should remain the MVP default.]
- Each Image Variant receives a stable `variant_id`.

#### FR-13: Review image variants in a larger page

The user can compare generated variants in Project Studio.

**Consequences (testable):**
- Image Review is available in a larger full extension page/tab.
- The review view groups variants by Prompt Record.
- Each group shows prompt text, expected filename, references used, variant thumbnails/previews, and current selection state.
- The user can select one variant as the Selected Variant for a prompt.

#### FR-14: Store selected variant as metadata first

Selecting a variant updates canonical mapping metadata rather than immediately performing destructive file rename operations.

**Consequences (testable):**
- Selected Variant is stored as a relation between `prompt_id` and `variant_id`.
- Non-selected variants remain available as alternates.
- Changing selection updates canonical mapping without deleting generated files.
- Final filename/export/download behavior uses selected mapping when applicable.

#### FR-15: Handle selection changes safely

Changing Selected Variant after downstream work exists must not silently mutate running or completed work.

**Consequences (testable):**
- If no Video Draft exists, selection simply updates canonical mapping.
- If a draft/ready Video Job exists and has not run, the job updates or is marked Needs Review.
- If a Video Job is running or completed, the old job is not silently changed; user can create a new job from the new selection.

### 5.5 Video Queue Builder

**Description:** Video generation becomes deliberate. AutoFlow prepares Video Drafts from Selected Variants and animation prompts, but does not auto-run videos after image generation. Realizes UJ-4.

**Functional Requirements:**

#### FR-16: Create Video Drafts from selected images

AutoFlow can create Video Drafts only when a prompt has a Selected Variant and an `animation_prompt`.

**Consequences (testable):**
- A prompt without `animation_prompt` does not create a Video Draft.
- A prompt with `animation_prompt` but no Selected Variant is marked Not Ready for video.
- A Video Draft stores `job_id`, `prompt_id`, selected `variant_id`, animation prompt, and expected output filename.

#### FR-17: Do not auto-run video generation

Videos are added to the queue by user action and do not run automatically after image generation.

**Consequences (testable):**
- Completing image generation does not start video generation.
- User can review Video Drafts before adding/running them in the queue.
- User can remove, reorder, or hold Video Drafts before generation.

#### FR-18: Default video continuity uses selected image as start frame

The default video reference strategy is selected-image start frame only. [ASSUMPTION: Selected-image start frame is the safest MVP video reference strategy.]

**Consequences (testable):**
- Video Jobs use the Selected Variant as the start frame.
- Project Asset references are not automatically attached to video jobs in MVP unless explicitly supported later.
- Advanced video reference modes are out of MVP scope until Flow behavior is tested. [ASSUMPTION: Advanced video reference modes should wait until Google Flow behavior is tested.]

#### FR-19: Preserve manual queue controls

Video Jobs enter the existing queue model as manually controlled jobs.

**Consequences (testable):**
- Video Jobs can be queued, run, stopped, retried, and inspected without automatic image-to-video execution.
- Queue UI distinguishes image jobs from video jobs.
- Failed Video Jobs remain visible for retry.

### 5.6 Gallery, Downloads, and Export Mapping

**Description:** Gallery and download behavior must understand Projects, Image Variants, Selected Variants, and Video Jobs while preserving exact filename workflows. Realizes UJ-3 and UJ-4.

**Functional Requirements:**

#### FR-20: Track variants and selected outputs in Gallery

Gallery state can show generated variants, selected canonical images, and video outputs by Project.

**Consequences (testable):**
- Gallery entries are scoped to the active Project.
- Variant entries remain linked to Prompt Records.
- Selected Variant state is visible in Gallery or reachable from Gallery to Image Review.

#### FR-21: Finalize selected image filenames through mapping/export

AutoFlow can produce final/canonical filenames from Selected Variants without relying on immediate destructive renames.

**Consequences (testable):**
- Expected canonical filename remains `file_name`.
- Selected Variant can be downloaded/exported as the canonical filename when finalizing.
- Alternates can remain stored with variant suffixes.
- Sync Folder can repair selection state from downloaded files when possible.

#### FR-22: Preserve account-switch recovery behavior

Project-based selection, references, and queues must remain recoverable after Google account/project switching.

**Consequences (testable):**
- Local Project state remains after using the account chooser.
- Sync Folder can repair thumbnails/progress for Project media.
- Failed Video Jobs can reupload/relink selected still frames in the current Flow context.

### 5.7 Flow Context and Reference Upload Cache

**Description:** Reference uploads and generated media may be tied to a Google Flow account/project context. The refactor must not assume that cached Flow media IDs are globally valid. Realizes UJ-2 and UJ-4.

**Functional Requirements:**

#### FR-23: Track reference upload cache by Flow context

AutoFlow stores any uploaded reference media IDs with enough Flow context to avoid cross-account/project misuse.

**Consequences (testable):**
- Asset Files remain local/project-level truth.
- Flow upload/media IDs are treated as context-specific cache entries.
- If current Flow Context changes and no valid upload cache exists, affected jobs become Needs Reference Upload or equivalent.

#### FR-24: Reupload or relink references when needed

AutoFlow can recover from stale reference/media IDs by reuploading or relinking from local Asset Files or Selected Variants.

**Consequences (testable):**
- Account/project switches do not require re-importing JSON.
- Jobs with stale Flow media IDs are visible and recoverable.
- Retry flows do not silently use inaccessible media IDs.

### 5.8 Brownfield Maintainability

**Description:** The refactor must preserve the current extension architecture while introducing the larger Project Studio surface and project-aware state. Realizes all maintainer-facing needs.

**Functional Requirements:**

#### FR-25: Preserve existing loader constraints

The refactor must preserve tiny loader files and ordered classic-script behavior unless a later explicit architecture PRD changes that.

**Consequences (testable):**
- `src/background/runtime.js` remains an ordered `importScripts()` loader.
- Existing side-panel script order remains intentional.
- Any new Project Studio page uses an explicit loader/order strategy documented in `docs/code-map.md`.
- No bundler or npm dependency model is introduced in this refactor.

#### FR-26: Update documentation maps with new surfaces

The project must document new Project Studio files and responsibility boundaries.

**Consequences (testable):**
- `docs/code-map.md` includes Project Studio files after implementation.
- New shards use descriptive role-based names.
- Search recipes are updated for project, asset, import resolver, image review, and video queue logic.

## 6. Non-Functional Requirements

- **NFR-1: Generality.** The system must support projects with no characters, one character, many characters, places, props, styles, or generic references.
- **NFR-2: Safety.** Required references must not be silently skipped. Missing required references block affected prompts.
- **NFR-3: Recoverability.** Generated variants, selected mappings, video drafts, and blocked prompts must survive extension reloads.
- **NFR-4: Low-risk brownfield change.** The refactor must fit the current classic-script architecture and avoid unrelated module/bundler rewrites.
- **NFR-5: Filename integrity.** Canonical output filenames and variant filenames must remain predictable and repairable.
- **NFR-6: User control.** Video generation must remain manual; the system prepares jobs but does not auto-run them.
- **NFR-7: Flow-context caution.** Cached Flow upload/media IDs must be treated as account/project-context-specific.
- **NFR-8: UI clarity.** The larger Project Studio page must make blocked refs, selected variants, draft video jobs, and queue readiness obvious.

## 7. Constraints and Guardrails

- Do not modify code as part of this PRD.
- Do not introduce a bundler, npm dependency model, or ES module rewrite in this refactor.
- Do not remove current queue, gallery, Sync Folder, Retry Failed, or account-switch recovery behavior.
- Do not keep the bundled Jack reference as a hardcoded universal reference. It may become a normal project Asset if needed, but not a global assumption.
- Do not auto-create placeholder Asset uploads from missing JSON references.
- Do not auto-run videos after image generation.
- Do not immediately/destructively rename generated files when a variant is selected.
- Do not assume image-reference behavior and video-reference behavior are the same in Google Flow.

## 8. MVP Scope

### 8.1 In Scope

- Project data model and active Project selection.
- Larger Project Studio page/tab.
- Side panel as operations cockpit.
- Typed Asset library with manual upload.
- Asset names, aliases, stable IDs, and editable metadata.
- Project-aware JSON import with required references.
- Blocked Prompt behavior for unresolved references.
- Image generation preserving two variants per prompt.
- Image Review page for variant comparison and selection.
- Metadata-first canonical image mapping.
- Manual Video Draft and Video Queue creation from Selected Variants.
- Default video mode: selected image as start frame only.
- Project-aware Gallery/download mapping sufficient for selected variants and exact filenames.
- Flow-context-aware reference/media cache rules.
- Documentation updates for new surfaces and shards.

### 8.2 Out of Scope for MVP

- Optional JSON references.
- Auto-created placeholder Assets.
- Automatic video generation after image generation.
- Advanced video reference modes beyond selected start frame.
- Cloud sync, multi-user collaboration, or hosted backend.
- Chrome Web Store distribution changes.
- Full ES module or bundler migration.
- Full export-packaging workflow beyond canonical selected-image/download mapping.

## 9. Suggested Implementation Phases

These phases are requirement groupings for downstream planning, not permission to edit code in this PRD step.

1. **Foundation:** Project state, IDs, active Project selection, storage schema, and side-panel project selector.
2. **Asset Library:** Project Studio shell, typed Assets, manual upload, aliases, and asset editing.
3. **JSON Import Resolver:** Extended JSON references, reference resolution, blocked prompt state, and Resolve References UI.
4. **Image Variant Review:** Project Studio Image Review page, selected variant metadata, canonical mapping, and selection-change behavior.
5. **Video Queue Builder:** Draft/ready video jobs from Selected Variants and animation prompts; manual queue add/run behavior.
6. **Gallery/Downloads/Recovery:** Project-aware gallery, download/finalize mapping, Sync Folder repair, and Flow-context media cache rules.
7. **Docs/Validation:** Update `docs/code-map.md`, validation notes, and manual smoke checks.

## 10. Success Metrics

**Primary**

- **SM-1: General project workflow works.** A project with no characters and a project with multiple assets can both import JSON and generate Ready prompts correctly. Validates FR-1, FR-4, FR-8, FR-10.
- **SM-2: Missing required refs are safe.** Imported prompts with missing listed references are blocked and cannot generate until the user manually uploads/resolves the assets. Validates FR-9, FR-10.
- **SM-3: Image review controls final selection.** For a prompt with two generated variants, the user can select one variant and have that choice drive canonical mapping and video draft preparation. Validates FR-12, FR-13, FR-14, FR-16.
- **SM-4: Videos do not auto-run.** Image generation completion creates no running video jobs; video drafts require user action to enter/run the queue. Validates FR-16, FR-17, FR-19.

**Secondary**

- **SM-5: Account-switch recovery remains intact.** Project state, selected variants, and failed video jobs can recover after switching Google accounts/projects. Validates FR-22, FR-23, FR-24.
- **SM-6: Brownfield maintenance remains local.** Implementers can locate new project/asset/review/video-queue code from updated docs and validate changed files without a bundler. Validates FR-25, FR-26.

**Counter-metrics**

- **SM-C1: Do not optimize for automatic throughput at the cost of user control.** More automatic video generation is not better if it runs videos from bad or unselected images.
- **SM-C2: Do not optimize for convenience by silently skipping references.** Fast generation is not better if it ignores required character/place/style refs.
- **SM-C3: Do not optimize for architecture purity at the cost of runtime stability.** A module/bundler rewrite is not part of this MVP.

## 11. Validation Expectations

- Import a project JSON with no references; prompts should be Ready and use no forced global character reference.
- Import a project JSON with valid references; prompts should resolve to uploaded Assets and be Ready.
- Import a project JSON with missing references; affected prompts should be Blocked and impossible to generate until manual upload/resolution.
- Rename an Asset display name; previously imported prompt references should remain valid through stable IDs.
- Generate two image variants for a prompt; select one in Project Studio and verify selected metadata updates without deleting alternates.
- Change Selected Variant before video generation; draft/ready video job updates or is marked Needs Review.
- Try changing selection after a video job has run; completed output should not mutate silently.
- Confirm video generation does not auto-start after image generation.
- Switch Google account/project and verify local Project, selection, Sync Folder, and Retry Failed recovery behavior.
- Run `node --check` on changed JavaScript files when implementation begins.
- Parse `manifest.json` after any manifest changes.

## 12. Open Questions

1. Should existing Jack-based imports be migrated automatically into a Project with a normal `Jack` Character Asset, or should old imports remain legacy-only until manually converted?
2. What exact user-facing JSON field name should be preferred: `refs`, `references`, or both with normalization?
3. Should Asset aliases be globally unique within a Project, or unique only within Asset type?
4. Should Project Studio be opened from side panel only, or also registered as an extension page reachable from browser extension actions?
5. Should selecting a variant automatically create a Video Draft, or should the user explicitly click "Create Video Draft"? The current PRD allows draft creation after selection but requires manual queue/run.
6. What visual layout should Image Review use first: scene-by-scene rows, grid board, or comparison carousel?

## 13. Assumptions Index

- [ASSUMPTION: Project Studio is the working name for the larger full extension page.]
- [ASSUMPTION: Current two-image-per-prompt behavior should remain the MVP default.]
- [ASSUMPTION: JSON without listed references remains valid and does not use a hardcoded global character reference.]
- [ASSUMPTION: Selected-image start frame is the safest MVP video reference strategy.]
- [ASSUMPTION: Advanced video reference modes should wait until Google Flow behavior is tested.]
