---
stepsCompleted:
  - "step-01-validate-prerequisites"
  - "step-02-design-epics"
  - "step-03-create-stories"
  - "step-04-final-validation"
currentStep: "complete"
extractionStatus: "confirmed"
epicStructureStatus: "approved"
storyGenerationStatus: "complete-pending-final-validation"
finalValidationStatus: "passed"
workflowStatus: "complete"
inputDocuments:
  - "_bmad-output/planning-artifacts/prds/prd-AutoFlow-project-studio-refactor-2026-07-09/prd.md"
  - "_bmad-output/planning-artifacts/architecture/architecture-AutoFlow-2026-07-09/ARCHITECTURE-SPINE.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-AutoFlow-2026-07-09/DESIGN.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-AutoFlow-2026-07-09/EXPERIENCE.md"
  - "_bmad-output/planning-artifacts/ux-designs/ux-AutoFlow-2026-07-09/wireframes/key-screens.md"
excludedDocuments:
  - "_bmad-output/planning-artifacts/prds/prd-AutoFlow-2026-07-09/prd.md"
---
# AutoFlow - Epic Breakdown

## Overview

This document provides complete epic story breakdown for AutoFlow, decomposing requirements from PRD, UX Design if exists, Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: The user can create, select, and switch between Projects, and each Project has a stable `project_id` that scopes visible assets, imports, queues, review state, and gallery/download context.

FR2: The user can edit Project display metadata and settings without changing `project_id` or breaking existing prompt, asset, variant, and job references.

FR3: The side panel remains a compact operations cockpit exposing active Project selection/status, Project Studio entry, and existing queue/run/retry/sync workflows, while large image review stays outside the side panel.

FR4: The user can add, edit, remove, group, and filter typed Project Assets, including character, place, prop, style, and generic reference assets, and projects with zero character assets remain valid.

FR5: The user manually uploads files for each Asset; AutoFlow does not auto-create placeholder upload files for missing JSON references, supports one or more files per Asset, supports a primary file, and allows file metadata edits without changing `asset_id`.

FR6: AutoFlow resolves Assets through stable internal identity; each Asset has an `asset_id`, display names can change without breaking imported prompts, aliases can resolve JSON names, and imported prompts store resolved Asset IDs.

FR7: The user can add or update Assets after Project creation; blocked prompts can become Ready after upload/resolution, unrelated ready prompts remain unchanged, and existing video drafts are updated or flagged only when their dependencies change.

FR8: The user can import project-aware prompt JSON into the active Project; each prompt supports `file_name`, `image_prompt`, optional `animation_prompt`, and an optional reference list, receives a stable `prompt_id`, and JSON without references remains valid without a forced global character reference.

FR9: AutoFlow resolves JSON-listed references against active Project Assets by alias or accepted display/slug name, stores resolved `asset_id` references, shows resolved/unresolved status, and requires user resolution for ambiguous references.

FR10: AutoFlow blocks prompts with missing required references; blocked prompts cannot be generated, the Resolve References UI shows exact missing names and affected prompts, and resolving/uploading the missing Asset changes affected prompts to Ready.

FR11: AutoFlow preserves current prompt-index filename intent; `file_name` remains the expected canonical image filename, variant filenames remain traceable to it, and current `__1` / `__2` normalization remains compatible unless explicitly changed later.

FR12: AutoFlow can generate image variants from Ready prompts only, attaches resolved Asset Files according to each prompt reference list, preserves the current two-variant MVP behavior, and assigns each Image Variant a stable `variant_id`.

FR13: The user can review generated image variants in Project Studio; the view groups variants by Prompt Record and shows prompt text, expected filename, references used, thumbnails/previews, and current selection state.

FR14: Selecting an Image Variant stores canonical mapping metadata as a `prompt_id` to `variant_id` relation, keeps alternates available, supports changing selection without deleting files, and lets final download/export use the selected mapping.

FR15: Changing a Selected Variant after downstream work exists is safe; drafts or ready video jobs update or become Needs Review, while running or completed video jobs are not silently mutated.

FR16: AutoFlow can create Video Drafts only when a prompt has both a Selected Variant and an `animation_prompt`; drafts store `job_id`, `prompt_id`, selected `variant_id`, animation prompt, and expected output filename.

FR17: AutoFlow never auto-runs video generation after image generation; the user can review, add, remove, reorder, or hold Video Drafts before generation.

FR18: Default MVP video continuity uses the Selected Variant as the start frame; Project Asset references are not automatically attached to video jobs unless explicitly supported later, and advanced video reference modes are out of MVP scope until Flow behavior is tested.

FR19: Video Jobs enter the existing queue model as manually controlled jobs that can be queued, run, stopped, retried, inspected, distinguished from image jobs, and kept visible after failure.

FR20: Gallery state is Project-scoped and can show generated variants, selected canonical images, and video outputs linked to Prompt Records, with Selected Variant state visible or reachable from Gallery.

FR21: AutoFlow can finalize selected image filenames through mapping/export rather than destructive renames; selected variants can be downloaded/exported as the canonical `file_name`, alternates keep variant suffixes, and Sync Folder can repair selection state where possible.

FR22: Project-based selection, references, queues, and local state remain recoverable after Google account or Flow project switching; Sync Folder can repair thumbnails/progress and failed video jobs can reupload or relink selected still frames.

FR23: AutoFlow tracks reference upload/media cache by Flow Context; Asset Files remain local/project-level truth, Flow IDs are context-specific cache entries, and context changes mark affected jobs Needs Reference Upload or equivalent.

FR24: AutoFlow can recover stale Flow media IDs by reuploading or relinking from local Asset Files or Selected Variants; account/project switches do not require JSON re-import and retry flows must not silently use inaccessible media IDs.

FR25: The refactor preserves loader constraints: background runtime remains ordered `importScripts()`, side-panel script order remains intentional, Project Studio uses explicit ordered loaders, and no bundler/npm dependency model is introduced.

