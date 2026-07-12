// TurboFlow side panel shard: Channel Studio entry point.
// Loaded by src/sidepanel/index.html after shared side panel helpers.
(function initProjectStudioLink(root) {
  "use strict";

  function getStudioUrl(view) {
    const hash = view ? `#${encodeURIComponent(view)}` : "";
    if (root.chrome?.runtime?.getURL) {
      return root.chrome.runtime.getURL(`src/project-studio/index.html${hash}`);
    }
    return `../project-studio/index.html${hash}`;
  }

  function openStudio(button, view) {
    const url = getStudioUrl(view);
    if (!root.chrome?.tabs?.create) {
      root.open(url, "_blank", "noopener");
      return;
    }

    button.disabled = true;
    root.chrome.tabs.create({ url }, () => {
      const lastError = root.chrome?.runtime?.lastError;
      button.disabled = false;
      if (lastError) {
        root.console.warn("Channel Studio open failed:", lastError.message);
      }
    });
  }

  function attach() {
    const button = root.document.querySelector("#btn-open-project-studio");
    const videoButton = root.document.querySelector("#btn-open-project-video-queue");
    button?.addEventListener("click", () => openStudio(button));
    videoButton?.addEventListener("click", () => openStudio(videoButton, "video"));
  }

  if (root.document.readyState === "loading") {
    root.document.addEventListener("DOMContentLoaded", attach, { once: true });
    return;
  }

  attach();
})(globalThis);
