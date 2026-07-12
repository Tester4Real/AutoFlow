(function initStudioBootstrap(root) {
  "use strict";

  const errors = [];

  function messageOf(value) {
    return String(value?.message || value?.reason?.message || value?.reason || value || "Unknown Studio error");
  }

  root.addEventListener("error", (event) => {
    errors.push(messageOf(event.error || event.message));
  });

  root.addEventListener("unhandledrejection", (event) => {
    errors.push(messageOf(event.reason));
  });

  root.setTimeout(() => {
    const container = root.document.getElementById("studio-root");
    if (!container || container.childElementCount || !errors.length) return;

    const panel = root.document.createElement("div");
    panel.className = "studio-bootstrap-error";

    const title = root.document.createElement("h1");
    title.textContent = "Studio could not open";

    const detail = root.document.createElement("p");
    detail.textContent = errors[0];

    panel.append(title, detail);
    container.append(panel);
  }, 800);
})(globalThis);