FR26: The project documents new Project Studio files and responsibility boundaries in `docs/code-map.md`, including descriptive shard names and search recipes for project, asset, import resolver, image review, and video queue logic.

### NonFunctional Requirements

NFR1: Generality - The system must support projects with no characters, one character, many characters, places, props, styles, or generic references.

NFR2: Safety - Required references must not be silently skipped; missing required references block affected prompts.

NFR3: Recoverability - Generated variants, selected mappings, video drafts, and blocked prompts must survive extension reloads.

NFR4: Low-risk brownfield change - The refactor must fit the current classic-script Chrome MV3 architecture and avoid unrelated ES module, bundler, npm, or TypeScript rewrites.

NFR5: Filename integrity - Canonical output filenames and variant filenames must remain predictable, traceable, and repairable.

NFR6: User control - Video generation must remain manual; the system prepares jobs but does not auto-run them.

NFR7: Flow-context caution - Cached Flow upload/media IDs must be treated as Google account/project-context-specific.

NFR8: UI clarity - Project Studio must make blocked references, selected variants, video drafts, queue readiness, stale context, and repair actions obvious.

### Additional Requirements

- Architecture paradigm: Preserve the existing Chrome MV3 classic-script extension and add a project-scoped domain layer using a brownfield layered state-machine model with adapter boundaries.

- Project boundary: All assets, imported prompts, generated variants, selected mappings, video jobs, queue state, gallery records, and Flow cache entries must be scoped by stable `project_id`.

- Identity model: `project_id`, `asset_id`, `asset_file_id`, `prompt_id`, `variant_id`, `job_id`, and `flow_context_id` are primary relationship keys; labels, aliases, `file_name`, and physical filenames are mutable metadata.

- Surface ownership: Project Studio owns project settings, assets, import/resolution, image review, video draft building, and gallery/download inspection; the side panel owns compact operations and current status.

- Reference gate: JSON-listed references are required by default and must block prompt generation if unresolved or ambiguous.

- Selection model: Variant selection is metadata-first through a canonical `prompt_id -> variant_id` mapping; alternates remain retained and traceable.

- Video queue model: Image generation completion must not enqueue or run video generation; video jobs must start as user-reviewed Draft or Ready records and enter/run queue only by explicit user action.

- Flow cache model: Local project metadata and files are source of truth; Flow upload/media IDs are cache entries keyed by project asset or variant plus `flow_context_id`.

- Loader model: Background, side panel, and Project Studio code must use explicit ordered classic-script loaders unless a later architecture changes the runtime model; loader files stay tiny maps.

- Mutation ownership: Project-domain writes must go through named project-store command functions that validate schema, assign IDs, update derived state, and persist records.

- Content-script boundary: `page-fetch-interceptor.js` stays page-world and limited to Flow response observation; `flow-page-bridge.js` stays isolated; background runtime owns Chrome APIs, Flow API calls, downloads, queue execution, and message routing.

- Legacy Jack boundary: New project-aware imports must not attach `assets/reference/Jack.jpg` unless the active project or migration explicitly maps Jack to a normal Project Asset.

- Persistence envelope: Project-domain records must persist under one versioned storage envelope, `autoflowProjectStateV1`, with schema version metadata and migration hooks; implementation must not create parallel persistent project stores.

- Shared domain globals: Shared project-domain scripts attach APIs under `globalThis.TFProjectDomain` and stay DOM-free so extension pages and the service worker can load them.

- Documentation discipline: Any new shard or responsibility move must update `docs/code-map.md` in the same implementation story.

- Environment: The refactor targets the existing local unpacked Chrome extension workflow; Chrome Web Store packaging, hosted backends, cloud sync, and multi-user infrastructure are out of scope.

- Deferred product decisions to resolve before affected stories: JSON reference field naming, variant-selection-to-draft behavior, legacy Jack migration strategy, asset alias uniqueness, optional references, and advanced video reference modes.

### UX Design Requirements

UX-DR1: Implement a compact production-tool visual style for AutoFlow Project Studio, avoiding hero/marketing layouts, decorative gradients, bokeh/orbs, and single-hue themes; media thumbnails and state labels should carry the page.

UX-DR2: Implement the design token palette from `DESIGN.md`, including base, raised, subtle, border, primary, accent, info, warning, danger, success, selected, blocked, and queued semantic colors.

UX-DR3: Ensure color is never the only state signal; every important state must also have text and, where compact, an icon.

UX-DR4: Implement typography conventions using Google Sans with Arial/system fallback, fixed non-viewport-scaled font sizes, zero letter spacing, and specific roles for page title, section title, body, label, and caption text.

UX-DR5: Implement an 8px-based spacing system, side-panel padding, Studio gutters, row gaps, and stable grid/row/thumbnail dimensions so loading states, warnings, selected labels, and buttons do not shift layout.

UX-DR6: Implement quiet elevation through borders and tonal surfaces before shadows; dialogs/drawers have one elevation level and nested modal flows are avoided.

UX-DR7: Implement compact shape rules: small controls use 4px corners, buttons and warning rows use 6px, panels/dialogs/thumbnails/variant containers use 8px, and fully rounded badges are limited to status badges or circular icon affordances.

UX-DR8: Build a Studio top bar showing active Project selector, Flow context status, blocked prompt count, queue count, and the primary action for the current section.

UX-DR9: Build Studio left navigation with Project Settings, Assets, Import / Resolve, Image Review, Video Queue, and Gallery / Downloads, using selected-state styling and a left accent indicator.

UX-DR10: Build a Project selector supporting create, switch, and search, showing active Project name plus blocked and queue counts; switching Projects changes all visible assets, imports, review state, video drafts, and gallery.

UX-DR11: When a queue is running, switching Projects must not stop it; the UI must warn if switching hides active work.

