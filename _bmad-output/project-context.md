---
project_name: "AutoFlow"
user_name: "Nas"
date: "2026-07-09"
sections_completed:
  - technology_stack
  - language_rules
  - framework_rules
  - testing_rules
  - quality_rules
  - workflow_rules
  - anti_patterns
status: "complete"
rule_count: 45
optimized_for_llm: true
sources:
  - README.md
  - docs/architecture.md
  - docs/code-map.md
  - docs/project-json-contract.md
  - docs/research-notes.md
  - docs/connection-fix-v5-audit.md
  - docs/connection-fix-v6-audit.md
---

# Project Context for AI Agents

This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss.

---

## Technology Stack & Versions

- Project: existing Chrome extension project named AutoFlow. User-facing/docs name is currently TurboFlow.
- Extension platform: Chrome Extension Manifest V3, `manifest_version: 3`.
- Extension version: `2.2.21` in `manifest.json` and `README.md`.
- Runtime: plain browser JavaScript, HTML, and CSS. There is no `package.json`, bundler, TypeScript build, lint config, or test framework in this repo.
- Chrome APIs used: `identity`, `sidePanel`, `scripting`, `storage`, `tabs`, `unlimitedStorage`, `downloads`, and `activeTab`.
- Host scope: `https://labs.google/*`; content scripts match Google Flow URLs under `https://labs.google/fx/*/tools/flow*` and `https://labs.google/fx/tools/flow*`.
- Content scripts: `page-fetch-interceptor.js` runs in the page `MAIN` world at `document_start`; `flow-page-bridge.js` runs in the isolated content-script world at `document_start`.
- Assets: Chrome extension icons in `assets/icons/`; bundled character reference image in `assets/reference/Jack.jpg`.

## Critical Implementation Rules

### Language-Specific Rules

- Write plain classic JavaScript unless explicitly doing a full module refactor. Do not introduce `import`/`export`, npm dependencies, or generated bundles into the current runtime path.
- Shared globals are intentional. Ordered files depend on earlier files defining functions and state; moving declarations across shards can break runtime behavior.
- Prefer focused edits in the responsible shard from `docs/code-map.md`; avoid reading or rewriting the whole side panel/background runtime for narrow changes.
- Preserve Chrome callback/message semantics. Any handler that responds asynchronously with `sendResponse` must keep the message port open, usually by returning `true`.
- Do not reuse `const`/`let` names across nested async callbacks when the outer variable is still needed. The v6 audit documents a temporal-dead-zone failure from doing this in connection code.
- Keep `page-fetch-interceptor.js` simple and page-world safe. It wraps `window.fetch`, filters known Flow endpoints, clones responses, and posts `FLOW_AUTO_INTERCEPT`; it must not call extension-only APIs.

### Framework-Specific Rules

- `manifest.json` stays at the repository root because Chrome reads it directly when loading the unpacked extension.
- `src/background/service-worker.js` must remain a tiny service worker entry point that imports `runtime.js`.
- `src/background/runtime.js` must remain a tiny ordered `importScripts()` loader for `src/background/runtime/*.js`.
- The active background shard order is: `00-state-connection.js`, `01-flow-api.js`, `02a-generation-common.js`, `02b-image-generation.js`, `02c-video-generation.js`, `03-downloads-cache.js`, `04-message-router.js`.
- `src/sidepanel/index.html` directly loads ordered classic scripts from `src/sidepanel/app/*.js`. Numeric prefixes preserve execution order.
- `src/sidepanel/sidepanel.css` directly imports Google fonts first, then ordered CSS shards `00` through `05`. CSS split is by cascade/source order, not strict feature ownership.
- Loader files should stay maps only: `src/background/runtime.js`, `src/sidepanel/sidepanel.js`, and `src/sidepanel/sidepanel.css` should not accumulate feature logic.
- If adding a new shard, update the relevant loader, `docs/code-map.md`, and any search recipes. Prefer a new shard only when a file is too large or the feature boundary is clean.

### Testing Rules

- There is no automated test suite configured. Do not invent npm scripts or package metadata unless the task explicitly asks for a toolchain.
- For changed JavaScript files, run `node --check <file>` on each changed file.
- After changing `manifest.json`, parse it as JSON and keep `README.md` version text in sync when the extension version changes.
- For connection changes, manually validate `CHECK_CONNECTION` and `GET_CONNECTION_STATE` behavior after reloading the unpacked extension, refreshing the Google Flow tab, and reopening the side panel.
- For prompt-index JSON changes, validate image batch creation, Jack reference attachment, exact image filenames, animation batch chaining, `.mp4` output naming, and Sync Folder repair.
- For account-switching changes, validate that local batches remain intact, downloaded stills can relink, and animation retries reupload frames into the current Flow account/project.

### Code Quality & Style Rules

