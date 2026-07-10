# TurboFlow connection fix v5 audit

## Goal
Fix the persistent `Disconnected` state and `The message port closed before a response was received` error.

## Root cause from runtime output
The v4 hard shim loaded, but `CHECK_CONNECTION` still returned a closed message port. That indicates the extra shim listener was not enough and the original bundled listener in `src/background/runtime.js` still conflicted with or prevented a reliable response.

## What changed in v5
- Restored the background loader architecture:
  - `src/background/service-worker.js` imports `runtime.js`.
- Removed the extra hard-shim background listener.
- Patched `src/background/runtime.js` directly, inside the existing single background message listener.
- Replaced the existing `CHECK_CONNECTION` and `GET_CONNECTION_STATE` branches with a direct callback-based responder.
- The responder:
  - uses `chrome.tabs.query({}, callback)` rather than Promise-style tab querying,
  - scans every Chrome tab visible to the extension,
  - matches `https://labs.google/fx/tools/flow...` and locale/project variants,
  - prefers URLs containing `/project/<projectId>`,
  - updates the internal background variables `c`, `u`, and `_vD`,
  - always calls `sendResponse({ state })`, with a 1.2 second timeout fallback.

## What this fix intentionally does not do
- It does not call Google Flow auth/session endpoints.
- It does not call credits endpoints.
- It does not call reCAPTCHA.
- It does not call private generation endpoints during connection checks.
- It does not restore TurboFlow server/payment APIs.

## Validation
- `node --check src/background/runtime.js` passed.
- `node --check src/sidepanel/sidepanel.js` passed.
- `node --check src/content/page-fetch-interceptor.js` passed.
- `node --check src/content/flow-page-bridge.js` passed.
- `manifest.json` parses correctly.
- Version bumped to 2.2.16.