UX-DR12: Build an Asset Manager with a dense default list, optional thumbnail preview, type, display name, aliases, file count, usage count, warning state, and edit flow through a details inspector or single dialog.

UX-DR13: Asset deletion or disabling must show affected prompts/jobs before destructive action.

UX-DR14: Build a manual Upload drop zone / file picker flow for Asset Files with direct empty-state text such as "Upload reference files."

UX-DR15: Build Import / Resolve as a resolution report, not just a toast; it groups prompt records into Ready and Blocked and shows missing reference names plus affected filenames.

UX-DR16: Resolve Missing Reference flow must support mapping to an existing Asset or manually creating/uploading an Asset, then re-running resolution.

UX-DR17: Build Prompt rows showing file name, prompt excerpt, reference chips, state, generated variant count, selected variant, and video readiness.

UX-DR18: Build Image Review as an MVP scene-row board where each row includes expected filename, prompt excerpt, reference chips, two fixed-size variant slots, selected state, and video readiness.

UX-DR19: Variant thumbnails must have stable aspect ratio and fixed slot dimensions; selected variants use explicit "Selected" state and non-selected variants remain visible and recoverable.

UX-DR20: Build Video Queue Builder showing only prompts with `animation_prompt`, Not Ready rows for missing selected images, Draft rows with Add to Queue, and Queued rows with remove/reorder/retry affordances as applicable.

UX-DR21: If a Selected Variant changes before video run, the draft updates or becomes Needs Review; if video is running/done, selection changes must not mutate that job.

UX-DR22: Build queue rows with job type icon, project, prompt/filename, state, retry/stop controls, and error detail disclosure.

UX-DR23: Implement required state badges: Ready, Blocked, Missing refs, Selected, Needs review, Draft, Queued, Running, Failed, Complete, and Stale context.

UX-DR24: Build a right Details Inspector for selected project, asset, prompt, variant, or job, showing editable fields, dependencies, consequences, and focused actions.

UX-DR25: Use operational, compact, specific UI copy, including concrete blocked/ref/selection/context messages; avoid vague errors and cheerleading phrasing.

UX-DR26: Implement Prompt states Ready, Blocked, Generating, Generated, and Needs Review with the required visual/interaction behavior from `EXPERIENCE.md`.

UX-DR27: Implement Asset states Complete, No files, In use, and Stale Flow upload with usage counts and Needs Reference Upload warnings where applicable.

UX-DR28: Implement Variant states Unselected, Selected, and Missing local file with Sync Folder repair affordance for missing local media.

UX-DR29: Implement Video Job states Not Ready, Draft, Ready, Needs Review, Running, Failed, and Complete with disabled reasons, queue/run affordances, retry/error details, and output links as applicable.

UX-DR30: Implement Flow Context states Connected, Disconnected, Stale Context, and Needs Reference Upload.

UX-DR31: Implement interaction primitives for Select Project, Create Asset, Upload Asset File, Import JSON, Resolve Missing Reference, Generate Images, Select Variant, Create/Update Video Draft, Add To Queue, Sync Folder, and Retry Failed.

UX-DR32: Keyboard shortcuts are optional for MVP, but if added later they must not be the only way to complete any task.

UX-DR33: Accessibility floor: upload and queue controls are keyboard reachable, disabled controls include visible reasons, image thumbnails have accessible labels with filename/variant/selection state, focus order follows top bar/nav/main/actions/details inspector, and dialogs/drawers trap and restore focus.

UX-DR34: Long prompt text and filenames must remain readable through wrapping, truncation with tooltip, expansion, or details inspector without resizing panels or buttons.

UX-DR35: Side panel must remain narrow and single-column, showing project selector, connection/account state, queue summary, blockers/failed jobs, Import JSON, Open Project Studio, Sync Folder, Retry Failed, Run, and Stop controls.

UX-DR36: Project Studio must target a larger browser tab and remain usable at laptop width; at narrow widths the left nav may collapse and Image Review rows may stack one prompt at a time while preserving stable variant comparison.

UX-DR37: Project Studio must not require browser file-system permissions beyond current extension/download behavior unless a later architecture explicitly adds them.

UX-DR38: Wireframe behavior must be represented for the Operations Cockpit, Project Studio shell, Assets, Import / Resolve, Image Review, and Video Queue Builder screens.

### FR Coverage Map

FR1: Epic 1 - Create/select/switch Projects.

FR2: Epic 1 - Edit Project metadata safely.

FR3: Epic 1 - Preserve side-panel operations cockpit.

FR4: Epic 2 - Manage typed Project Assets.

FR5: Epic 2 - Manual Asset File uploads.

FR6: Epic 2 - Stable Asset identity and alias resolution.

FR7: Epic 2 - Add/update Assets after Project creation.

FR8: Epic 2 - Import project-aware prompt JSON.

FR9: Epic 2 - Resolve JSON references against Assets.

FR10: Epic 2 - Block prompts with missing required refs.

FR11: Epic 3 - Preserve prompt-index filename intent.

FR12: Epic 3 - Generate two image variants from Ready prompts.

FR13: Epic 3 - Review variants in Project Studio.

FR14: Epic 3 - Store selected variant as metadata.

FR15: Epic 3 - Handle selection changes safely.

FR16: Epic 4 - Create Video Drafts from selected images.

FR17: Epic 4 - Do not auto-run video generation.

FR18: Epic 4 - Use selected image as MVP video start frame.

FR19: Epic 4 - Preserve manual queue controls.

FR20: Epic 5 - Track variants and selected outputs in Gallery.

FR21: Epic 5 - Finalize selected filenames through mapping/export.

FR22: Epic 5 - Preserve account-switch recovery.

FR23: Epic 5 - Track Flow upload cache by Flow Context.

FR24: Epic 5 - Reupload or relink stale references/media.

FR25: Epic 1 - Preserve ordered loader constraints across the refactor.

