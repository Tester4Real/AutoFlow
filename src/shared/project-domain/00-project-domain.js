// AutoFlow project-domain foundation.
// DOM-free classic script shared by extension pages and the MV3 service worker.
(function initTFProjectDomain(root) {
  "use strict";

  const STORAGE_KEY = "autoflowProjectStateV1";
  const SCHEMA_VERSION = 1;
  const DEFAULT_PROJECT_NAME = "Untitled Project";
  const ID_PREFIX = "project";

  let storageAdapter = null;

  function nowIso() {
    return new Date().toISOString();
  }

  function isObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function safeDisplayName(value) {
    const name = String(value || "").trim();
    return name || DEFAULT_PROJECT_NAME;
  }

  function createId(prefix) {
    const cryptoApi = root.crypto;
    if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
      return `${prefix}_${cryptoApi.randomUUID().replace(/-/g, "")}`;
    }
    return `${prefix}_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  function emptyState(warnings) {
    const timestamp = nowIso();
    return {
      schema_version: SCHEMA_VERSION,
      meta: {
        storage_key: STORAGE_KEY,
        schema_version: SCHEMA_VERSION,
        created_at: timestamp,
        updated_at: timestamp,
        warnings: Array.isArray(warnings) ? warnings.slice() : [],
      },
      active_project_id: null,
      projects: [],
    };
  }

  function normalizeProject(input, warnings, seenIds) {
    const source = isObject(input) ? input : {};
    let projectId = String(source.project_id || source.projectId || "").trim();

    if (!projectId || seenIds.has(projectId)) {
      if (projectId && seenIds.has(projectId)) {
        warnings.push(`Duplicate project id replaced: ${projectId}`);
      }
      projectId = createId(ID_PREFIX);
    }

    seenIds.add(projectId);

    const createdAt =
      typeof source.created_at === "string" && source.created_at
        ? source.created_at
        : nowIso();
    const updatedAt =
      typeof source.updated_at === "string" && source.updated_at
        ? source.updated_at
        : createdAt;
    const videoJobs = Array.isArray(source.video_jobs)
      ? source.video_jobs
      : Array.isArray(source.videoJobs)
        ? source.videoJobs
        : [];

    return Object.assign({}, source, {
      project_id: projectId,
      display_name: safeDisplayName(
        source.display_name || source.displayName || source.name,
      ),
      settings: isObject(source.settings) ? source.settings : {},
      current_flow_context_id: String(
        source.current_flow_context_id || source.currentFlowContextId || "",
      ).trim(),
      flow_context: isObject(source.flow_context || source.flowContext)
        ? clone(source.flow_context || source.flowContext)
        : null,
      image_variants: Array.isArray(source.image_variants)
        ? source.image_variants.filter(isObject).map(clone)
        : [],
      video_jobs: videoJobs.filter(isObject).map(clone),
      created_at: createdAt,
      updated_at: updatedAt,
    });
  }

  function normalizeState(input) {
    const warnings = [];

    if (!isObject(input)) {
      warnings.push("Project state envelope was missing or invalid.");
      return emptyState(warnings);
    }

    const rawProjects = Array.isArray(input.projects) ? input.projects : [];
    if (!Array.isArray(input.projects)) {
      warnings.push("Project list was missing or invalid.");
    }

    const seenIds = new Set();
    const projects = rawProjects
      .filter(isObject)
      .map((project) => normalizeProject(project, warnings, seenIds));

    const projectIds = new Set(projects.map((project) => project.project_id));
    let activeProjectId = String(
      input.active_project_id || input.activeProjectId || "",
    ).trim();

    if (activeProjectId && !projectIds.has(activeProjectId)) {
      warnings.push(`Invalid active project id cleared: ${activeProjectId}`);
      activeProjectId = "";
    }

    const timestamp = nowIso();
    const existingMeta = isObject(input.meta) ? input.meta : {};
    const previousWarnings = Array.isArray(existingMeta.warnings)
      ? existingMeta.warnings
      : [];

    return Object.assign({}, input, {
      schema_version: SCHEMA_VERSION,
      meta: Object.assign({}, existingMeta, {
        storage_key: STORAGE_KEY,
        schema_version: SCHEMA_VERSION,
        created_at:
          typeof existingMeta.created_at === "string" && existingMeta.created_at
            ? existingMeta.created_at
            : timestamp,
        updated_at: timestamp,
        warnings: previousWarnings.concat(warnings),
      }),
      active_project_id: activeProjectId || null,
      projects,
    });
  }

  function getStorageArea() {
    if (storageAdapter) return storageAdapter;
    if (
      root.chrome &&
      root.chrome.storage &&
      root.chrome.storage.local
    ) {
      return root.chrome.storage.local;
    }
    return null;
  }

  function chromeLastError() {
    return root.chrome && root.chrome.runtime && root.chrome.runtime.lastError;
  }

  function storageGet(key) {
    const storage = getStorageArea();
    if (!storage || typeof storage.get !== "function") {
      return Promise.resolve({});
    }

    return new Promise((resolve, reject) => {
      try {
        const maybePromise = storage.get(key, (items) => {
          const lastError = chromeLastError();
          if (lastError) {
            reject(new Error(lastError.message || "Storage read failed."));
            return;
          }
          resolve(items || {});
        });

        if (maybePromise && typeof maybePromise.then === "function") {
          maybePromise.then(resolve, reject);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  function storageSet(items) {
    const storage = getStorageArea();
    if (!storage || typeof storage.set !== "function") {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        const maybePromise = storage.set(items, () => {
          const lastError = chromeLastError();
          if (lastError) {
            reject(new Error(lastError.message || "Storage write failed."));
            return;
          }
          resolve();
        });

        if (maybePromise && typeof maybePromise.then === "function") {
          maybePromise.then(resolve, reject);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  async function save(state) {
    const normalized = normalizeState(state);
    normalized.meta.updated_at = nowIso();
    await storageSet({ [STORAGE_KEY]: normalized });
    return clone(normalized);
  }

  async function load() {
    const items = await storageGet(STORAGE_KEY);
    const state = normalizeState(items[STORAGE_KEY]);
    await save(state);
    return clone(state);
  }

  async function createProject(input) {
    const state = await load();
    const timestamp = nowIso();
    const source = isObject(input) ? input : {};
    const project = normalizeProject(
      Object.assign({}, source, {
        project_id: createId(ID_PREFIX),
        display_name: safeDisplayName(
          source.display_name || source.displayName || source.name,
        ),
        created_at: timestamp,
        updated_at: timestamp,
      }),
      [],
      new Set(state.projects.map((item) => item.project_id)),
    );

    state.projects.push(project);
    if (!state.active_project_id) {
      state.active_project_id = project.project_id;
    }

    const savedState = await save(state);
    return { ok: true, project: clone(project), state: savedState };
  }

  async function updateProject(projectId, updates) {
    const state = await load();
    const id = String(projectId || "").trim();
    const project = state.projects.find((item) => item.project_id === id);

    if (!project) {
      return {
        ok: false,
        error: {
          code: "PROJECT_NOT_FOUND",
          message: `Project not found: ${id || "(empty id)"}`,
        },
        state,
      };
    }

    const patch = isObject(updates) ? updates : {};
    if (Object.prototype.hasOwnProperty.call(patch, "display_name")) {
      project.display_name = safeDisplayName(patch.display_name);
    }
    if (isObject(patch.settings)) {
      project.settings = Object.assign({}, project.settings, patch.settings);
    }
    if (Object.prototype.hasOwnProperty.call(patch, "current_flow_context_id")) {
      project.current_flow_context_id = String(patch.current_flow_context_id || "").trim();
    }
    if (isObject(patch.flow_context)) {
      project.flow_context = clone(patch.flow_context);
    }
    if (Array.isArray(patch.assets)) {
      project.assets = patch.assets.filter(isObject).map(clone);
    }
    if (Array.isArray(patch.prompt_records)) {
      project.prompt_records = patch.prompt_records.filter(isObject).map(clone);
    }
    if (Array.isArray(patch.prompt_imports)) {
      project.prompt_imports = patch.prompt_imports.filter(isObject).map(clone);
    }
    if (Array.isArray(patch.image_generation_runs)) {
      project.image_generation_runs = patch.image_generation_runs.filter(isObject).map(clone);
    }
    if (Array.isArray(patch.image_variants)) {
      project.image_variants = patch.image_variants.filter(isObject).map(clone);
    }
    if (Array.isArray(patch.video_jobs)) {
      project.video_jobs = patch.video_jobs.filter(isObject).map(clone);
    }
    project.updated_at = nowIso();

    const savedState = await save(state);
    return { ok: true, project: clone(project), state: savedState };
  }

  async function setActiveProject(projectId) {
    const state = await load();
    const id = String(projectId || "").trim();
    const exists = state.projects.some((project) => project.project_id === id);

    if (!exists) {
      return {
        ok: false,
        error: {
          code: "PROJECT_NOT_FOUND",
          message: `Project not found: ${id || "(empty id)"}`,
        },
        state,
      };
    }

    state.active_project_id = id;
    const savedState = await save(state);
    return { ok: true, active_project_id: id, state: savedState };
  }

  root.TFProjectDomain = Object.freeze({
    STORAGE_KEY,
    SCHEMA_VERSION,
    createId,
    createProject,
    emptyState,
    load,
    normalizeState,
    save,
    setActiveProject,
    setStorageAdapter(adapter) {
      storageAdapter = adapter || null;
    },
    updateProject,
  });
})(globalThis);
