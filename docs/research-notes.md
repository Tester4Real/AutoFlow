# Refactor Research Notes

These are the sources and decisions behind the current split-file architecture.

## Sources Checked

- Chrome Extensions: Extension service worker basics  
  https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/basics
- Chrome Extensions: Migrate to a service worker  
  https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers
- Chrome Extensions: Side Panel API  
  https://developer.chrome.com/docs/extensions/reference/api/sidePanel
- MDN: `importScripts()`  
  https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts
- Reddit/community search was checked for practical MV3 pain points, but architecture decisions here are based on official Chrome documentation. Community posts mostly reinforced two known risks: MV3 service worker lifecycle surprises and the need to keep page-interception code simple.

## Decisions

- Keep `manifest.json` simple. Chrome MV3 expects `background.service_worker` to point at one service worker entry file, so `src/background/service-worker.js` stays tiny.
- Use `importScripts()` for the background runtime. Chrome documents it as a supported service worker import mechanism, and it avoids a full ES module/export rewrite.
- Use ordered classic scripts for the side panel. This preserves the existing global code behavior while splitting the file into smaller edit targets.
- Do not introduce a bundler yet. The user loads this as an unpacked extension, and the priority is low-token maintenance with minimal runtime risk.
- Split CSS by source order, not by aggressive selector reorganization. That keeps cascade behavior stable.

## Future Upgrade Path

If this becomes a long-term project, the next architecture step would be a real module refactor:

1. Convert shared state into explicit objects.
2. Move side panel features into ES modules with imports/exports.
3. Add a small build step for bundling and source maps.
4. Add automated browser smoke tests for side panel load, Flow connection, JSON import, and queue/gallery rendering.

For now, the ordered-shard approach gives most of the token and navigation benefit without changing the runtime model.
