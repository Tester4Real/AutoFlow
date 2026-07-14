// AutoFlow runtime event contract registry.
(function initTFRuntimeEvents(root) {
  "use strict";

  const services = root.TFProjectServices || (root.TFProjectServices = {});

  const EVENT_CONTRACTS = Object.freeze({
    PREVIEW_READY: Object.freeze({
      authority: "durable_generated_media_fact",
      command: "recordGeneratedVariant",
      idempotencyFields: Object.freeze(["batch_id", "media_id"]),
      required: Object.freeze(["batch_id", "media_id"]),
    }),
    PREVIEW_CACHED: Object.freeze({
      authority: "durable_local_cache_fact",
      command: "linkGeneratedPreviewCache",
      idempotencyFields: Object.freeze(["media_id", "cache_key"]),
      required: Object.freeze(["media_id", "cache_key"]),
    }),
    PROMPT_STATUS: Object.freeze({
      authority: "durable_newer_status_sequence",
      command: "recordPromptStatus",
      idempotencyFields: Object.freeze(["batch_id", "prompt_index", "status_sequence"]),
      required: Object.freeze(["batch_id", "prompt_index", "status"]),
    }),
    BATCH_GENERATION_DONE: Object.freeze({
      authority: "durable_run_completion_summary",
      command: "completeImageRun",
      idempotencyFields: Object.freeze(["batch_id", "completed_at"]),
      required: Object.freeze(["batch_id", "completed_at"]),
    }),
    DOWNLOAD_COMPLETE: Object.freeze({
      authority: "durable_downloaded_file_fact",
      command: "recordDownloadCompletion",
      idempotencyFields: Object.freeze(["download_id", "media_id", "file_name"]),
      required: Object.freeze(["file_name"]),
    }),
    DOWNLOAD_STARTED: Object.freeze({
      authority: "transient_download_progress",
      command: "",
      idempotencyFields: Object.freeze(["download_id", "media_id", "file_name"]),
      required: Object.freeze(["file_name"]),
    }),
    DOWNLOAD_FAILED: Object.freeze({
      authority: "durable_download_failure_fact",
      command: "recordDownloadFailure",
      idempotencyFields: Object.freeze(["download_id", "media_id", "file_name"]),
      required: Object.freeze(["file_name"]),
    }),
    VIDEO_PREVIEW_READY: Object.freeze({
      authority: "durable_video_output_fact",
      command: "recordVideoOutput",
      idempotencyFields: Object.freeze(["job_id", "media_id"]),
      required: Object.freeze(["job_id", "media_id"]),
    }),
  });

  function clean(value) {
    return String(value || "").trim();
  }

  function getType(input) {
    return clean(input?.type || input?.event_type || input?.name).toUpperCase();
  }

  function buildIdempotencyKey(type, payload) {
    const contract = EVENT_CONTRACTS[type];
    if (!contract) return "";
    return contract.idempotencyFields
      .map((field) => clean(payload[field]))
      .filter(Boolean)
      .join(":");
  }

  function createEvent(type, payload = {}, options = {}) {
    const eventType = clean(type).toUpperCase();
    const contract = EVENT_CONTRACTS[eventType];
    if (!contract) {
      throw new Error(`Unknown runtime event type: ${type}`);
    }
    const event = Object.assign({}, payload, {
      type: eventType,
      event_type: eventType,
      event_id: clean(options.event_id || payload.event_id) || buildIdempotencyKey(eventType, payload),
      occurred_at: clean(options.occurred_at || payload.occurred_at) || new Date().toISOString(),
      idempotency_key:
        clean(options.idempotency_key || payload.idempotency_key) ||
        buildIdempotencyKey(eventType, payload),
    });
    return Object.freeze(event);
  }

  function parseEvent(input) {
    const type = getType(input);
    const contract = EVENT_CONTRACTS[type];
    if (!contract) {
      return { ok: false, errors: [`Unknown runtime event type: ${type || "(empty)"}`] };
    }
    const missing = contract.required.filter((field) => {
      const value = input?.[field];
      return value === undefined || value === null || clean(value) === "";
    });
    if (missing.length) {
      return {
        ok: false,
        errors: missing.map((field) => `${type} missing ${field}.`),
        contract,
      };
    }
    return { ok: true, event: createEvent(type, input), contract, errors: [] };
  }

  const api = Object.freeze({
    EVENT_CONTRACTS,
    buildIdempotencyKey,
    createEvent,
    parseEvent,
  });

  services.runtimeEvents = api;
  root.TFRuntimeEvents = api;
})(globalThis);
