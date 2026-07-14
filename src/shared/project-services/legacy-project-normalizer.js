// AutoFlow legacy project tolerance helpers.
(function initTFLegacyProjectNormalizer(root) {
  "use strict";

  const services = root.TFProjectServices || (root.TFProjectServices = {});
  const schema = root.TFProjectSchema;

  const VIDEO_STATUS_ALIASES = Object.freeze({
    done: "completed",
    complete: "completed",
    finished: "completed",
    pending: "queued",
    waiting: "queued",
    in_progress: "running",
    processing: "running",
    error: "failed",
  });

  function clean(value) {
    return String(value || "").trim();
  }

  function readAlias(record, aliasName) {
    return schema && typeof schema.readAlias === "function"
      ? schema.readAlias(record, aliasName)
      : clean(record?.[aliasName]);
  }

  function normalizeVideoStatus(value) {
    const status = clean(value).toLowerCase();
    return VIDEO_STATUS_ALIASES[status] || status || "queued";
  }

  function normalizeVariantReference(record = {}) {
    return Object.freeze({
      selected_variant_id: readAlias(record, "selected_variant_id"),
      generated_file_name: readAlias(record, "generated_file_name"),
      local_file_name: readAlias(record, "local_file_name"),
      cache_key: readAlias(record, "cache_key"),
      flow_context_id: readAlias(record, "flow_context_id"),
      file_state: readAlias(record, "file_state"),
    });
  }

  function normalizeProject(project = {}) {
    const base =
      schema && typeof schema.normalizeProjectSubdocuments === "function"
        ? schema.normalizeProjectSubdocuments(project)
        : Object.assign({}, project);
    base.video_jobs = Array.isArray(base.video_jobs)
      ? base.video_jobs.map((job) =>
          Object.assign({}, job, {
            status: normalizeVideoStatus(job?.status),
            selected_variant_id:
              clean(job?.selected_variant_id) || readAlias(job, "selected_variant_id"),
          }),
        )
      : [];
    base.image_variants = Array.isArray(base.image_variants)
      ? base.image_variants.map((variant) =>
          Object.assign({}, variant, normalizeVariantReference(variant)),
        )
      : [];
    return base;
  }

  const api = Object.freeze({
    VIDEO_STATUS_ALIASES,
    normalizeProject,
    normalizeVariantReference,
    normalizeVideoStatus,
  });

  services.legacyProjectNormalizer = api;
  root.TFLegacyProjectNormalizer = api;
})(globalThis);