FR26: Epic 1 - Update documentation maps for new surfaces and shards.

## Epic List

### Epic 1: Project Workspace And Operations Cockpit

Users can create, edit, select, and switch Projects, see active Project status in the side panel, open Project Studio, and keep existing operational controls working inside a project-aware shell.

**FRs covered:** FR1, FR2, FR3, FR25, FR26

**Implementation notes:** Establish `autoflowProjectStateV1`, stable IDs, project-store command layer, Project Studio shell/loaders, side-panel project selector, and initial `docs/code-map.md` updates.

### Epic 2: Project Asset Library And Safe JSON Resolution

Users can build a reusable project asset library, manually upload character/place/prop/style/reference files, import project-aware JSON, and resolve or block missing references safely.

**FRs covered:** FR4, FR5, FR6, FR7, FR8, FR9, FR10

**Implementation notes:** This is the main generalization epic that removes hardcoded Jack/channel assumptions from project-aware workflows. It should decide JSON reference field naming and asset alias uniqueness before implementation.

### Epic 3: Ready Image Generation And Variant Review

Users can generate images only from Ready prompts, preserve two image variants per prompt, review variants in Project Studio, and select a canonical variant without destructive renames.

**FRs covered:** FR11, FR12, FR13, FR14, FR15

**Implementation notes:** Selection is metadata-first. This epic should keep `file_name`, `__1`, and `__2` behavior compatible while adding review and safe downstream selection-change handling.

### Epic 4: Manual Video Drafts And Queue Control

Users can create video drafts from selected images and animation prompts, review them, and manually add/run/retry video jobs without automatic video generation after images complete.

**FRs covered:** FR16, FR17, FR18, FR19

**Implementation notes:** This epic should decide whether selecting a variant auto-creates a draft or whether the user clicks Create Video Draft. Either way, queue/run remains manual.

### Epic 5: Project Gallery, Downloads, And Flow Recovery

Users can inspect project-scoped variants, selected outputs, and videos; finalize selected image filenames through mapping/export; and recover after Google account or Flow project switches.

**FRs covered:** FR20, FR21, FR22, FR23, FR24

**Implementation notes:** This epic owns project-aware Gallery/Downloads, Sync Folder repair, context-scoped Flow media/upload caches, and reupload/relink recovery.

## Epic 1: Project Workspace And Operations Cockpit

Users can create, edit, select, and switch Projects, see active Project status in the side panel, open Project Studio, and keep existing operational controls working inside a project-aware shell.

### Story 1.1: Create Project Domain Storage Foundation

As a creator,
I want AutoFlow to persist Projects with stable identity,
So that project work survives reloads and later assets, prompts, variants, and jobs can attach safely.

**Requirements:** FR1, FR25, NFR3, NFR4, AD-1, AD-2, AD-8, AD-9, AD-12

**Acceptance Criteria:**

1. **Given** the extension loads with no project-domain state
   **When** the project domain initializes
   **Then** `autoflowProjectStateV1` is created with schema version metadata and a valid active project state
   **And** each Project has a stable `project_id` that is not derived from display name or filename.

2. **Given** shared project-domain scripts are loaded from an extension page or the service worker
   **When** Project APIs initialize
   **Then** APIs are available under `globalThis.TFProjectDomain`
   **And** the shared scripts do not depend on the DOM, npm packages, ES modules, or a bundler.

3. **Given** JavaScript files changed for this story
   **When** validation runs
   **Then** each changed JavaScript file passes `node --check`
   **And** existing side-panel and background loaders still load in their previous order.

### Story 1.2: Add Project Studio Shell And Navigation

As a creator,
I want a larger Project Studio page,
So that project setup and production workflows are not trapped in the narrow side panel.

**Requirements:** FR3, FR25, UX-DR1, UX-DR2, UX-DR4, UX-DR5, UX-DR6, UX-DR7, UX-DR8, UX-DR9, UX-DR32, UX-DR36, AD-3, AD-8

**Acceptance Criteria:**

1. **Given** the extension is loaded
   **When** the user opens Project Studio from the side panel
   **Then** a full extension page opens with top bar, left navigation, main workspace, and details-inspector region
   **And** the page includes navigation entries for Project Settings, Assets, Import / Resolve, Image Review, Video Queue, and Gallery / Downloads.

2. **Given** Project Studio assets are added
   **When** the extension loads the page
   **Then** Project Studio uses explicit ordered classic scripts and ordered CSS shards
   **And** it does not introduce npm, bundler, TypeScript, or ES module runtime requirements.

3. **Given** Project Studio renders at laptop width
   **When** the page loads
   **Then** it uses the approved production-tool visual style, design tokens, typography, spacing, quiet borders, compact corners, and stable layout regions
   **And** it avoids marketing/hero layout, decorative gradients, and single-hue visual treatment.

4. **Given** keyboard shortcuts are not required for MVP
   **When** Project Studio shell interactions are implemented
   **Then** every core action remains reachable without a keyboard shortcut
   **And** any later shortcut can only supplement, not replace, visible controls.

### Story 1.3: Add Project Selection To The Side Panel

As a creator,
I want the side panel to show and switch the active Project,
So that operational controls always belong to the right workspace.

**Requirements:** FR1, FR3, NFR8, UX-DR10, UX-DR11, UX-DR35, AD-1, AD-3

**Acceptance Criteria:**

1. **Given** one or more Projects exist
   **When** the side panel loads
   **Then** it shows an active Project selector and the current Project status
   **And** existing connection, queue, run, stop, retry, and Sync Folder controls remain reachable.

2. **Given** multiple Projects exist
   **When** the user switches active Project from the side panel
   **Then** project-scoped summaries update for the newly selected Project
   **And** the switch does not change any `project_id`.

3. **Given** queue work is running
   **When** the user switches Projects
   **Then** the queue is not stopped
   **And** the UI warns when switching may hide active work from the current view.

