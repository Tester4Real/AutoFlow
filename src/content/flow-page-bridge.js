(() => {
  "use strict";

  function projectIdFromLocation() {
    const match =
      window.location.pathname.match(/\/project\/([^/?#]+)/) ||
      window.location.href.match(/\/project\/([^/?#]+)/);
    return match ? match[1] : null;
  }

  function reportFlowPageReady() {
    const projectId = projectIdFromLocation();
    chrome.runtime?.id &&
      chrome.runtime
        .sendMessage({
          type: "FLOW_PAGE_READY",
          url: window.location.href,
          projectId,
          hasProject: !!projectId,
        })
        .catch(() => {});
  }

  function installNavigationHooks() {
    const notify = () => setTimeout(reportFlowPageReady, 100);
    for (const method of ["pushState", "replaceState"]) {
      const original = history[method];
      history[method] = function (...args) {
        const result = original.apply(this, args);
        notify();
        return result;
      };
    }
    window.addEventListener("popstate", notify);
    window.addEventListener("pageshow", notify);
  }

  reportFlowPageReady();
  installNavigationHooks();

  window.addEventListener("message", function (event) {
    event.source === window &&
      "FLOW_AUTO_INTERCEPT" === event.data?.type &&
      chrome.runtime?.id &&
      chrome.runtime
        .sendMessage({
          type: "API_INTERCEPTED",
          eventType: event.data.eventType,
          url: event.data.url,
          method: event.data.method,
          status: event.data.status,
          data: event.data.data,
          timestamp: event.data.timestamp,
        })
        .catch(() => {});
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if ("GET_PAGE_STATE" === message.type) {
      const editor = document.querySelector('div[data-slate-editor="true"]'),
        projectId = projectIdFromLocation();
      return (
        sendResponse({
          hasEditor: !!editor,
          currentPrompt: editor?.textContent || "",
          url: window.location.href,
          projectId,
          hasProject: !!projectId,
        }),
        !0
      );
    }
    if ("GET_ALL_IMAGES" === message.type) {
      const images = document.querySelectorAll('img[alt="Generated image"]');
      return (
        sendResponse({
          images: Array.from(images).map((image) => {
            const tile = image.closest("div[data-tile-id]"),
              src = image.src,
              match = src.match(/name=([a-f0-9-]+)/);
            return {
              src,
              tileId: tile?.getAttribute("data-tile-id") || null,
              mediaId: match ? match[1] : null,
            };
          }),
        }),
        !0
      );
    }
  });
})();
