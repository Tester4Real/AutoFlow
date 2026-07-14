// AutoFlow project envelope contract registry.
// Classic-script module shared by extension pages, MV3 background, and Node VM tests.
(function initTFProjectSchema(root) {
  "use strict";

  const services = root.TFProjectServices || (root.TFProjectServices = {});
  const STORAGE_KEY = root.TFProjectDomain?.STORAGE_KEY || "autoflowProjectStateV1";
  const SCHEMA_VERSION = root.TFProjectDomain?.SCHEMA_VERSION || 1;

  const PROJECT_COLLECTIONS = Object.freeze([
    "assets",
    "prompt_imports",
    "prompt_records",
    "image_generation_runs",
    "image_variants",
    "video_jobs",
    "media_links",
  ]);

  const ENTITY_IDENTITIES = Object.freeze({
    project: Object.freeze(["schema_version", "revision", "project_id"]),
    asset: Object.freeze(["asset_id", "project_id"]),
    asset_file: Object.freeze(["asset_file_id", "asset_id", "project_id"]),
    prompt: Object.freeze(["prompt_id", "project_id"]),
    prompt_reference: Object.freeze(["prompt_id", "reference_key"]),
    image_variant: Object.freeze(["variant_id", "project_id", "prompt_id"]),
    video_job: Object.freeze(["job_id", "project_id", "prompt_id"]),
    media_link: Object.freeze(["media_link_id", "project_id", "owner_id"]),
    flow_context: Object.freeze(["flow_context_id"]),
  });

  const LEGACY_FIELD_ALIASES = Object.freeze({
    selected_variant_id: Object.freeze(["selected_variant_id", "selectedVariantId"]),
    generated_file_name: Object.freeze(["generated_file_name", "generatedFileName"]),
    local_file_name: Object.freeze(["local_file_name", "localFileName", "file_name", "fileName"]),
    cache_key: Object.freeze(["cache_key", "cacheKey"]),
    flow_context_id: Object.freeze(["flow_context_id", "flowContextId"]),
    file_state: Object.freeze(["file_state", "fileState"]),
  });

  function isObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function toArray(value) {
    return Array.isArray(value) ? value.filter(isObject).map(clone) : [];
  }

  function toRevision(value) {
    const number = Number(value);
    return Number.isSafeInteger(number) && number >= 0 ? number : 0;
  }

  function normalizeProjectSubdocuments(project) {
    const source = isObject(project) ? clone(project) : {};
    PROJECT_COLLECTIONS.forEach((key) => {
      source[key] = toArray(source[key]);
    });
    return source;
  }

  function fallbackNormalizeState(input) {
    const source = isObject(input) ? clone(input) : {};
    const projects = Array.isArray(source.projects) ? source.projects : [];
    return Object.assign({}, source, {
      schema_version: SCHEMA_VERSION,
      active_project_id: source.active_project_id || null,
      projects: projects.filter(isObject).map(normalizeProjectSubdocuments),
      meta: isObject(source.meta) ? clone(source.meta) : {},
    });
  }

  function normalizeEnvelope(input) {
    const domain = root.TFProjectDomain;
    const base =
      domain && typeof domain.normalizeState === "function"
        ? domain.normalizeState(input)
        : fallbackNormalizeState(input);
    const envelope = clone(base);
    const revision = toRevision(envelope.revision ?? envelope.meta?.revision);

    envelope.schema_version = Number(envelope.schema_version) || SCHEMA_VERSION;
    envelope.revision = revision;
    envelope.meta = Object.assign({}, envelope.meta, {
      storage_key: STORAGE_KEY,
      schema_version: envelope.schema_version,
      revision,
    });
    envelope.projects = Array.isArray(envelope.projects)
      ? envelope.projects.filter(isObject).map(normalizeProjectSubdocuments)
      : [];
    return envelope;
  }

  function nextRevisionEnvelope(input) {
    const envelope = normalizeEnvelope(input);
    const revision = envelope.revision + 1;
    envelope.revision = revision;
    envelope.meta.revision = revision;
    return envelope;
  }

  function readAlias(record, aliasName) {
    const fields = LEGACY_FIELD_ALIASES[aliasName] || Object.freeze([aliasName]);
    for (const field of fields) {
      const value = record?.[field];
      if (value !== undefined && value !== null && String(value).trim()) {
        return String(value).trim();
      }
    }
    return "";
  }

  const api = Object.freeze({
    ENTITY_IDENTITIES,
    LEGACY_FIELD_ALIASES,
    PROJECT_COLLECTIONS,
    SCHEMA_VERSION,
    STORAGE_KEY,
    clone,
    isObject,
    nextRevisionEnvelope,
    normalizeEnvelope,
    normalizeProjectSubdocuments,
    readAlias,
  });

  services.projectSchema = api;
  root.TFProjectSchema = api;
})(globalThis);
