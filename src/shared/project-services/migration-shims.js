// AutoFlow migration shim registry for classic-script compatibility.
(function initTFMigrationShims(root) {
  "use strict";

  const services = root.TFProjectServices || (root.TFProjectServices = {});

  const SHIMS = Object.freeze({
    service_namespace: Object.freeze({
      owner: "project-services loader shim",
      preserves: "IIFE/global access from background, Studio, side panel, and VM tests",
    }),
    studio_facade: Object.freeze({
      owner: "TFProjectStudioState",
      preserves: "Existing method names, return shapes, thrown errors, and subscriptions",
    }),
    command_result_adapter: Object.freeze({
      owner: "command registry",
      preserves: "Legacy thrown errors and raw records where current callers expect them",
    }),
    runtime_event_adapter: Object.freeze({
      owner: "runtime-event contracts",
      preserves: "Existing Chrome message names and required fields",
    }),
    background_handler_adapter: Object.freeze({
      owner: "message router",
      preserves: "Existing message types while handlers move behind router dispatch",
    }),
    legacy_project_normalizer: Object.freeze({
      owner: "project schema registry",
      preserves: "Field aliases, missing optional fields, and old video/cache/media statuses",
    }),
  });

  function requireGlobal(name) {
    const value = root[name];
    if (!value) {
      throw new Error(`Required AutoFlow global is not loaded: ${name}`);
    }
    return value;
  }

  function hasShim(name) {
    return Object.prototype.hasOwnProperty.call(SHIMS, name);
  }

  const api = Object.freeze({
    SHIMS,
    hasShim,
    requireGlobal,
  });

  services.migrationShims = api;
  root.TFMigrationShims = api;
})(globalThis);