- Start every code edit with `docs/code-map.md`; it is the canonical map from feature area to shard.
- Keep edits small and local. The current architecture exists to avoid broad rewrites while preserving runtime behavior.
- Use descriptive role-based file names for future files, such as `batch-runner.js` or `download-manager.js`; avoid hashed bundle names unless a build system is intentionally introduced.
- Preserve numeric prefixes and loader ordering. Changing order is a behavioral change and needs explicit justification.
- Do not move top-level event listener blocks above functions they reference; this code still relies on shared globals and load order.
- Update docs when responsibilities move. `README.md`, `docs/architecture.md`, and especially `docs/code-map.md` should match actual loaders and shard ownership.
- Keep `manifest.json` permissions, content script matches, side panel path, and icon paths explicit and minimal.
- Treat legacy tiny compatibility shards, if present, as inactive unless the loader references them. Active behavior is determined by `runtime.js` and `index.html`.

### Development Workflow Rules

- The extension is loaded unpacked: open `chrome://extensions`, remove old build, enable Developer mode, load this folder, refresh the Google Flow tab, then reopen the side panel.
- This workspace currently has no `.git` directory. Do not assume branch, commit, or PR workflow exists locally.
- BMAD project knowledge is configured at `docs/`; BMAD output artifacts go under `_bmad-output/`.
- Research decisions favor official Chrome extension documentation over community posts. Community findings are supporting context, not primary authority.
- Do not introduce a bundler yet. The documented priority is low-token maintenance with minimal runtime risk.

### Critical Don't-Miss Rules

- Do not add a second background message listener shim for connection checks. The v5/v6 audits intentionally moved `CHECK_CONNECTION` and `GET_CONNECTION_STATE` handling into the single background message router.
- `tfRespondConnectionDirect` must use callback-based `chrome.tabs.query`, scan all extension-visible tabs, prefer Flow project URLs, and always respond with a 1.2 second fallback.
- Connection checks must not call Google Flow auth/session endpoints, credits endpoints, reCAPTCHA, private generation endpoints, or any removed TurboFlow server/payment APIs.
- Preserve the content-script bridge boundary: MAIN-world interception posts page messages; the isolated bridge reports page readiness and forwards events to the background runtime.
- Prompt-index JSON import must preserve the contract: `file_name`, `image_prompt`, optional `animation_prompt`; exact `.png` image downloads and matching `.mp4` video downloads.
- New project-aware prompt JSON must use `docs/project-json-contract.md` and `globalThis.TFProjectJsonContract`; canonical reference field is `references`, accepted compatibility fields normalize to it, aliases are unique per Asset type, and missing references must not auto-create Assets/files.
- Project Studio reference resolution matches imported reference names against active Project Assets by alias, display/name, and slug; required missing or ambiguous references mark the Prompt Record `blocked` with `can_generate_images: false`.
- Manual reference repairs persist on Prompt Record references as `manual_asset_id` with `resolution_source: "manual"`; later resolver runs must respect them but keep prompts blocked if the mapped Asset is missing, disabled, or type-incompatible.
- Project-aware image generation planning must use the Project Studio image gate, include only eligible Ready Prompt Records, include resolved Project Asset File metadata, and never attach hardcoded Jack/global references.
- Project Image Variant records live under the active Project as `image_variants`; they must link stable `variant_id`, `project_id`, `prompt_id`, `image_run_id`, expected prompt `file_name`, and generated variant filename. Preserve `__1`/`__2` traceability and keep missing local files as repairable metadata.
- Project Studio Image Review renders Image Variants as a scene-row board grouped by Prompt Record. Keep variant slots fixed-size, keyboard-focusable, and labeled with filename, variant number, selected state, and repair/missing state.
- Selected Variant state is metadata-first: Prompt Records store `selected_variant_id` plus selected expected/generated filenames. Selecting a variant must not rename files, delete alternates, create Video Drafts, or start video generation.
- Bundled `assets/reference/Jack.jpg` is part of the JSON import flow. Do not remove or rename it without updating import/reference upload logic.
- `assets/reference/Jack.jpg` is legacy prompt-index compatibility only. New project-aware imports must not attach Jack unless a Project Asset or explicit migration maps it.
- Gallery and progress repair rely on exact local filename/path matching, including documented `__1`/`__2` variant handling. Be careful changing normalization logic.
- Account switching should open Google's account chooser without clearing local batches. Sync Folder and Retry Failed are part of the recovery path.
- Google Flow endpoints and response shapes are external and brittle. Keep fetch interception filters specific, avoid intercepting recaptcha/upscale/static Google resources, and preserve error classification around failed fetches.

---

## Usage Guidelines

**For AI agents:**

- Read this file before implementing code in AutoFlow.
- Follow all rules unless the user explicitly asks for an architectural change.
- When unsure, prefer the smaller change that preserves loader order and existing globals.
- Update this file when durable architecture rules or implementation patterns change.

**For humans:**

- Keep this file lean and focused on project-specific agent guidance.
- Remove rules that become obsolete after a real module/build refactor.
- Keep the technology stack, extension version, and source-of-truth docs current.

Last Updated: 2026-07-10
