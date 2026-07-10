---
title: "AutoFlow Existing Chrome Extension PRD"
status: "final"
created: "2026-07-09"
updated: "2026-07-09"
project_name: "AutoFlow"
source_bound: true
sources:
  - "_bmad-output/project-context.md"
  - "README.md"
  - "docs/architecture.md"
  - "docs/code-map.md"
  - "docs/research-notes.md"
  - "docs/connection-fix-v5-audit.md"
  - "docs/connection-fix-v6-audit.md"
  - "manifest.json"
---

# PRD: AutoFlow Existing Chrome Extension

## 0. Document Purpose

This PRD captures the current product requirements for AutoFlow, an existing Chrome Manifest V3 extension currently documented in the repository as TurboFlow. [ASSUMPTION: AutoFlow is the PRD title while current repository docs and extension metadata still use TurboFlow.] It is intended for BMAD downstream planning, architecture, epics, and stories. The document is source-bound: it only describes capabilities and goals present in `_bmad-output/project-context.md`, `README.md`, `docs/`, and `manifest.json`; it does not introduce new feature ideas.

## 1. Vision

AutoFlow helps a Google Flow operator run repeatable image and video generation work from a Chrome side panel without manually babysitting every prompt, generated asset, filename, and account/session transition.

The product uses the operator's current Google Flow browser session, queues prompts, tracks generated media, and downloads outputs automatically. Its most specific current workflow is `prompt-index.json` import: a list of prompt records can become an image batch with a shared Jack reference image, exact `.png` downloads, and matching start-frame video clips saved as `.mp4` files when animation prompts are present.

The current project goal is preservation and disciplined evolution of this existing extension. The codebase is intentionally split into ordered classic-script shards to keep maintenance local, low-risk, and compatible with the unpacked Chrome extension workflow.

## 2. Target User

### 2.1 Jobs To Be Done

- As a Google Flow operator, I need to submit many image or video prompts from a side panel so that I do not manually repeat one prompt at a time.
- As a prompt-index workflow operator, I need generated images and videos saved to exact expected filenames so that downstream media assembly can find them without manual renaming.
- As an operator working across Google accounts or projects, I need to recover queue/gallery state after switching accounts so that failed animation work can be retried against the current account/project.
- As the maintainer, I need future changes to stay inside the correct shard and loader order so that small fixes do not destabilize the extension.

### 2.2 Non-Users

- People who are not using Google Flow in Chrome.
- Operators who need a hosted multi-user service, payment system, or cloud backend.
- Users seeking a general-purpose media generator outside the active Google Flow browser session.

### 2.3 Key User Journeys

- **UJ-1. Operator runs a prompt-index image/video batch.**
  - **Persona + context:** A single operator has a `prompt-index.json` file containing `file_name`, `image_prompt`, and optional `animation_prompt` fields.
  - **Entry state:** The extension is loaded unpacked, the operator has an active Google Flow tab/session, and the side panel is open.
  - **Path:** The operator imports the JSON file, AutoFlow creates an image batch, attaches the bundled Jack reference image, queues image prompts, maps expected filenames, and then queues start-frame video prompts for entries with animation prompts.
  - **Climax:** Generated images are downloaded to exact `.png` paths and generated videos are saved with matching `.mp4` filenames.
  - **Resolution:** The operator can inspect queue/gallery progress and use downloaded media in the expected folder structure.
  - **Edge case:** If progress or thumbnails look stale after account/project changes, the operator uses Sync Folder and Retry Failed to repair state and retry animation work.

- **UJ-2. Operator reconnects after a Flow tab/session change.**
  - **Persona + context:** A single operator has refreshed Google Flow or switched to a different Flow project/account.
  - **Entry state:** The side panel may show stale connection or gallery/progress state.
  - **Path:** AutoFlow checks visible Chrome tabs for Google Flow URLs, prefers a Flow project URL when available, updates connection state, and keeps the side panel tied to `src/sidepanel/index.html`.
  - **Climax:** The side panel reports the current connection state without closing the Chrome message port.
  - **Resolution:** The operator can continue queue, sync, and retry actions against the current Flow context.

