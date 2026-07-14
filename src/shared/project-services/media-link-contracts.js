// AutoFlow media-link contract registry.
(function initTFMediaLinkContracts(root) {
  "use strict";

  const services = root.TFProjectServices || (root.TFProjectServices = {});
  const schema = root.TFProjectSchema;

  const MEDIA_LINK_FIELDS = Object.freeze([
    "media_link_id",
    "project_id",
    "owner_type",
    "owner_id",
    "local_media_id",
    "cache_key",
    "flow_media_id",
    "flow_context_id",
    "download_id",
    "local_path",
    "file_name",
    "mime_type",
    "size_bytes",
    "created_at",
    "updated_at",
  ]);

  const CACHE_KEY_PREFIXES = Object.freeze({
    hash: "sha256:",
    media: "media:",
  });

  function clean(value) {
    return String(value || "").trim();
  }

  function readAlias(record, aliasName) {
    return schema && typeof schema.readAlias === "function"
      ? schema.readAlias(record, aliasName)
      : clean(record?.[aliasName]);
  }

  function normalizeHash(value) {
    const hash = clean(value).toLowerCase().replace(/^sha256:/, "");
    return /^[a-f0-9]{64}$/.test(hash) ? hash : "";
  }

  function hashCacheKey(value) {
    const hash = normalizeHash(value);
    return hash ? `${CACHE_KEY_PREFIXES.hash}${hash}` : "";
  }

  function mediaCacheKey(value) {
    const mediaId = clean(value);
    return mediaId ? `${CACHE_KEY_PREFIXES.media}${mediaId}`.toLowerCase() : "";
  }

  function normalizeCacheKey(value) {
    const key = clean(value).toLowerCase();
    if (!key) return "";
    if (key.startsWith(CACHE_KEY_PREFIXES.hash)) return hashCacheKey(key);
    if (key.startsWith(CACHE_KEY_PREFIXES.media)) return key;
    return hashCacheKey(key) || key;
  }

  function normalizeMediaLink(input = {}) {
    const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
    const fileName = clean(source.file_name) || readAlias(source, "local_file_name");
    const now = new Date().toISOString();
    return Object.freeze({
      media_link_id: clean(source.media_link_id || source.mediaLinkId),
      project_id: clean(source.project_id || source.projectId),
      owner_type: clean(source.owner_type || source.ownerType),
      owner_id: clean(source.owner_id || source.ownerId || source.variant_id || source.job_id),
      local_media_id: clean(source.local_media_id || source.localMediaId),
      cache_key: normalizeCacheKey(clean(source.cache_key) || readAlias(source, "cache_key")),
      flow_media_id: clean(source.flow_media_id || source.flowMediaId || source.media_id),
      flow_context_id: clean(source.flow_context_id) || readAlias(source, "flow_context_id"),
      download_id: clean(source.download_id || source.downloadId),
      local_path: clean(source.local_path || source.localPath),
      file_name: fileName,
      mime_type: clean(source.mime_type || source.mimeType),
      size_bytes: Number.isFinite(Number(source.size_bytes || source.sizeBytes))
        ? Number(source.size_bytes || source.sizeBytes)
        : 0,
      created_at: clean(source.created_at || source.createdAt) || now,
      updated_at: clean(source.updated_at || source.updatedAt) || now,
    });
  }

  function validateMediaLink(link) {
    const normalized = normalizeMediaLink(link);
    const errors = [];
    ["media_link_id", "project_id", "owner_id"].forEach((field) => {
      if (!normalized[field]) errors.push(`media link missing ${field}.`);
    });
    if (!normalized.local_media_id && !normalized.cache_key && !normalized.flow_media_id) {
      errors.push("media link needs at least one local, cache, or Flow identity.");
    }
    return { ok: errors.length === 0, errors, link: normalized };
  }

  const api = Object.freeze({
    CACHE_KEY_PREFIXES,
    MEDIA_LINK_FIELDS,
    hashCacheKey,
    mediaCacheKey,
    normalizeCacheKey,
    normalizeMediaLink,
    validateMediaLink,
  });

  services.mediaLinkContracts = api;
  root.TFMediaLinkContracts = api;
})(globalThis);