### Story 1.4: Edit Project Metadata Safely

As a creator,
I want to rename and edit Project settings,
So that I can organize work without breaking stored project records.

**Requirements:** FR2, UX-DR24, UX-DR34, AD-2, AD-9

**Acceptance Criteria:**

1. **Given** an existing Project
   **When** the user edits Project display metadata in Project Studio
   **Then** the Project retains its original `project_id`
   **And** the updated metadata persists across extension reloads.

2. **Given** existing prompt, asset, variant, or job references belong to a Project
   **When** the Project display name changes
   **Then** those references remain valid
   **And** no generated media mapping is keyed only by the display name.

3. **Given** long Project names or settings labels
   **When** Project Settings renders
   **Then** text wraps, truncates with tooltip, expands, or appears in the details inspector without resizing buttons or breaking layout.

### Story 1.5: Document Project Workspace Boundaries

As a maintainer,
I want the new Project files and loader responsibilities documented,
So that future implementation stays local, searchable, and low-risk.

**Requirements:** FR25, FR26, NFR4, AD-8

**Acceptance Criteria:**

1. **Given** Epic 1 source files exist
   **When** implementation is complete
   **Then** `docs/code-map.md` documents Project Studio files, shared project-domain files, side-panel project cockpit ownership, and loader order
   **And** it includes search recipes for project storage, Project Studio boot, and side-panel Project selection.

2. **Given** loader files changed for this epic
   **When** documentation is updated
   **Then** `docs/code-map.md` and actual loader order agree
   **And** loader files remain tiny maps rather than places for feature logic.

## Epic 2: Project Asset Library And Safe JSON Resolution

Users can build a reusable project asset library, manually upload character/place/prop/style/reference files, import project-aware JSON, and resolve or block missing references safely.

### Story 2.1: Build Typed Asset Library

As a creator,
I want to create and manage typed Assets inside a Project,
So that prompts can reference reusable characters, places, props, styles, and generic references.

**Requirements:** FR4, NFR1, NFR8, UX-DR12, UX-DR23, UX-DR27, AD-1, AD-2

**Acceptance Criteria:**

1. **Given** an active Project
   **When** the user opens the Assets section
   **Then** the user can create Assets of type character, place, prop, style, and generic reference
   **And** Projects with zero character Assets remain valid.

2. **Given** Assets exist
   **When** the Asset Manager renders
   **Then** it shows a dense list with type, display name, aliases, file count, usage count, and warning state
   **And** the list can be grouped or filtered by type.

3. **Given** Asset rows render
   **When** state is shown
   **Then** color is paired with text and, where compact, an icon
   **And** Complete, No files, In use, and Stale Flow upload states are visually distinct.

### Story 2.2: Upload And Manage Asset Files Manually

As a creator,
I want to manually upload files for each Asset,
So that AutoFlow never invents or silently creates missing references for me.

**Requirements:** FR5, FR10, NFR2, UX-DR14, UX-DR16, AD-4

**Acceptance Criteria:**

1. **Given** an Asset exists
   **When** the user uploads files through the Asset file picker or drop zone
   **Then** the files attach to the Asset as Asset Files
   **And** the upload flow uses direct empty-state text such as "Upload reference files."

2. **Given** an Asset has multiple files
   **When** the user marks one file primary
   **Then** that file becomes the default file for UI or generation contexts that need one
   **And** changing the primary file does not change `asset_id`.

3. **Given** a missing JSON reference is detected
   **When** the system displays resolution options
   **Then** AutoFlow does not create a placeholder upload automatically
   **And** the user must map to an existing Asset or manually create/upload an Asset.

### Story 2.3: Edit Assets, Aliases, And Safe Deletion

As a creator,
I want to edit Asset names, aliases, and files safely,
So that imported prompts and queued work do not break when labels change.

**Requirements:** FR4, FR6, UX-DR13, UX-DR24, AD-2, AD-9

**Acceptance Criteria:**

1. **Given** an Asset is referenced by imported prompts or jobs
   **When** the user edits the Asset display name
   **Then** existing prompt dependencies remain linked by `asset_id`
   **And** aliases remain resolver inputs rather than primary identity.

2. **Given** an Asset is in use
   **When** the user attempts to delete or disable it
   **Then** the UI shows affected prompts and jobs before destructive action
   **And** the user can cancel without changing dependencies.

3. **Given** Asset details are edited
   **When** the details inspector or single dialog opens
   **Then** there are no nested modal flows
   **And** dependencies and consequences are visible before saving destructive changes.

### Story 2.4: Define Project JSON Reference Contract

As a maintainer,
I want the project-aware JSON reference contract decided and documented,
So that import, resolution, and future prompt generation agree on the same fields.

**Requirements:** FR8, FR9, FR10, FR25, FR26, AD-4, AD-11

**Acceptance Criteria:**

1. **Given** project-aware JSON import is about to be implemented
   **When** this story is completed
   **Then** the accepted reference field name or names are documented for prompt records
   **And** the decision covers whether aliases are unique across the Project or unique per Asset type.

2. **Given** a prompt record has no reference list
   **When** it is imported under the documented contract
   **Then** it remains valid and does not attach a hardcoded global character reference
   **And** the behavior is documented for creators and implementers.

3. **Given** legacy Jack behavior still exists
   **When** documenting the new contract
   **Then** new project-aware imports must not attach `assets/reference/Jack.jpg` unless a Project Asset or migration explicitly maps it
   **And** the legacy compatibility boundary is documented.

### Story 2.5: Import Project-Aware Prompt JSON

As a creator,
I want to import prompt JSON into the active Project,
So that scenes become Project-scoped Prompt Records without erasing my Asset library.

**Requirements:** FR8, FR11, NFR5, AD-1, AD-2, AD-11

**Acceptance Criteria:**

