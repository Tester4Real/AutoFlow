// AutoFlow project-domain foundation.
// DOM-free classic script shared by extension pages and the MV3 service worker.
(function initTFProjectDomain(root) {
  "use strict";

  const STORAGE_KEY = "autoflowProjectStateV1";
  const SCHEMA_VERSION = 1;
  const DEFAULT_PROJECT_NAME = "Untitled Project";
  const ID_PREFIX = "project";
  const MUTATION_LOCK_NAME = `${STORAGE_KEY}:mutation`;

  let storageAdapter = null;
  let localMutationQueue = Promise.resolve();

  function nowIso() {
    return new Date().toISOString();
  }

  function isObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function repairTextEncoding(value) {
    let text = String(value == null ? "" : value);
    if (!/[\u00c2\u00c3\u00e2\u00f0\u00ef]/.test(text)) return text;

    const cp1252Bytes = {
      0x20ac: 0x80,
      0x201a: 0x82,
      0x0192: 0x83,
      0x201e: 0x84,
      0x2026: 0x85,
      0x2020: 0x86,
      0x2021: 0x87,
      0x02c6: 0x88,
      0x2030: 0x89,
      0x0160: 0x8a,
      0x2039: 0x8b,
      0x0152: 0x8c,
      0x017d: 0x8e,
      0x2018: 0x91,
      0x2019: 0x92,
      0x201c: 0x93,
      0x201d: 0x94,
      0x2022: 0x95,
      0x2013: 0x96,
      0x2014: 0x97,
      0x02dc: 0x98,
      0x2122: 0x99,
      0x0161: 0x9a,
      0x203a: 0x9b,
      0x0153: 0x9c,
      0x017e: 0x9e,
      0x0178: 0x9f,
    };

    function decodeSegment(segment) {
      const bytes = [];
      for (const character of segment) {
        const codePoint = character.codePointAt(0);
        if (codePoint <= 0xff) {
          bytes.push(codePoint);
        } else if (Object.prototype.hasOwnProperty.call(cp1252Bytes, codePoint)) {
          bytes.push(cp1252Bytes[codePoint]);
        } else {
          return segment;
        }
      }
      try {
        return new TextDecoder("utf-8", { fatal: true }).decode(
          new Uint8Array(bytes),
        );
      } catch (_error) {
        return segment;
      }
    }

    const encodedByte =
      "[\\u0080-\\u00ff\\u0152\\u0153\\u0160\\u0161\\u0178\\u017d\\u017e" +
      "\\u0192\\u02c6\\u02dc\\u2010-\\u203a\\u20ac\\u2122]";
    const sequencePattern = new RegExp(
      `\\u00f0${encodedByte}{3}|[\\u00e2\\u00ef]${encodedByte}{2}|[\\u00c2\\u00c3]${encodedByte}`,
      "g",
    );
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const decoded = text.replace(sequencePattern, decodeSegment);
      if (decoded === text) break;
      text = decoded;
    }
    return text;
  }

  function safeDisplayName(value) {
    const name = String(value || "").trim();
    return name || DEFAULT_PROJECT_NAME;
  }

  function nextDefaultProjectName(projects) {
    const list = Array.isArray(projects) ? projects : [];
    const usedNames = new Set(
      list.map((project) => safeDisplayName(project?.display_name).toLowerCase()),
    );
    let number = Math.max(1, list.length + 1);
    let candidate =
      number === 1 ? DEFAULT_PROJECT_NAME : `${DEFAULT_PROJECT_NAME} ${number}`;

    while (usedNames.has(candidate.toLowerCase())) {
      number += 1;
      candidate = `${DEFAULT_PROJECT_NAME} ${number}`;
    }

    return candidate;
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
        updated_at:
          typeof existingMeta.updated_at === "string" && existingMeta.updated_at
            ? existingMeta.updated_at
            : timestamp,
        warnings: previousWarnings.concat(warnings),
      }),
      active_project_id: activeProjectId || null,
      projects,
    });
  }

  function needsStateRepair(input) {
    if (
      !isObject(input) ||
      !Array.isArray(input.projects) ||
      Number(input.schema_version) !== SCHEMA_VERSION ||
      !isObject(input.meta)
    ) {
      return true;
    }

    const projectIds = new Set();
    for (const project of input.projects) {
      const projectId = isObject(project)
        ? String(project.project_id || project.projectId || "").trim()
        : "";
      if (!projectId || projectIds.has(projectId)) return true;
      projectIds.add(projectId);
    }

    const activeProjectId = String(
      input.active_project_id || input.activeProjectId || "",
    ).trim();
    return !!activeProjectId && !projectIds.has(activeProjectId);
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

  function withMutationLock(task) {
    const lockManager = root.navigator?.locks;
    if (lockManager && typeof lockManager.request === "function") {
      return lockManager.request(MUTATION_LOCK_NAME, () => task());
    }

    const result = localMutationQueue.then(task, task);
    localMutationQueue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
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

  async function saveUnlocked(state) {
    const normalized = normalizeState(state);
    normalized.meta.updated_at = nowIso();
    await storageSet({ [STORAGE_KEY]: normalized });
    return clone(normalized);
  }

  function save(state) {
    return withMutationLock(() => saveUnlocked(state));
  }

  async function readState() {
    const items = await storageGet(STORAGE_KEY);
    const raw = items[STORAGE_KEY];
    return { raw, state: normalizeState(raw) };
  }

  async function load() {
    const snapshot = await readState();
    if (!needsStateRepair(snapshot.raw)) {
      return clone(snapshot.state);
    }

    return withMutationLock(async () => {
      const latest = await readState();
      if (!needsStateRepair(latest.raw)) {
        return clone(latest.state);
      }
      return saveUnlocked(latest.state);
    });
  }

  function createProject(input = {}) {
    return withMutationLock(async () => {
      const { state } = await readState();
      const timestamp = nowIso();
      const source = isObject(input) ? input : {};
      const requestedName = String(
        source.display_name || source.displayName || source.name || "",
      ).trim();
      const project = normalizeProject(
        Object.assign({}, source, {
          project_id: createId(ID_PREFIX),
          display_name: requestedName
            ? safeDisplayName(requestedName)
            : nextDefaultProjectName(state.projects),
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

      const savedState = await saveUnlocked(state);
      return { ok: true, project: clone(project), state: savedState };
    });
  }

  function updateProject(projectId, updates) {
    return withMutationLock(async () => {
      const { state } = await readState();
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
        project.current_flow_context_id = String(
          patch.current_flow_context_id || "",
        ).trim();
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

      const savedState = await saveUnlocked(state);
      return { ok: true, project: clone(project), state: savedState };
    });
  }

  function appendPromptImport(projectId, promptRecords, importRecord) {
    return withMutationLock(async () => {
      const { state } = await readState();
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

      const records = Array.isArray(promptRecords)
        ? promptRecords.filter(isObject).map(clone)
        : [];
      if (!isObject(importRecord)) {
        return {
          ok: false,
          error: {
            code: "INVALID_PROMPT_IMPORT",
            message: "Prompt import record is required.",
          },
          state,
        };
      }

      const existingRecords = Array.isArray(project.prompt_records)
        ? project.prompt_records.filter(isObject)
        : [];
      const existingImports = Array.isArray(project.prompt_imports)
        ? project.prompt_imports.filter(isObject)
        : [];
      project.prompt_records = existingRecords.concat(records);
      project.prompt_imports = existingImports.concat(clone(importRecord));
      project.updated_at = nowIso();

      const savedState = await saveUnlocked(state);
      return { ok: true, project: clone(project), state: savedState };
    });
  }

  function setActiveProject(projectId) {
    return withMutationLock(async () => {
      const { state } = await readState();
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
      const savedState = await saveUnlocked(state);
      return { ok: true, active_project_id: id, state: savedState };
    });
  }

  root.TFProjectDomain = Object.freeze({
    STORAGE_KEY,
    SCHEMA_VERSION,
    appendPromptImport,
    createId,
    createProject,
    emptyState,
    load,
    normalizeState,
    repairTextEncoding,
    save,
    setActiveProject,
    setStorageAdapter(adapter) {
      storageAdapter = adapter || null;
      localMutationQueue = Promise.resolve();
    },
    updateProject,
  });
})(globalThis);
