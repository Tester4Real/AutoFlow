# TurboFlow Architecture

This repo is organized as a loadable Chrome MV3 extension. `manifest.json` stays at the root because Chrome reads it directly when loading the unpacked extension.

## Runtime Pieces

```text
Google Flow page
  -> src/content/page-fetch-interceptor.js
  -> window.postMessage("FLOW_AUTO_INTERCEPT")
  -> src/content/flow-page-bridge.js
  -> chrome.runtime.sendMessage(...)
  -> src/background/runtime.js
  -> src/shared/project-domain/00-project-domain.js
  -> src/shared/project-domain/01-project-json-contract.js
  -> src/background/runtime/*.js
  -> src/sidepanel/app/*.js
  -> src/project-studio/app/*.js
```

## Files By Responsibility

- `manifest.json`: extension permissions, host matches, side panel path, content script registration, icon paths.
- `src/background/service-worker.js`: small Chrome service worker entry point. It imports `runtime.js`.
- `src/background/runtime.js`: tiny loader that imports the shared project-domain module, then the ordered background shards.
- `src/shared/project-domain/00-project-domain.js`: DOM-free shared Project storage foundation. Owns `autoflowProjectStateV1`, schema normalization, stable `project_id` identity, active Project state, Project-scoped Assets, Prompt Records/import history, image generation run plans, Image Variant records, and `globalThis.TFProjectDomain`.
- `src/shared/project-domain/01-project-json-contract.js`: DOM-free project-aware prompt JSON contract parser. Owns accepted reference fields, per-type alias scope, empty-reference behavior, and `globalThis.TFProjectJsonContract`.
- `src/background/runtime/*.js`: background logic for Google Flow tab detection, connection checks, auth state, prompt submission, downloads, and message handling. See `docs/code-map.md`.
- `src/content/page-fetch-interceptor.js`: runs in the page `MAIN` world and wraps `window.fetch` so Google Flow API responses can be observed.
- `src/content/flow-page-bridge.js`: runs in the content-script `ISOLATED` world, reports page readiness, answers page-state requests, and forwards intercepted API events to the background runtime.
- `src/sidepanel/index.html`: side panel DOM structure, compact active Project selector strip, Project Studio opener, and inline modal/template markup.
- `src/sidepanel/sidepanel.css`: tiny CSS loader that imports the ordered style shards.
- `src/sidepanel/styles/*.css`: side panel visual styling split by source order.
- `src/sidepanel/sidepanel.js`: breadcrumb only. The side panel now loads `app/*.js` directly.
- `src/sidepanel/app/*.js`: side panel state, active Project selection, queue UI, gallery UI, settings, prompt mapping, calls to the background runtime, and `prompt-index.json` import. The JSON importer creates paired image/video batches, attaches bundled `assets/reference/Jack.jpg` to the image batch, maps JSON filenames to per-prompt downloads, resolves generated image media IDs into video start frames, and can relink cached or downloaded stills after switching Google accounts.
- `src/project-studio/index.html`: standalone extension page for larger Project workflows. It loads the shared project-domain module and ordered Project Studio app shards.
- `src/project-studio/studio.css`: Project Studio layout and visual styling.
- `src/project-studio/app/*.js`: Project Studio shell, active Project selector, Project Settings metadata edit form, typed Asset Manager, manual Asset File attachment/primary selection, inline Asset edit/disable controls, project-aware prompt JSON import into Prompt Records, reference resolution/blocking, manual blocked-reference mapping, ready-only image generation run planning, Image Variant filename mapping, Image Review board, selected variant metadata controls, workspace navigation, and details inspector.
- `assets/icons/`: browser extension icons referenced by `manifest.json`.
- `docs/code-map.md`: primary low-token edit map.
- `docs/research-notes.md`: source notes behind the split-file architecture.
- `docs/`: architecture notes and historical audit logs.

## Where To Edit

- New permission, URL match, side panel entry, or icon path: edit `manifest.json`.
- Batch generation behavior, downloads, connection checks, tab targeting, or background messages: start in `docs/code-map.md`, then edit the matching `src/background/runtime/*.js` shard.
- Page API interception or intercepted event names: edit `src/content/page-fetch-interceptor.js`.
- Project detection, page state reads, or content-to-background forwarding: edit `src/content/flow-page-bridge.js`.
- Side panel controls, queue rendering, gallery rendering, settings, or user-facing UI behavior: start in `docs/code-map.md`, then edit the matching `src/sidepanel/app/*.js` shard.
- Project-domain storage, stable Project identity, or active Project state: edit `src/shared/project-domain/00-project-domain.js`.
- Project-aware JSON reference fields, alias-scope contract, or prompt JSON normalization: edit `src/shared/project-domain/01-project-json-contract.js` and `docs/project-json-contract.md`.
- Project Studio shell, Project Settings metadata, typed Asset Manager, manual Asset File attachment/primary selection, Asset edit/disable behavior, project-aware prompt JSON import, reference resolution/blocking, manual blocked-reference mapping, ready-only image generation run planning, Image Variant filename mapping, Image Review board, selected variant metadata controls, larger workspace navigation, or details inspector: edit `src/project-studio/app/*.js` and `src/project-studio/studio.css`.
- Prompt-index JSON import, bundled Jack reference upload, account-switch relinking, JSON filename mapping, or image-to-video chaining: edit `src/sidepanel/app/05b-json-folder-sync.js`, plus `src/background/runtime/02b-image-generation.js`, `src/background/runtime/02c-video-generation.js`, or `src/background/runtime/03-downloads-cache.js` when needed.
- Side panel layout or colors: edit `src/sidepanel/styles/*.css` and `src/sidepanel/index.html`.

## Naming Rule

Use descriptive role-based names for future files, such as `batch-runner.js`, `download-manager.js`, or `prompt-mapper.js`. Avoid hashed bundle names in this repo unless a build tool generates them and the manifest is updated automatically.