- **UJ-3. Maintainer makes a focused brownfield change.**
  - **Persona + context:** A maintainer needs to fix or extend an existing behavior without rewriting the extension.
  - **Entry state:** The maintainer starts from `docs/code-map.md`.
  - **Path:** The maintainer finds the responsible shard, changes the smallest relevant file(s), preserves numeric loader order, and validates syntax/manifest changes.
  - **Climax:** The change lands without moving shared globals, breaking the service worker loader, or changing unrelated surfaces.
  - **Resolution:** The extension remains loadable as an unpacked Chrome MV3 extension.

## 3. Glossary

- **AutoFlow** - The project name used for this PRD and BMAD artifacts. Current repository docs and extension branding also use **TurboFlow**.
- **TurboFlow** - The current user-facing/documented extension name in `README.md`, `docs/`, and `manifest.json`.
- **Google Flow** - The Google Labs Flow web application targeted by the extension.
- **Side Panel** - The Chrome extension side panel at `src/sidepanel/index.html`.
- **Flow Tab** - A Chrome tab whose URL matches the Google Flow URL patterns in `manifest.json`.
- **Prompt Index JSON** - An imported JSON array whose records include `file_name`, `image_prompt`, and optionally `animation_prompt`.
- **Jack Reference** - The bundled reference image at `assets/reference/Jack.jpg`, attached to image batches created from Prompt Index JSON.
- **Batch** - A queued set of image or video generation prompts managed by the side panel and background runtime.
- **Gallery** - The extension surface/state that tracks generated media, thumbnails, selections, downloads, and preview-ready items.
- **Sync Folder** - The recovery action that scans downloaded media to repair progress, thumbnails, and local frame links.
- **Retry Failed** - The recovery action that retries failed work, including animation retries that may reupload still frames into the current Google Flow account/project.

## 4. Features

### 4.1 Chrome Extension Shell and Flow Connection

**Description:** AutoFlow is installed as an unpacked Chrome Manifest V3 extension. It opens a side panel, detects usable Google Flow tabs, maintains connection state, and avoids background listener patterns that previously caused disconnected message-port behavior. Realizes UJ-2 and UJ-3.

**Functional Requirements:**

#### FR-1: Load as an unpacked Chrome MV3 extension

The operator can load AutoFlow through Chrome's Developer Mode unpacked-extension flow.

**Consequences (testable):**
- `manifest.json` declares `manifest_version: 3`.
- Chrome loads `src/background/service-worker.js` as the background service worker.
- Chrome opens `src/sidepanel/index.html` as the side panel default path.
- Content scripts are registered for the Google Flow URL patterns defined in `manifest.json`.

#### FR-2: Detect and report Flow connection state

The system can check visible Chrome tabs for Google Flow URLs and report side-panel connection state.

**Consequences (testable):**
- `CHECK_CONNECTION` and `GET_CONNECTION_STATE` produce a response through the background message router.
- Connection detection scans extension-visible tabs and prefers URLs containing a Flow project ID when available.
- Connection responses include a fallback so the message port does not close without a response.
- Connection checks do not call Google Flow auth/session, credits, reCAPTCHA, or private generation endpoints.

#### FR-3: Preserve page-to-extension event flow

The system can observe relevant Google Flow API responses from the page and forward them into extension runtime state.

**Consequences (testable):**
- The MAIN-world content script wraps `window.fetch`, filters relevant Flow generation/media endpoints, clones matching responses, and posts `FLOW_AUTO_INTERCEPT` messages.
- The isolated bridge forwards intercepted events and page readiness to the background runtime.
- Page-world code does not call extension-only APIs.

### 4.2 Prompt Queue and Batch Control

