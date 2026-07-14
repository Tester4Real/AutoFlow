(function initStudioBootstrap(root) {
  "use strict";

  const errors = [];

  function messageOf(value) {
    return String(value?.message || value?.reason?.message || value?.reason || value || "Unknown Studio error");
  }

  root.addEventListener(
    "error",
    (event) => {
      const target = event.target;
      if (target && target !== root && (target.src || target.href)) {
        errors.push(`Failed to load ${target.src || target.href}`);
        return;
      }
      errors.push(messageOf(event.error || event.message));
    },
    true,
  );

  root.addEventListener("unhandledrejection", (event) => {
    errors.push(messageOf(event.reason));
  });

  root.setTimeout(() => {
    const container = root.document.getElementById("studio-root");
    if (!container || container.childElementCount) return;

    const panel = root.document.createElement("div");
    panel.className = "studio-bootstrap-error";

    const title = root.document.createElement("h1");
    title.textContent = "Studio could not open";

    const detail = root.document.createElement("p");
    const bundleState = [
      `bundleLoaded=${root.__TF_STUDIO_BUNDLE_LOADED === true}`,
      `renderRequested=${root.__TF_STUDIO_RENDER_REQUESTED === true}`,
      `mountCommitted=${root.__TF_STUDIO_MOUNT_COMMITTED === true}`,
    ].join(", ");
    detail.textContent =
      errors[0] ||
      `The Studio bundle did not mount (${bundleState}). Reload the unpacked extension from dist/extension, then reopen Studio.`;

    panel.append(title, detail);
    container.append(panel);
  }, 800);
})(globalThis);