1. **Given** an active Project and a valid JSON array
   **When** the user imports prompt JSON
   **Then** each prompt record stores `file_name`, `image_prompt`, optional `animation_prompt`, optional raw reference names, and a stable `prompt_id`
   **And** the import does not erase existing Project Assets.

2. **Given** JSON has no references field under the documented contract
   **When** it is imported
   **Then** prompt records are eligible for Ready state if all other required data is valid
   **And** no global Jack or channel-specific reference is attached.

3. **Given** imported prompt data is invalid
   **When** import runs
   **Then** the user receives a specific error identifying the invalid record or missing required prompt field
   **And** existing Project state remains unchanged.

### Story 2.6: Resolve References And Block Unsafe Prompts

As a creator,
I want AutoFlow to resolve JSON references against Project Assets,
So that only prompts with the right required references can generate images.

**Requirements:** FR9, FR10, NFR2, UX-DR15, UX-DR17, UX-DR26, AD-4

**Acceptance Criteria:**

1. **Given** imported prompts include reference names
   **When** the resolver runs
   **Then** references resolve by documented alias/display/slug rules to `asset_id`
   **And** resolved Prompt Records store Asset IDs rather than only raw names.

2. **Given** a required reference is missing or ambiguous
   **When** resolution completes
   **Then** affected prompts enter Blocked state
   **And** blocked prompts cannot be sent to image generation.

3. **Given** import results are displayed
   **When** the user views Import / Resolve
   **Then** Ready and Blocked prompt groups are shown
   **And** each blocked row shows missing or ambiguous reference names and affected filenames.

### Story 2.7: Resolve Missing References Into Ready Prompts

As a creator,
I want to repair missing references after import,
So that blocked prompts become ready only after I manually map or upload the right Assets.

**Requirements:** FR7, FR10, NFR2, UX-DR16, UX-DR31, AD-4, AD-9

**Acceptance Criteria:**

1. **Given** prompts are Blocked because of missing references
   **When** the user maps the missing reference to an existing Asset
   **Then** AutoFlow re-runs resolution for affected prompts
   **And** prompts with all references resolved become Ready.

2. **Given** prompts are Blocked because no suitable Asset exists
   **When** the user creates an Asset and uploads files manually
   **Then** the resolver can map the missing reference to the new Asset
   **And** unrelated unblocked prompts remain unchanged.

3. **Given** a prompt remains Blocked
   **When** the user attempts image generation
   **Then** the Generate action is disabled for that prompt
   **And** the disabled reason names the missing reference.

## Epic 3: Ready Image Generation And Variant Review

Users can generate images only from Ready prompts, preserve two image variants per prompt, review variants in Project Studio, and select a canonical variant without destructive renames.

### Story 3.1: Gate Image Generation By Project Prompt Readiness

As a creator,
I want image generation to run only for Ready project prompts,
So that missing references are never silently skipped.

**Requirements:** FR10, FR12, NFR2, UX-DR26, AD-4, AD-10

**Acceptance Criteria:**

1. **Given** a Project contains Ready and Blocked prompts
   **When** the user starts image generation
   **Then** only Ready prompts are included in the run
   **And** Blocked prompts remain excluded with visible disabled reasons.

2. **Given** a Ready prompt has resolved Asset Files
   **When** image generation request data is prepared
   **Then** the request includes only the resolved references required by that prompt
   **And** no hardcoded global Jack reference is attached.

3. **Given** image generation is in progress
   **When** prompt rows render
   **Then** Generating state is visible
   **And** destructive project/reference changes for affected prompts are disabled or warned.

### Story 3.2: Persist Image Variant Records And Filename Mapping

As a creator,
I want generated image variants recorded under the right Project prompt,
So that each option stays traceable to its expected final filename.

**Requirements:** FR11, FR12, NFR3, NFR5, AD-1, AD-2, AD-5

**Acceptance Criteria:**

1. **Given** image generation completes for a prompt
   **When** variants are recorded
   **Then** each Image Variant receives a stable `variant_id`
   **And** each variant links to `project_id`, `prompt_id`, expected `file_name`, and generated variant filename.

2. **Given** current MVP generation behavior returns two image variants
   **When** variants are stored
   **Then** the current two-variant behavior is preserved
   **And** `__1` and `__2` traceability remains compatible with existing filename rules.

3. **Given** the extension reloads
   **When** project state is restored
   **Then** generated variant records and prompt linkage survive
   **And** missing local files are represented as repairable state rather than lost metadata.

### Story 3.3: Build Project Studio Image Review Board

As a creator,
I want to compare generated image variants in a large review page,
So that I can choose the best image before video work begins.

**Requirements:** FR13, UX-DR18, UX-DR19, UX-DR33, UX-DR36, UX-DR38, AD-3

**Acceptance Criteria:**

1. **Given** generated variants exist
   **When** the user opens Image Review
   **Then** variants are grouped by Prompt Record in a scene-row board
   **And** each row shows expected filename, prompt excerpt, reference chips, two fixed-size variant slots, selected state, and video readiness.

2. **Given** thumbnails, warnings, or selected labels load
   **When** Image Review renders
   **Then** variant slots keep stable aspect ratio and dimensions
   **And** layout does not jump or resize controls.

3. **Given** a user relies on keyboard or assistive labels
   **When** Image Review is navigated
   **Then** variant thumbnails have accessible labels including filename, variant number, and selected state
   **And** controls are keyboard reachable.

### Story 3.4: Select Canonical Variant With Metadata

As a creator,
I want to select one generated variant as canonical,
So that final image and video preparation use my chosen image without deleting alternates.

**Requirements:** FR14, NFR5, UX-DR19, UX-DR23, AD-5

**Acceptance Criteria:**

1. **Given** a prompt has multiple variants
   **When** the user selects a variant
   **Then** AutoFlow stores a `prompt_id -> variant_id` canonical mapping
   **And** non-selected variants remain visible and recoverable.