**Description:** AutoFlow lets the operator queue generation work from the side panel, track status, and dispatch batches through the background runtime. Realizes UJ-1 and UJ-2.

**Functional Requirements:**

#### FR-4: Queue prompts for generation

The operator can create queued generation work from prompts in the side panel.

**Consequences (testable):**
- The side panel persists batch state through the shared storage/state layer.
- Queue rendering shows enough status for the operator to distinguish queued, running, failed, and completed work.
- Batch dispatch routes generation work through the background runtime rather than direct page-only automation.

#### FR-5: Track progress and prompt status

The system can update queue/gallery state as Google Flow responses and generation status events arrive.

**Consequences (testable):**
- Intercepted generation/media/status events update relevant prompt or batch state.
- The side panel can render queue statistics and per-row actions from persisted state.
- Failed work remains visible for retry rather than silently disappearing.

### 4.3 Prompt Index JSON Import and Media Chaining

**Description:** AutoFlow imports structured prompt-index data, creates paired image/video workflows, attaches the Jack Reference image, and preserves exact local media names. Realizes UJ-1.

**Functional Requirements:**

#### FR-6: Import Prompt Index JSON

The operator can import a JSON array where each record contains `file_name`, `image_prompt`, and optionally `animation_prompt`.

**Consequences (testable):**
- Records with `image_prompt` become image batch prompts.
- Records with `animation_prompt` are eligible for video generation after a usable start-frame image exists.
- Invalid or incomplete imported records do not corrupt existing batch/gallery state.

#### FR-7: Attach the bundled Jack Reference image

The system attaches `assets/reference/Jack.jpg` as the shared character/reference image for JSON-imported image batches.

**Consequences (testable):**
- The bundled reference file is loaded from the extension package.
- JSON-imported image batches reference the Jack file consistently.
- Removing or renaming the asset fails visibly rather than silently producing unreferenced batches.

#### FR-8: Preserve exact image and video filenames

The system maps imported `file_name` values to exact expected `.png` image paths and matching `.mp4` video names.

**Consequences (testable):**
- Generated images download to exact JSON-derived `.png` paths.
- Generated videos for animation prompts save as matching `.mp4` files in the same folder.
- Known variant suffix handling such as `__1` and `__2` remains compatible with local sync and gallery repair.

#### FR-9: Chain generated images into start-frame video prompts

The system can resolve generated image media IDs or recovered local/downloaded stills into start frames for animation retries.

**Consequences (testable):**
- Video batches are queued only when a valid start-frame source can be resolved.
- Animation retries can reupload still images into the current account/project when needed.
- Frame relinking does not require clearing local batches.

### 4.4 Gallery, Downloads, and Local Recovery

**Description:** AutoFlow tracks generated media, manages downloads, and repairs local progress when Chrome download state or account/project context changes. Realizes UJ-1 and UJ-2.

**Functional Requirements:**

#### FR-10: Track generated media in the Gallery

The operator can inspect generated media state through the Gallery.

**Consequences (testable):**
- Preview-ready image/video items can be inserted or refreshed in gallery state.
- Gallery grouping, selection, deletion, preview, and download actions operate on persisted media records.
- Stale thumbnails or missing local previews can be repaired through the existing local cache/sync path.

#### FR-11: Download generated media automatically or through user actions

The system can download generated media and preserve expected local naming rules.

**Consequences (testable):**
- Download handling goes through Chrome downloads APIs.
- Filename determination preserves exact names required by prompt-index workflows.
- Download history lookup can repair state when a file already exists locally.

#### FR-12: Sync local folders to repair progress

The operator can use Sync Folder to scan downloaded media and repair progress, thumbnails, and frame references.

**Consequences (testable):**
- Sync Folder can match expected prompt-index media files to local files.
- Matching updates prompt/gallery state without duplicating unrelated media.
- Sync Folder supports account-switch recovery by providing stills for later animation retries.

