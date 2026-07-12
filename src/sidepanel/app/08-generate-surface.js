// TurboFlow side panel shard: Minimal JSON-first Generate surface.
// Loaded after legacy runner shards so it can reuse the existing queue path.

(function initGenerateSurface(root) {
  "use strict";

  const state = {
    fileName: "",
    importResult: null,
    activeProject: null,
    loadingProject: false,
    importing: false,
  };
  let studioGenerationWrite = Promise.resolve();

  function q(selector) {
    return typeof r === "function"
      ? r(selector)
      : root.document.querySelector(selector);
  }

  function qa(selector) {
    return Array.from(root.document.querySelectorAll(selector));
  }

  function activeProjectFromDomainState(domainState) {
    const projects = Array.isArray(domainState?.projects) ? domainState.projects : [];
    if (!projects.length) return null;
    return (
      projects.find((project) => project.project_id === domainState.active_project_id) ||
      projects[0]
    );
  }

  function projectName(project) {
    return project?.display_name || project?.name || "Project";
  }

  async function refreshActiveProject() {
    state.loadingProject = true;
    try {
      const domain = root.TFProjectDomain;
      if (!domain || typeof domain.load !== "function") {
        state.activeProject = null;
        return null;
      }
      const domainState = await domain.load();
      state.activeProject = activeProjectFromDomainState(domainState);
      return state.activeProject;
    } catch (error) {
      state.activeProject = null;
      return null;
    } finally {
      state.loadingProject = false;
      render();
    }
  }

  function currentRecords() {
    if (Array.isArray(state.importResult?.records)) return state.importResult.records;
    return Array.isArray(state.activeProject?.prompt_records)
      ? state.activeProject.prompt_records
      : [];
  }

  function isReady(record) {
    return record?.status === "ready" && !1 !== record?.can_generate_images;
  }

  function isBlocked(record) {
    return (
      record?.status === "blocked" ||
      record?.status === "needs_resolution" ||
      !1 === record?.can_generate_images
    );
  }

  function statsFor(records) {
    const total = records.length,
      ready = records.filter(isReady).length,
      blocked = records.filter(isBlocked).length,
      animation = records.filter((record) =>
        String(record?.animation_prompt || "").trim(),
      ).length;
    return { total, ready, blocked, animation };
  }

  function readyRecords() {
    return currentRecords().filter(isReady);
  }

  function projectAssets(project) {
    return Array.isArray(project?.assets) ? project.assets : [];
  }

  function primaryAssetFile(asset) {
    const files = Array.isArray(asset?.files) ? asset.files : [];
    return (
      files.find((file) => file.asset_file_id === asset?.primary_file_id) ||
      files.find((file) => file.is_primary || file.role === "primary") ||
      files[0] ||
      null
    );
  }

  function promptAssetIds(record) {
    return Array.from(
      new Set(
        (Array.isArray(record?.references) ? record.references : [])
          .filter((reference) => reference?.resolution_status === "resolved")
          .map((reference) => String(reference?.asset_id || "").trim())
          .filter(Boolean),
      ),
    );
  }

  function dataUrlBase64(dataUrl) {
    const value = String(dataUrl || "");
    const commaIndex = value.indexOf(",");
    return commaIndex >= 0 ? value.slice(commaIndex + 1) : value;
  }

  async function ensureProjectReferencesForBatch(batch) {
    const settings = batch?.settings || {};
    const assetMap = settings.perPromptAssetIds || {};
    const assetIds = Array.from(
      new Set(Object.values(assetMap).flat().map((value) => String(value || "").trim())),
    ).filter(Boolean);
    if (!assetIds.length || settings.mode !== "image") return true;
    if (typeof Oe === "function" && !(await Oe())) return false;

    const domain = root.TFProjectDomain;
    const domainState = await domain?.load?.();
    const projectId = String(settings.projectId || state.activeProject?.project_id || "");
    const project = domainState?.projects?.find((item) => item.project_id === projectId);
    if (!project) throw new Error("The YouTube Channel for this batch no longer exists.");

    const flowProjectId =
      typeof tfCurrentFlowProjectId === "function" ? await tfCurrentFlowProjectId() : "";
    const assets = projectAssets(project).map((asset) => Object.assign({}, asset));
    const mediaByAssetId = new Map();

    for (const assetId of assetIds) {
      const assetIndex = assets.findIndex((asset) => asset.asset_id === assetId);
      const asset = assetIndex >= 0 ? assets[assetIndex] : null;
      const file = primaryAssetFile(asset);
      if (!asset || !file?.data_url) {
        throw new Error(`Reference ${asset?.display_name || assetId} has no stored image file.`);
      }

      let mediaId =
        asset.flow_upload_state === "ready" &&
        asset.flow_project_id === flowProjectId &&
        asset.flow_asset_file_id === file.asset_file_id
          ? String(asset.flow_media_id || "")
          : "";
      if (!mediaId) {
        Te(`Uploading reference "${asset.display_name || file.file_name}"...`, "info");
        const response = await chrome.runtime.sendMessage({
          type: "UPLOAD_IMAGE",
          base64Data: dataUrlBase64(file.data_url),
          fileName: file.file_name || `${asset.display_name || "reference"}.png`,
          mimeType: file.mime_type || "image/png",
        });
        if (!response?.ok || !response?.mediaId) {
          throw new Error(response?.error || `Could not upload ${asset.display_name || assetId}.`);
        }
        mediaId = response.mediaId;
        assets[assetIndex] = Object.assign({}, asset, {
          flow_upload_state: "ready",
          flow_project_id: flowProjectId,
          flow_media_id: mediaId,
          flow_asset_file_id: file.asset_file_id,
          flow_uploaded_at: new Date().toISOString(),
        });
      }
      mediaByAssetId.set(assetId, { mediaId });
    }

    const perPromptReferences = {};
    const perPromptThumbnails = {};
    Object.keys(assetMap).forEach((promptIndex) => {
      const mediaIds = (assetMap[promptIndex] || [])
        .map((assetId) => mediaByAssetId.get(assetId)?.mediaId)
        .filter(Boolean);
      if (mediaIds.length) perPromptReferences[promptIndex] = mediaIds;
    });
    settings.referenceMode = "mapped";
    settings.perPromptReferences = perPromptReferences;
    settings.perPromptThumbnails = perPromptThumbnails;
    settings.imageReferenceMediaIds = [];
    const persisted = await domain.updateProject(projectId, { assets });
    if (persisted?.ok && state.activeProject?.project_id === projectId) {
      state.activeProject = persisted.project;
    }
    X();
    Sn();
    Te(`${assetIds.length} reference${assetIds.length === 1 ? "" : "s"} attached`, "success");
    return true;
  }

  async function registerStudioImageRun(batch, records, projectInput) {
    const domain = root.TFProjectDomain;
    const project = projectInput || state.activeProject;
    if (!domain?.updateProject || !project) return;
    const timestamp = new Date().toISOString();
    const requestItems = records.map((record, index) => ({
      prompt_id: record.prompt_id,
      source_index: index,
      file_name: record.file_name,
      image_prompt: record.image_prompt,
      references: Array.isArray(record.references) ? record.references : [],
    }));
    const runs = Array.isArray(project.image_generation_runs)
      ? project.image_generation_runs.slice()
      : [];
    if (!runs.some((run) => run.image_run_id === batch.id)) {
      runs.push({
        image_run_id: batch.id,
        status: "queued",
        image_count: Number(batch.settings.imageCount || 2),
        prompt_count: records.length,
        excluded_prompt_count: 0,
        request_items: requestItems,
        created_at: timestamp,
        updated_at: timestamp,
      });
    }
    const persisted = await domain.updateProject(project.project_id, {
      image_generation_runs: runs,
    });
    if (persisted?.ok && state.activeProject?.project_id === project.project_id) {
      state.activeProject = persisted.project;
    }
  }

  async function prepareStudioImageBatch(batch) {
    if (!batch || batch.settings?.mode !== "image") return;
    const domain = root.TFProjectDomain;
    const projectId = String(batch.settings?.projectId || "");
    if (!domain?.load || !projectId) return;
    const domainState = await domain.load();
    const project = domainState.projects?.find((item) => item.project_id === projectId);
    if (!project) return;
    const recordsById = new Map(
      (Array.isArray(project.prompt_records) ? project.prompt_records : []).map((record) => [
        record.prompt_id,
        record,
      ]),
    );
    const records = Object.keys(batch.settings?.perPromptIds || {})
      .sort((left, right) => Number(left) - Number(right))
      .map((index) => recordsById.get(batch.settings.perPromptIds[index]))
      .filter(Boolean);
    if (!records.length) return;
    await registerStudioImageRun(batch, records, project);
  }

  async function applyStudioGenerationMessage(message, batch) {
    if (!batch || batch.settings?.mode !== "image") return;
    const domain = root.TFProjectDomain;
    const projectId = String(batch.settings?.projectId || "");
    if (!domain?.load || !projectId) return;
    const domainState = await domain.load();
    const project = domainState.projects?.find((item) => item.project_id === projectId);
    if (!project) return;
    const timestamp = new Date().toISOString();
    const runs = Array.isArray(project.image_generation_runs)
      ? project.image_generation_runs.slice()
      : [];

    if (message.subType === "PREVIEW_READY" && message.mediaType !== "video") {
      const promptIndex = Number(message.promptIndex || 0);
      const promptId = String(batch.settings?.perPromptIds?.[promptIndex] || "");
      if (!promptId || !message.mediaId) return;
      const variants = Array.isArray(project.image_variants) ? project.image_variants.slice() : [];
      const existingIndex = variants.findIndex(
        (variant) =>
          variant.image_run_id === batch.id && variant.media_id === message.mediaId,
      );
      const promptVariants = variants.filter(
        (variant) => variant.image_run_id === batch.id && variant.prompt_id === promptId,
      );
      const variantIndex =
        existingIndex >= 0
          ? Number(variants[existingIndex].variant_index || 0)
          : promptVariants.reduce(
              (highest, variant) => Math.max(highest, Number(variant.variant_index || 0)),
              -1,
            ) + 1;
      const promptRecord = (project.prompt_records || []).find(
        (record) => record.prompt_id === promptId,
      );
      const variant = Object.assign(existingIndex >= 0 ? variants[existingIndex] : {}, {
        variant_id:
          existingIndex >= 0
            ? variants[existingIndex].variant_id
            : domain.createId("image_variant"),
        project_id: projectId,
        prompt_id: promptId,
        image_run_id: batch.id,
        source_index: promptIndex,
        variant_index: variantIndex,
        variant_number: variantIndex + 1,
        expected_file_name: promptRecord?.file_name || message.fileName || "image.png",
        generated_file_name: message.fileName || promptRecord?.file_name || "image.png",
        media_id: message.mediaId,
        thumbnail_url: message.fifeUrl || "",
        fife_url: message.fifeUrl || "",
        file_state: "remote",
        repair_state: "",
        status: "available",
        created_at: existingIndex >= 0 ? variants[existingIndex].created_at : timestamp,
        updated_at: timestamp,
      });
      if (existingIndex >= 0) variants[existingIndex] = variant;
      else variants.push(variant);

      const nextRuns = runs.map((run) =>
        run.image_run_id === batch.id
          ? Object.assign({}, run, {
              status: "generating",
              variant_count: variants.filter((item) => item.image_run_id === batch.id).length,
              updated_at: timestamp,
            })
          : run,
      );
      const promptRecords = (project.prompt_records || []).map((record) =>
        record.prompt_id === promptId
          ? Object.assign({}, record, {
              active_image_run_id: batch.id,
              image_generation_state: "generated",
              image_generation_completed_at: timestamp,
              updated_at: timestamp,
            })
          : record,
      );
      await domain.updateProject(projectId, {
        image_variants: variants,
        image_generation_runs: nextRuns,
        prompt_records: promptRecords,
      });
      return;
    }

    if (message.subType === "BATCH_GENERATION_DONE") {
      const status = message.failedPrompts
        ? message.successfulPrompts
          ? "partial"
          : "failed"
        : "completed";
      await domain.updateProject(projectId, {
        image_generation_runs: runs.map((run) =>
          run.image_run_id === batch.id
            ? Object.assign({}, run, {
                status,
                completed_at: timestamp,
                updated_at: timestamp,
              })
            : run,
        ),
      });
    }
  }

  function handleStudioGenerationMessage(message, batch) {
    studioGenerationWrite = studioGenerationWrite
      .then(() => applyStudioGenerationMessage(message, batch))
      .catch((error) => Te(`Studio preview sync failed: ${error.message}`, "warn"));
    return studioGenerationWrite;
  }

  function readLocalStorage(keys) {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get(keys, (result) => {
          if (chrome.runtime.lastError) resolve({});
          else resolve(result || {});
        });
      } catch (_error) {
        resolve({});
      }
    });
  }

  async function restoreStoredGalleryPreviews() {
    const domain = root.TFProjectDomain;
    if (!domain?.load) return 0;
    const stored = await readLocalStorage(["flowAutoBatches", "turboflowGallery"]);
    const batches = Array.isArray(stored.flowAutoBatches) ? stored.flowAutoBatches : [];
    const gallery = Array.isArray(stored.turboflowGallery) ? stored.turboflowGallery : [];
    if (!batches.length || !gallery.length) return 0;

    const domainState = await domain.load();
    let restored = 0;
    const processedMediaIds = new Set();
    for (const item of gallery) {
      if (!item?.mediaId || item.type === "video" || item.isPlaceholder || !item.batchId) {
        continue;
      }
      const batch = batches.find((candidate) => candidate.id === item.batchId);
      if (!batch || batch.settings?.mode !== "image") continue;
      const projectName = String(
        item.projectName || batch.projectName || batch.settings?.projectName || "",
      )
        .trim()
        .toLowerCase();
      const projectId = String(batch.settings?.projectId || "");
      const nameMatches = (domainState.projects || []).filter(
        (candidate) =>
          projectName &&
          String(candidate.display_name || candidate.name || "")
            .trim()
            .toLowerCase() === projectName,
      );
      const project =
        domainState.projects?.find((candidate) => candidate.project_id === projectId) ||
        (nameMatches.length === 1 ? nameMatches[0] : null);
      if (!project) continue;
      if (
        (project.image_variants || []).some(
          (variant) => variant.media_id === item.mediaId,
        )
      ) {
        continue;
      }
      if (processedMediaIds.has(item.mediaId)) continue;
      processedMediaIds.add(item.mediaId);
      const promptIndex = Number(item.originalIndex ?? item.promptIndex ?? 0);
      if (!Number.isInteger(promptIndex) || promptIndex < 0) continue;
      const promptId =
        batch.settings?.perPromptIds?.[promptIndex] ||
        project.prompt_records?.[promptIndex]?.prompt_id ||
        "";
      if (!promptId) continue;
      const compatibleBatch = Object.assign({}, batch, {
        settings: Object.assign({}, batch.settings, {
          projectId: project.project_id,
          perPromptIds: Object.assign({}, batch.settings?.perPromptIds, {
            [promptIndex]: promptId,
          }),
        }),
      });
      await applyStudioGenerationMessage(
        {
          subType: "PREVIEW_READY",
          mediaType: "image",
          mediaId: item.mediaId,
          fifeUrl: item.fifeUrl || "",
          promptIndex,
          fileName: item.fileName || "",
        },
        compatibleBatch,
      );
      restored += 1;
    }
    if (restored) Te(`Restored ${restored} image preview${restored === 1 ? "" : "s"} in Studio`, "success");
    return restored;
  }

  function setDisplay(selector, show) {
    const element = q(selector);
    element && (element.style.display = show ? "" : "none");
  }

  function setText(selector, text) {
    const element = q(selector);
    element && (element.textContent = text);
  }

  function syncControls() {
    const model = q("#generate-image-model"),
      hiddenModel = q("#setting-image-model"),
      ratio = q("#ratio-select"),
      value = q("#variants-value"),
      count = Math.min(4, Math.max(1, Number(l.settings.imageCount || 2)));
    l.settings.imageCount = count;
    model && (model.value = l.settings.imageModel || "NARWHAL");
    hiddenModel && (hiddenModel.value = l.settings.imageModel || "NARWHAL");
    ratio &&
      (ratio.value =
        l.settings.imageRatio || "IMAGE_ASPECT_RATIO_LANDSCAPE");
    value && (value.textContent = String(count));
  }

  function setActionsDisabled(disabled) {
    ["#btn-import-json-generate", "#btn-replace-json", "#btn-add-to-queue", "#btn-generate"].forEach(
      (selector) => {
        const element = q(selector);
        element && (element.disabled = disabled);
      },
    );
    ["#generate-image-model", "#ratio-select", "#variants-minus", "#variants-plus"].forEach(
      (selector) => {
        const element = q(selector);
        element && (element.disabled = disabled);
      },
    );
  }

  function render() {
    syncControls();
    const records = currentRecords(),
      stats = statsFor(records),
      hasProject = !!state.activeProject,
      hasRecords = stats.total > 0,
      running = "function" == typeof nr && nr(),
      importDisabled = !hasProject || state.importing || running;

    q("#generate-json-entry")?.setAttribute(
      "aria-disabled",
      importDisabled ? "true" : "false",
    );
    setText(
      "#generate-json-entry-status",
      hasProject
        ? state.importing
          ? "Importing..."
          : hasRecords
            ? "Import another JSON when ready."
            : "Ready for JSON import."
        : "Create or select a Project.",
    );

    setDisplay("#generate-json-entry", !hasRecords);
    setDisplay("#generate-json-summary", hasRecords);
    setDisplay("#generate-form", hasRecords && stats.ready > 0);
    setDisplay("#generate-actions", hasRecords);
    setDisplay("#generate-blocked-row", stats.blocked > 0);

    setText("#generate-json-name", state.fileName || projectName(state.activeProject));
    setText(
      "#generate-json-meta",
      `${stats.total} prompt${stats.total === 1 ? "" : "s"}`,
    );
    const statsEl = q("#generate-json-stats");
    if (statsEl) {
      statsEl.innerHTML = [
        `<span class="json-stat ready">${stats.ready} ready</span>`,
        `<span class="json-stat blocked">${stats.blocked} blocked</span>`,
        `<span class="json-stat animation">${stats.animation} animations</span>`,
      ].join("");
    }
    setText(
      "#generate-blocked-text",
      `${stats.blocked} prompt${stats.blocked === 1 ? "" : "s"} need Studio`,
    );

    const addButton = q("#btn-add-to-queue"),
      generateButton = q("#btn-generate");
    if (addButton)
      addButton.innerHTML = `<span class="material-symbols-outlined">playlist_add</span>${stats.ready > 0 ? `Add ${stats.ready} to Queue` : "Add to Queue"}`;
    if (generateButton)
      generateButton.innerHTML = `<span class="material-symbols-outlined">play_arrow</span>${stats.ready > 0 ? `Generate ${stats.ready}` : "Generate"}`;
    const actionDisabled = !hasProject || stats.ready < 1 || state.importing || running;
    addButton && (addButton.disabled = actionDisabled);
    generateButton && (generateButton.disabled = actionDisabled);
    q("#btn-import-json-generate") &&
      (q("#btn-import-json-generate").disabled = importDisabled);
    q("#btn-replace-json") && (q("#btn-replace-json").disabled = importDisabled);
  }

  function importJson() {
    q("#json-file-input")?.click();
  }

  async function handleJsonFile(content, fileName) {
    state.importing = true;
    render();
    try {
      const result = await tfImportPromptIndexJson(content, fileName, {
        createLegacyBatches: false,
      });
      state.fileName = fileName || "prompt-index.json";
      state.importResult = result;
      await refreshActiveProject();
      root.TFProjectSidePanelSelector?.refresh?.("prompt-import");
      const stats = statsFor(result.records || []);
      Te(
        `Imported ${stats.total} prompt${stats.total === 1 ? "" : "s"}; ${stats.ready} ready${stats.blocked ? `, ${stats.blocked} blocked` : ""}`,
        stats.ready ? "success" : "warn",
      );
      return result;
    } finally {
      state.importing = false;
      render();
    }
  }

  function queueFolderName() {
    return tfSafeFolderName(projectName(state.activeProject), "turboflow");
  }

  async function createBatchFromReady() {
    const records = readyRecords();
    if (!records.length) return null;
    const batchName = state.fileName
        ? tfBatchNameFromFile(state.fileName)
        : projectName(state.activeProject),
      projectFolder = queueFolderName(),
      firstFile = tfCleanDownloadPath(records[0]?.file_name || "media/item.png", "png"),
      mediaFolder = tfFolderFromPath(firstFile),
      perPromptFileNames = {};

    records.forEach((record, index) => {
      perPromptFileNames[index] = tfPrefixDownloadPath(
        tfCleanDownloadPath(record.file_name, "png"),
        projectFolder,
      );
    });

    const perPromptAssetIds = {};
    const perPromptIds = {};
    records.forEach((record, index) => {
      const assetIds = promptAssetIds(record);
      if (assetIds.length) perPromptAssetIds[index] = assetIds;
      perPromptIds[index] = record.prompt_id;
    });
    const hasReferences = Object.keys(perPromptAssetIds).length > 0;
    const batch = tfCreatePromptIndexBatch({
      name: `${projectName(state.activeProject)} - images`,
      folder: `${projectFolder}/${mediaFolder}`,
      prompts: records.map((record) => ({ text: record.image_prompt })),
      projectName: projectName(state.activeProject),
      projectFolder,
      batchKind: "images",
      settings: {
        mode: "image",
        imageModel: l.settings.imageModel,
        imageRatio: l.settings.imageRatio || "IMAGE_ASPECT_RATIO_LANDSCAPE",
        imageCount: l.settings.imageCount || 2,
        imageReferenceMediaIds: [],
        requiresJackReference: !1,
        projectId: state.activeProject.project_id,
        perPromptIds,
        perPromptAssetIds,
        perPromptReferences: null,
        perPromptThumbnails: {},
        naming: "numbered",
        namingPrefix: "",
        namingSeparator: "-",
        startNumber: 1,
        perPromptFileNames,
        referenceMode: hasReferences ? "mapped" : "shared",
        projectName: projectName(state.activeProject),
        projectFolder,
        batchKind: "images",
        sourceImportName: batchName,
      },
    });
    X();
    Sn();
    return batch;
  }

  function activateQueueTab() {
    qa(".tab").forEach((element) => element.classList.remove("active"));
    qa(".tab-content").forEach((element) => element.classList.remove("active"));
    q('[data-tab="queue"]')?.classList.add("active");
    q("#tab-queue")?.classList.add("active");
  }

  async function addToQueue() {
    if (!readyRecords().length) return;
    const batch = await createBatchFromReady();
    if (!batch) return;
    Te(`Queued ${batch.prompts.length} ready prompt${batch.prompts.length === 1 ? "" : "s"}`, "success");
    activateQueueTab();
  }

  async function generateNow() {
    if (!readyRecords().length) return;
    if ("function" == typeof Oe && !(await Oe())) return;
    const batch = await createBatchFromReady();
    if (!batch) return;
    await Pn("run-batch", batch.id);
    render();
  }

  function changeVariants(delta) {
    const next = Math.min(4, Math.max(1, Number(l.settings.imageCount || 2) + delta));
    l.settings.imageCount = next;
    J();
    render();
  }

  function attach() {
    q("#btn-import-json-generate")?.addEventListener("click", importJson);
    q("#btn-replace-json")?.addEventListener("click", importJson);
    q("#btn-open-studio-blocked")?.addEventListener("click", () => {
      q("#btn-open-project-studio")?.click();
    });
    q("#btn-add-to-queue")?.addEventListener("click", addToQueue);
    q("#btn-generate")?.addEventListener("click", generateNow);
    q("#generate-image-model")?.addEventListener("change", (event) => {
      l.settings.imageModel = event.target.value;
      const hidden = q("#setting-image-model");
      hidden && (hidden.value = event.target.value);
      J();
      render();
    });
    q("#ratio-select")?.addEventListener("change", (event) => {
      l.settings.imageRatio = event.target.value;
      J();
      render();
    });
    q("#variants-minus")?.addEventListener("click", () => changeVariants(-1));
    q("#variants-plus")?.addEventListener("click", () => changeVariants(1));
    root.addEventListener("TF_PROJECT_CHANGED", (event) => {
      const nextProject = event.detail?.activeProject || null,
        previousId = state.activeProject?.project_id || "",
        nextId = nextProject?.project_id || "";
      state.activeProject = nextProject;
      if (previousId !== nextId) {
        state.importResult = null;
        state.fileName = "";
      }
      render();
    });
    refreshActiveProject().then(restoreStoredGalleryPreviews);
    render();
  }

  root.tfHandleGenerateJsonFile = handleJsonFile;
  root.tfRefreshGenerateSurface = render;
  root.tfEnsureProjectReferencesForBatch = ensureProjectReferencesForBatch;
  root.tfPrepareStudioImageBatch = prepareStudioImageBatch;
  root.tfHandleStudioGenerationMessage = handleStudioGenerationMessage;
  root.tfRestoreStoredGalleryPreviews = restoreStoredGalleryPreviews;

  if (root.document.readyState === "loading") {
    root.document.addEventListener("DOMContentLoaded", attach, { once: true });
  } else {
    attach();
  }
})(globalThis);
