// AutoFlow Project Studio shard: tiny boot loader.
// Loaded last by src/project-studio/index.html.
(function bootTFProjectStudio(root) {
  "use strict";

  function start() {
    root.TFProjectStudioShell?.boot();
  }

  if (root.document.readyState === "loading") {
    root.document.addEventListener("DOMContentLoaded", start, { once: true });
    return;
  }

  start();
})(globalThis);