### 4.5 Account Switching and Retry Recovery

**Description:** AutoFlow supports switching Google accounts without clearing local batches and provides recovery actions for failed or stale work. Realizes UJ-1 and UJ-2.

**Functional Requirements:**

#### FR-13: Open Google account chooser

The operator can open Google's account chooser from the Queue tab without clearing local batch state.

**Consequences (testable):**
- The account chooser action opens the relevant Google account selection flow.
- Existing local batches, expected filenames, and gallery state remain available after the account switch.

#### FR-14: Retry failed generation work

The operator can retry failed work after refreshing or changing account/project context.

**Consequences (testable):**
- Retry Failed operates on failed work without requiring a full re-import.
- Animation retries can reupload local still frames to the current account/project and relink prompts to new media IDs.
- Retry behavior respects the current Flow project/account context.

### 4.6 Maintainable Brownfield Architecture

**Description:** AutoFlow's current code organization is part of the product's operability: small ordered shards, tiny loaders, and explicit maps prevent maintenance changes from breaking runtime behavior. Realizes UJ-3.

**Functional Requirements:**

#### FR-15: Preserve ordered loader architecture

The system must keep the active runtime and side-panel load order explicit and stable.

**Consequences (testable):**
- `src/background/runtime.js` remains an ordered `importScripts()` loader.
- `src/sidepanel/index.html` loads ordered app shards directly.
- `src/sidepanel/sidepanel.css` imports CSS shards in source-order sequence.
- Loader files do not accumulate feature logic.

#### FR-16: Preserve documentation-to-shard edit mapping

The project must keep `docs/code-map.md` aligned with actual file responsibilities.

**Consequences (testable):**
- Each common edit category has a named shard or small shard set.
- New shards are documented in the relevant loader and code map.
- Deprecated or inactive compatibility files are not treated as active unless referenced by a loader.

## 5. Cross-Cutting Non-Functional Requirements

- **NFR-1: Runtime compatibility.** The extension must remain loadable as a Chrome MV3 unpacked extension without a bundler or package build step.
- **NFR-2: Reliability.** Connection checks must always respond or fallback; failed prompt/media work must stay recoverable through visible queue/gallery state.
- **NFR-3: Maintainability.** Changes must preserve numeric shard order, shared-global expectations, and tiny loader files.
- **NFR-4: Source-bound documentation.** Product requirements, architecture notes, and edit maps must remain consistent with `README.md`, `docs/`, `manifest.json`, and `_bmad-output/project-context.md`.
- **NFR-5: External API caution.** Flow endpoint interception must remain narrowly filtered because Google Flow response shapes and endpoint behavior are external and brittle.
- **NFR-6: Local data continuity.** Account switching, Sync Folder, and Retry Failed must not erase local batches or expected filename mappings.

## 6. Constraints and Guardrails

- The product targets Google Flow in Chrome through the URL patterns and host permissions currently declared in `manifest.json`.
- The current runtime is plain browser JavaScript, HTML, and CSS. There is no npm dependency model, bundler, TypeScript compiler, linter, or automated test runner in the repository.
- Do not add a second background message listener shim for connection checks.
- Do not call auth/session, credits, reCAPTCHA, private generation endpoints, or removed TurboFlow server/payment APIs during connection checks.
- Do not introduce unrelated architecture refactors while implementing functional changes.
- Do not remove `assets/reference/Jack.jpg` without replacing the JSON-import reference workflow.

## 7. Non-Goals

- AutoFlow is not a hosted SaaS product in the current source artifacts.
- AutoFlow is not a Google Flow replacement or standalone media generation model.
- AutoFlow does not define payment, subscription, server, or restored TurboFlow backend behavior.
- AutoFlow does not currently define support for browsers other than Chrome.
- AutoFlow does not currently define support for sites other than Google Flow.
- AutoFlow does not currently require a bundler, package manager, or module migration.
- AutoFlow does not currently define quantitative business, adoption, or retention targets.