2. **Given** a Selected Variant exists
   **When** Image Review, Gallery, or prompt rows render
   **Then** the selected state is explicit through text and visual styling
   **And** selected state does not rely on color alone.

3. **Given** the user changes selection before downstream video work
   **When** the new selection is saved
   **Then** canonical mapping updates without deleting files
   **And** final filename/export behavior uses the latest selected mapping.

### Story 3.5: Handle Selection Changes After Downstream Work

As a creator,
I want selection changes to be safe after video preparation starts,
So that running or completed work is not silently mutated.

**Requirements:** FR15, UX-DR21, UX-DR29, AD-5, AD-6

**Acceptance Criteria:**

1. **Given** a Video Draft or Ready Video Job exists and has not run
   **When** the user changes the Selected Variant
   **Then** the downstream job updates to the new selected image or becomes Needs Review
   **And** the UI shows the repair action.

2. **Given** a video job is Running or Complete
   **When** the user changes the Selected Variant
   **Then** the existing job is not silently changed
   **And** the user can create a new draft from the new selection.

3. **Given** selection-related state requires user attention
   **When** Project Studio renders affected prompts or jobs
   **Then** Needs Review state is shown with a clear reason
   **And** the state is reachable from Image Review and Video Queue Builder.

## Epic 4: Manual Video Drafts And Queue Control

Users can create video drafts from selected images and animation prompts, review them, and manually add/run/retry video jobs without automatic video generation after images complete.

### Story 4.1: Show Video Readiness From Selected Images

As a creator,
I want Project Studio to show which prompts are ready for video drafts,
So that I know what still needs an image selection or animation prompt.

**Requirements:** FR16, FR17, UX-DR20, UX-DR29, AD-6

**Acceptance Criteria:**

1. **Given** prompts have different image and animation states
   **When** the user opens Video Queue Builder
   **Then** prompts with `animation_prompt` and Selected Variant appear as draftable
   **And** prompts missing Selected Variant or animation prompt show Not Ready with a visible reason.

2. **Given** a prompt has no `animation_prompt`
   **When** video readiness is calculated
   **Then** AutoFlow does not create a Video Draft for it
   **And** the UI explains why it is absent or Not Ready.

3. **Given** video readiness changes after image selection
   **When** Project Studio refreshes
   **Then** readiness updates without starting video generation
   **And** no job is added to the queue automatically.

### Story 4.2: Create Or Update Video Drafts Explicitly

As a creator,
I want to create or update Video Drafts from selected images,
So that I can review animation work before it enters the queue.

**Requirements:** FR16, FR18, NFR6, UX-DR31, AD-6, AD-7

**Acceptance Criteria:**

1. **Given** a prompt has a Selected Variant and `animation_prompt`
   **When** the user creates or updates a Video Draft
   **Then** AutoFlow stores `job_id`, `project_id`, `prompt_id`, selected `variant_id`, animation prompt, and expected output filename
   **And** the draft does not start running.

2. **Given** a selected image is used as a video start frame
   **When** the draft is created
   **Then** the Selected Variant is the default MVP video continuity reference
   **And** Project Asset references are not automatically attached to the video job.

3. **Given** the selected image or Flow context changes before run
   **When** the draft is viewed
   **Then** the draft updates or becomes Needs Review
   **And** the user can confirm repair before queueing.

### Story 4.3: Add Drafts To The Manual Video Queue

As a creator,
I want to add reviewed Video Drafts to the queue manually,
So that videos run only when I choose.

**Requirements:** FR17, FR19, NFR6, UX-DR20, UX-DR29, AD-6

**Acceptance Criteria:**

1. **Given** one or more Video Drafts are ready
   **When** the user adds a draft to the queue
   **Then** it becomes a queued or queueable Video Job
   **And** it remains associated with the active Project and selected start frame.

2. **Given** drafts or queued jobs are visible
   **When** the user manages them
   **Then** the user can remove, reorder, or hold jobs before generation
   **And** image jobs and video jobs are visually distinguishable.

3. **Given** image generation completes
   **When** queue state is checked
   **Then** no Video Draft or Video Job is auto-run because of image completion
   **And** video queueing requires explicit user action.

### Story 4.4: Run, Stop, And Retry Video Jobs

As a creator,
I want manual controls for video jobs,
So that I can run, stop, inspect, and retry video generation safely.

**Requirements:** FR19, FR24, UX-DR22, UX-DR29, AD-6, AD-7, AD-10

**Acceptance Criteria:**

1. **Given** queued video jobs exist
   **When** the user starts the queue
   **Then** video jobs transition through Ready or Queued to Running
   **And** queue rows show job type, project, prompt or filename, state, and stop controls.

2. **Given** a video job fails
   **When** the failure is shown
   **Then** the job remains visible as Failed
   **And** retry and error-detail disclosure are available.

3. **Given** a failed job depends on stale local or Flow media
   **When** the user retries
   **Then** AutoFlow routes the job through the repair/reupload path rather than silently reusing inaccessible media IDs.

### Story 4.5: Preserve Existing Queue Operations In The Side Panel

As a creator,
I want the side panel to summarize image and video queue state,
So that I can operate AutoFlow without opening the full Studio for every action.

**Requirements:** FR3, FR19, NFR8, UX-DR25, UX-DR35, AD-3, AD-6

**Acceptance Criteria:**

1. **Given** image and video work exists for the active Project
   **When** the side panel loads
   **Then** it shows compact queue summaries for ready, draft, queued, running, failed, and blocked work
   **And** Run, Stop, Retry Failed, and Sync Folder remain available.

2. **Given** queue state includes blockers or stale context
   **When** alerts render
   **Then** messages are operational and specific, such as missing reference name or stale Flow context
   **And** they avoid vague error copy.

3. **Given** the user needs deeper queue preparation
   **When** they choose the relevant action
   **Then** the side panel opens Project Studio to the appropriate Video Queue or repair surface
   **And** the side panel itself does not contain the full Image Review workflow.

