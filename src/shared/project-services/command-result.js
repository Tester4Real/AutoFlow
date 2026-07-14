// AutoFlow command-result contract registry.
(function initTFCommandResult(root) {
  "use strict";

  const services = root.TFProjectServices || (root.TFProjectServices = {});

  const REPAIR_ACTIONS = Object.freeze([
    "OPEN_STUDIO",
    "REFRESH_PROJECT",
    "RETRY",
    "REPAIR_REFERENCE",
    "REPAIR_START_FRAME",
    "SELECT_VARIANT",
    "SYNC_MEDIA",
  ]);

  function normalizeCode(value, fallback) {
    const code = String(value || "").trim().toUpperCase();
    return /^[A-Z0-9_]+$/.test(code) ? code : fallback;
  }

  function normalizeIds(ids) {
    if (!ids || typeof ids !== "object" || Array.isArray(ids)) return {};
    return Object.keys(ids).reduce((result, key) => {
      const value = ids[key];
      if (value !== undefined && value !== null && String(value).trim()) {
        result[key] = String(value).trim();
      }
      return result;
    }, {});
  }

  function normalizeChanged(changed) {
    return Array.isArray(changed)
      ? changed.map((key) => String(key || "").trim()).filter(Boolean)
      : [];
  }

  function normalizeRepair(repair) {
    if (!repair || typeof repair !== "object" || Array.isArray(repair)) return null;
    const action = normalizeCode(repair.action, "");
    if (!REPAIR_ACTIONS.includes(action)) return null;
    return Object.assign({}, repair, {
      action,
      label: String(repair.label || action).trim(),
    });
  }

  function success(options = {}) {
    return Object.freeze({
      ok: true,
      code: normalizeCode(options.code, "OK"),
      message: String(options.message || "").trim(),
      ids: normalizeIds(options.ids),
      changed: normalizeChanged(options.changed),
      repair: null,
    });
  }

  function failure(code, message, options = {}) {
    return Object.freeze({
      ok: false,
      code: normalizeCode(code, "COMMAND_FAILED"),
      message: String(message || "Command failed.").trim(),
      ids: normalizeIds(options.ids),
      changed: normalizeChanged(options.changed),
      repair: normalizeRepair(options.repair),
    });
  }

  function fromLegacyError(error, options = {}) {
    const code = error?.code || error?.error?.code || options.code || "COMMAND_FAILED";
    const message =
      error?.message || error?.error?.message || options.message || "Command failed.";
    return failure(code, message, options);
  }

  function validate(result) {
    const errors = [];
    if (!result || typeof result !== "object" || Array.isArray(result)) {
      return { ok: false, errors: ["Command result must be an object."] };
    }
    if (typeof result.ok !== "boolean") errors.push("ok must be boolean.");
    if (!/^[A-Z0-9_]+$/.test(String(result.code || ""))) {
      errors.push("code must be UPPER_SNAKE_CASE.");
    }
    if (typeof result.message !== "string") errors.push("message must be string.");
    if (!result.ids || typeof result.ids !== "object" || Array.isArray(result.ids)) {
      errors.push("ids must be an object.");
    }
    if (!Array.isArray(result.changed)) errors.push("changed must be an array.");
    if (result.repair !== null && normalizeRepair(result.repair) === null) {
      errors.push("repair must be null or a known repair action.");
    }
    return { ok: errors.length === 0, errors };
  }

  function toLegacyError(result) {
    const validation = validate(result);
    if (!validation.ok) {
      return new Error(validation.errors.join(" "));
    }
    if (result.ok) return null;
    const error = new Error(result.message || result.code);
    error.code = result.code;
    error.ids = result.ids;
    error.repair = result.repair;
    return error;
  }

  function unwrapOrThrow(result, value) {
    const error = toLegacyError(result);
    if (error) throw error;
    return value === undefined ? result : value;
  }

  const api = Object.freeze({
    REPAIR_ACTIONS,
    failure,
    fromLegacyError,
    success,
    toLegacyError,
    unwrapOrThrow,
    validate,
  });

  services.commandResult = api;
  root.TFCommandResult = api;
})(globalThis);