## 8. Current Scope

### 8.1 In Scope

- Chrome MV3 extension shell and side panel.
- Google Flow tab/session detection and connection state reporting.
- Prompt queueing, generation dispatch, progress tracking, and retry visibility.
- Prompt Index JSON import with `file_name`, `image_prompt`, and optional `animation_prompt`.
- Jack Reference attachment for JSON-imported image batches.
- Exact `.png`/`.mp4` filename mapping for imported prompt-index workflows.
- Gallery tracking, preview/download behavior, download-history repair, and Sync Folder recovery.
- Google account chooser flow without clearing local batches.
- Brownfield code organization and documentation consistency.

### 8.2 Out of Scope for Current PRD

- New product features not present in the source artifacts.
- New quantitative success targets.
- New public distribution, monetization, or multi-user account model.
- Full ES module/bundler refactor.
- Automated browser smoke-test implementation, though the docs identify it as a possible future upgrade path.

## 9. Success Metrics

The source artifacts do not define quantitative product targets. [ASSUMPTION: Source-derived functional success signals are sufficient for this current-state PRD until numeric targets are defined.] The following source-derived success signals are valid for current-state validation; numeric thresholds remain open questions.

**Primary**

- **SM-1: Prompt-index workflow completes without manual renaming.** Generated images and videos land at the expected `.png` and `.mp4` names. Validates FR-6, FR-8, FR-9, FR-11.
- **SM-2: Connection state is reliable after Flow tab changes.** Connection checks produce a response or fallback instead of a closed message-port error. Validates FR-2.
- **SM-3: Account-switch recovery preserves local work.** After switching account/project, Sync Folder and Retry Failed can repair stale state and retry failed animation work. Validates FR-12, FR-13, FR-14.

**Secondary**

- **SM-4: Focused maintenance remains possible.** A maintainer can locate the responsible shard from `docs/code-map.md` and validate changed JavaScript with `node --check`. Validates FR-15, FR-16.

**Counter-metrics**

- **SM-C1: Avoid architecture churn.** Do not optimize for module purity or bundling if it increases runtime risk for the unpacked extension. Counterbalances SM-4.
- **SM-C2: Avoid broad endpoint interception.** Do not optimize for more captured network traffic if it increases risk around recaptcha, auth, static resources, or brittle Flow internals. Counterbalances SM-2 and SM-3.

## 10. Validation Expectations

- For changed JavaScript files, run `node --check <file>`.
- For `manifest.json` changes, parse the JSON and keep extension version references consistent.
- For connection changes, reload the unpacked extension, refresh the Google Flow tab, reopen the side panel, and verify `CHECK_CONNECTION` / `GET_CONNECTION_STATE`.
- For Prompt Index JSON changes, validate image batch creation, Jack Reference attachment, exact image filenames, animation batch chaining, `.mp4` output naming, and Sync Folder repair.
- For account switching changes, validate that local batches remain intact and animation retries can reupload/relink still frames in the current Flow account/project.

## 11. Open Questions

1. Should the product and extension branding converge on AutoFlow, TurboFlow, or a deliberate split between internal project name and user-facing extension name?
2. Are there desired quantitative success targets for batch completion, retry success, connection reliability, or manual time saved?
3. Is the intended distribution private/unpacked only, or should future PRDs consider packaged Chrome Web Store distribution?
4. Should automated browser smoke tests become part of near-term scope, or remain a future architecture upgrade path?
5. Are additional Google Flow URL variants or account/project flows expected beyond the current manifest matches and documented recovery behavior?

## 12. Assumptions Index

- [ASSUMPTION: AutoFlow is the PRD title while current repository docs and extension metadata still use TurboFlow.]
- [ASSUMPTION: Source-derived functional success signals are sufficient for this current-state PRD until numeric targets are defined.]