## Epic 5: Project Gallery, Downloads, And Flow Recovery

Users can inspect project-scoped variants, selected outputs, and videos; finalize selected image filenames through mapping/export; and recover after Google account or Flow project switches.

### Story 5.1: Scope Gallery To The Active Project

As a creator,
I want Gallery to show generated media for the active Project,
So that variants, selections, and outputs do not mix across productions.

**Requirements:** FR20, NFR3, UX-DR37, AD-1, AD-5

**Acceptance Criteria:**

1. **Given** multiple Projects have generated media
   **When** the Gallery / Downloads section opens
   **Then** entries are scoped to the active `project_id`
   **And** switching Projects changes visible gallery entries.

2. **Given** image variants exist
   **When** Gallery renders them
   **Then** each entry remains linked to its Prompt Record and expected canonical filename
   **And** selected state is visible or links back to Image Review.

3. **Given** video outputs exist
   **When** Gallery renders them
   **Then** outputs are linked to their Video Jobs and Prompt Records
   **And** completed outputs provide download or local-inspection affordances.

### Story 5.2: Finalize Selected Image Filenames Through Mapping

As a creator,
I want selected variants to become canonical outputs through mapping/export,
So that final filenames stay predictable without destructive renames.

**Requirements:** FR11, FR21, NFR5, AD-5

**Acceptance Criteria:**

1. **Given** a prompt has a Selected Variant
   **When** the user finalizes or downloads selected images
   **Then** the selected variant can be exported or downloaded as the canonical `file_name`
   **And** alternates keep traceable variant filenames.

2. **Given** no Selected Variant exists
   **When** finalization is attempted for that prompt
   **Then** AutoFlow prevents canonical finalization
   **And** the UI directs the user to Image Review.

3. **Given** filename repair runs
   **When** Sync Folder scans local files
   **Then** it can use selected mapping and existing `__1` / `__2` traces where possible
   **And** it does not rely on immediate destructive renames.

### Story 5.3: Track Flow Context And Media Cache

As a creator,
I want AutoFlow to know when Flow media IDs belong to the current account or project,
So that retries do not use stale inaccessible references.

**Requirements:** FR23, NFR7, UX-DR30, AD-7

**Acceptance Criteria:**

1. **Given** Asset Files or selected variants are uploaded to Flow
   **When** upload/media IDs are cached
   **Then** cache records are keyed by project asset or variant plus `flow_context_id`
   **And** local project files and metadata remain source of truth.

2. **Given** the current Flow account or project changes
   **When** AutoFlow compares cached media context
   **Then** affected prompts or jobs become Stale Context, Needs Reference Upload, Needs Review, or Failed Retryable as appropriate
   **And** old IDs are not silently reused.

3. **Given** Flow context cannot be determined
   **When** a job needs cached media
   **Then** the UI shows Disconnected or Needs Reference Upload state
   **And** the job does not run with ambiguous media context.

### Story 5.4: Repair Project Media With Sync Folder

As a creator,
I want Sync Folder to repair project media and thumbnails,
So that local state can recover after reloads, account switches, or missing files.

**Requirements:** FR20, FR21, FR22, NFR3, UX-DR28, UX-DR31, AD-7

**Acceptance Criteria:**

1. **Given** local downloaded files exist for the active Project
   **When** the user runs Sync Folder
   **Then** AutoFlow relinks thumbnails, variants, selected mappings, and video outputs where filenames and metadata match
   **And** repairs are scoped to the active Project.

2. **Given** a selected variant metadata record exists but the local file is missing
   **When** Gallery or Image Review renders
   **Then** Missing local file state appears
   **And** Sync Folder is offered as a repair action.

3. **Given** Sync Folder cannot repair a missing file
   **When** repair completes
   **Then** the UI reports the unresolved item with filename and prompt context
   **And** existing valid mappings remain intact.

### Story 5.5: Reupload Or Relink Stale References And Start Frames

As a creator,
I want stale reference and start-frame media to be recoverable,
So that account/project switches do not require re-importing JSON.

**Requirements:** FR22, FR23, FR24, NFR7, AD-7

**Acceptance Criteria:**

1. **Given** a job needs a Flow media ID that is stale or missing for the current Flow Context
   **When** the user retries or repairs the job
   **Then** AutoFlow reuploads or relinks from local Asset Files or Selected Variants
   **And** the new cache entry is stored under the current `flow_context_id`.

2. **Given** local source files are unavailable
   **When** repair is attempted
   **Then** the affected job remains Needs Reference Upload or Failed Retryable
   **And** the UI names the missing local source.

3. **Given** repair succeeds
   **When** the user retries generation
   **Then** the job uses current-context media IDs
   **And** no JSON re-import is required.

### Story 5.6: Complete Recovery UX And Documentation

As a creator and maintainer,
I want recovery states and documentation to be clear,
So that stale Flow context, missing files, and retry paths are understandable and maintainable.

**Requirements:** FR22, FR23, FR24, FR26, NFR8, UX-DR3, UX-DR25, UX-DR30, UX-DR33, AD-7, AD-8

**Acceptance Criteria:**

1. **Given** Project Studio or the side panel shows recovery states
   **When** Connected, Disconnected, Stale Context, or Needs Reference Upload states apply
   **Then** the UI displays specific text, visible reason, and next action
   **And** color is not the only indicator.

2. **Given** recovery implementation adds or moves files
   **When** implementation is complete
   **Then** `docs/code-map.md` documents Gallery/Downloads, Sync Folder, Flow context cache, reupload/relink, and retry ownership
   **And** changed JavaScript files pass `node --check`.

3. **Given** final validation is run manually
   **When** the tester switches Google account or Flow project
   **Then** Project state, selected variants, Sync Folder repair, and failed job retry behavior are validated
   **And** results are documented in implementation notes.
