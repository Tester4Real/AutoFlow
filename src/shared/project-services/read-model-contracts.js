// AutoFlow read-model contract registry.
(function initTFReadModelContracts(root) {
  "use strict";

  const services = root.TFProjectServices || (root.TFProjectServices = {});

  const READ_MODELS = Object.freeze([
    "imageReviewRows",
    "videoQueueRows",
    "mediaItems",
    "cockpitSummary",
    "projectFacts",
  ]);

  const REQUIRED_FIELDS = Object.freeze({
    imageReviewRows: Object.freeze(["prompt_id", "status", "selected_variant_id"]),
    videoQueueRows: Object.freeze(["job_id", "prompt_id", "status", "can_run"]),
    mediaItems: Object.freeze(["media_link_id", "owner_id", "cache_state"]),
    cockpitSummary: Object.freeze(["ready_count", "blocked_count", "running_count"]),
    projectFacts: Object.freeze(["project_id", "revision", "flow_context_status"]),
  });

  function normalizeChanged(keys) {
    return Array.from(
      new Set(
        (Array.isArray(keys) ? keys : [keys])
          .map((key) => String(key || "").trim())
          .filter((key) => READ_MODELS.includes(key)),
      ),
    );
  }

  function validateRow(modelName, row) {
    const required = REQUIRED_FIELDS[modelName];
    if (!required) {
      return { ok: false, errors: [`Unknown read model: ${modelName}`] };
    }
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      return { ok: false, errors: [`${modelName} row must be an object.`] };
    }
    const missing = required.filter(
      (field) => row[field] === undefined || row[field] === null,
    );
    return {
      ok: missing.length === 0,
      errors: missing.map((field) => `${modelName} row missing ${field}.`),
    };
  }

  function validateRows(modelName, rows) {
    if (!Array.isArray(rows)) {
      return { ok: false, errors: [`${modelName} must be an array.`] };
    }
    const errors = [];
    rows.forEach((row, index) => {
      const result = validateRow(modelName, row);
      result.errors.forEach((error) => errors.push(`${index}: ${error}`));
    });
    return { ok: errors.length === 0, errors };
  }

  const api = Object.freeze({
    READ_MODELS,
    REQUIRED_FIELDS,
    normalizeChanged,
    validateRow,
    validateRows,
  });

  services.readModelContracts = api;
  root.TFReadModelContracts = api;
})(globalThis);
