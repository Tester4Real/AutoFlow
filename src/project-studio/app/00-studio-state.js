// AutoFlow Project Studio shard: state helpers backed by TFProjectDomain.
// Loaded by src/project-studio/index.html before shell rendering.
(function initTFProjectStudioState(root) {
  "use strict";

  const VIEWS = [
    {
      id: "project",
      label: "Project",
      icon: "tune",
      title: "Project Settings",
      subtitle: "Identity and storage metadata",
    },
    {
      id: "assets",
      label: "Assets",
      icon: "folder_managed",
      title: "Assets",
      subtitle: "Characters, places, and reference files",
    },
    {
      id: "import",
      label: "Import / Resolve",
      icon: "rule_folder",
      title: "Import / Resolve",
      subtitle: "Prompt JSON and blocked prompt checks",
    },
    {
      id: "images",
      label: "Image Review",
      icon: "photo_library",
      title: "Image Review",
      subtitle: "Generated variants and selected finals",
    },
    {
      id: "video",
      label: "Video Queue",
      icon: "queue_play_next",
      title: "Video Queue",
      subtitle: "Queued video jobs and reference readiness",
    },
    {
      id: "gallery",
      label: "Gallery",
      icon: "download_done",
      title: "Gallery",
      subtitle: "Outputs and downloads",
    },
  ];

  const ASSET_TYPES = Object.freeze([
    { id: "character", label: "Character", icon: "person" },
    { id: "place", label: "Place", icon: "location_on" },
    { id: "prop", label: "Prop", icon: "category" },
    { id: "style", label: "Style", icon: "palette" },
    { id: "reference", label: "Reference", icon: "image" },
  ]);

  const studioState = {
    activeProject: null,
    assetFilter: "all",
    activeView: (() => {
      const hash = String(root.location?.hash || "").replace(/^#/, "");
      let viewId = "";
      try {
        viewId = decodeURIComponent(hash);
      } catch (error) {
        viewId = hash;
      }
      return VIEWS.some((view) => view.id === viewId) ? viewId : "project";
    })(),
    domainState: null,
    isLoading: false,
    lastError: null,
  };

  function $(selector) {
    return root.document.querySelector(selector);
  }

  function $all(selector) {
    return Array.prototype.slice.call(root.document.querySelectorAll(selector));
  }

  function isObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function getDomain() {
    return root.TFProjectDomain || null;
  }

  function getViewDefinition(viewId) {
    return VIEWS.find((view) => view.id === viewId) || VIEWS[0];
  }

  function getAssetTypeDefinition(type) {
    return ASSET_TYPES.find((item) => item.id === type) || ASSET_TYPES[4];
  }

  function resolveActiveProject(domainState) {
    const projects = Array.isArray(domainState?.projects) ? domainState.projects : [];
    if (!projects.length) return null;
    return (
      projects.find((project) => project.project_id === domainState.active_project_id) ||
      projects[0]
    );
  }

  function countCollection(value) {
    if (Array.isArray(value)) return value.length;
    if (!isObject(value)) return 0;
    return Object.keys(value).reduce((total, key) => {
      const nested = value[key];
      if (Array.isArray(nested)) return total + nested.length;
      if (isObject(nested)) return total + Object.keys(nested).length;
      return total + 1;
    }, 0);
  }

  function countProjectItems(project, keys) {
    if (!isObject(project)) return 0;
    return keys.reduce((total, key) => total + countCollection(project[key]), 0);
  }

  function getProjectAssets(project) {
    return Array.isArray(project?.assets) ? project.assets.filter(isObject) : [];
  }

  function getFilteredAssets() {
    const filter = studioState.assetFilter;
    const assets = getProjectAssets(studioState.activeProject);
    if (!filter || filter === "all") return assets;
    return assets.filter((asset) => asset.type === filter);
  }

  function safeAssetType(type) {
    const id = String(type || "").trim().toLowerCase();
    return ASSET_TYPES.some((item) => item.id === id) ? id : "reference";
  }

  function safeAssetName(value) {
    const name = String(value || "").trim();
    return name || "Untitled Asset";
  }

  function parseAliases(value) {
    if (Array.isArray(value)) {
      return value.map((item) => String(item || "").trim()).filter(Boolean);
    }
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function createAssetId() {
    const domain = getDomain();
    if (domain && typeof domain.createId === "function") {
      return domain.createId("asset");
    }
    return `asset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function createAssetFileId() {
    const domain = getDomain();
    if (domain && typeof domain.createId === "function") {
      return domain.createId("asset_file");
    }
    return `asset_file_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result || ""));
      reader.addEventListener("error", () => reject(reader.error || new Error("File read failed.")));
      reader.readAsDataURL(file);
    });
  }

  function readTextFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(String(reader.result || "")));
      reader.addEventListener("error", () => reject(reader.error || new Error("File read failed.")));
      reader.readAsText(file);
    });
  }

  function getProjectPromptRecords(project) {
    return Array.isArray(project?.prompt_records)
      ? project.prompt_records.filter(isObject)
      : [];
  }

  function getProjectPromptImports(project) {
    return Array.isArray(project?.prompt_imports)
      ? project.prompt_imports.filter(isObject)
      : [];
  }

  function createPromptId() {
    const domain = getDomain();
    if (domain && typeof domain.createId === "function") {
      return domain.createId("prompt");
    }
    return `prompt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function createPromptImportId() {
    const domain = getDomain();
    if (domain && typeof domain.createId === "function") {
      return domain.createId("prompt_import");
    }
    return `prompt_import_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  function createImageRunId() {
    const domain = getDomain();
    if (domain && typeof domain.createId === "function") {
      return domain.createId("image_run");
    }
    return `image_run_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  function createVariantId() {
    const domain = getDomain();
    if (domain && typeof domain.createId === "function") {
      return domain.createId("variant");
    }
    return `variant_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  function createVideoJobId() {
    const domain = getDomain();
    if (domain && typeof domain.createId === "function") {
      return domain.createId("video_job");
    }
    return `video_job_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }

  function getContract() {
    return root.TFProjectJsonContract || null;
  }

  function getRawReferenceNames(record) {
    const contract = getContract();
    const fields = contract?.ACCEPTED_REFERENCE_FIELDS || [
      "references",
      "refs",
      "reference_names",
      "referenceNames",
    ];
    const rawRecord = isObject(record?.raw) ? record.raw : {};
    const field = fields.find((key) => Object.prototype.hasOwnProperty.call(rawRecord, key));
    const rawValue = field ? rawRecord[field] : [];
    const rawItems = Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : [];
    const names = rawItems
      .map((reference) => {
        if (typeof reference === "string") return reference.trim();
        if (!isObject(reference)) return "";
        return String(reference.name || reference.alias || reference.ref || "").trim();
      })
      .filter(Boolean);

    if (names.length) return names;
    return Array.isArray(record?.references)
      ? record.references.map((reference) => String(reference.name || "").trim()).filter(Boolean)
      : [];
  }

  function normalizeLookupValue(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function getLookupValues(value) {
    const clean = String(value || "").trim().toLowerCase();
    const slug = normalizeLookupValue(value);
    return [clean, slug].filter(Boolean);
  }

  function getAssetLookupValues(asset) {
    const values = getLookupValues(asset?.display_name || asset?.displayName || asset?.name);
    if (Array.isArray(asset?.aliases)) {
      asset.aliases.forEach((alias) => {
        getLookupValues(alias).forEach((value) => values.push(value));
      });
    }
    return Array.from(new Set(values));
  }

  function isAssetActive(asset) {
    return isObject(asset) && !asset.disabled && asset.lifecycle_status !== "disabled";
  }

  function getAssetById(assets, assetId) {
    const id = String(assetId || "").trim();
    if (!id) return null;
    return assets.find((asset) => asset.asset_id === id) || null;
  }

  function findReferenceCandidates(reference, assets) {
    const name = String(reference?.name || "").trim();
    const lookupValues = getLookupValues(name);
    const expectedType = String(reference?.type || "").trim().toLowerCase();

    if (!lookupValues.length) return [];

    return assets.filter((asset) => {
      if (!isAssetActive(asset)) return false;
      if (expectedType && asset.type !== expectedType) return false;
      const assetValues = getAssetLookupValues(asset);
      return lookupValues.some((lookup) => assetValues.indexOf(lookup) >= 0);
    });
  }

  function resolvePromptReference(reference, assets) {
    const source = isObject(reference) ? reference : {};
    const name = String(source.name || "").trim();
    const required = source.required !== false;
    const base = {
      name,
      type: String(source.type || "").trim().toLowerCase(),
      required,
    };
    const manualAssetId = String(
      source.manual_asset_id || (source.resolution_source === "manual" ? source.asset_id : ""),
    ).trim();

    if (manualAssetId) {
      const manualAsset = getAssetById(assets, manualAssetId);
      const active = isAssetActive(manualAsset);
      const typeMatches = !base.type || manualAsset?.type === base.type;

      if (manualAsset && active && typeMatches) {
        return Object.assign({}, base, {
          manual_asset_id: manualAsset.asset_id,
          asset_id: manualAsset.asset_id,
          asset_type: manualAsset.type || "",
          asset_name: safeAssetName(
            manualAsset.display_name || manualAsset.displayName || manualAsset.name,
          ),
          resolution_status: "resolved",
          resolution_source: "manual",
        });
      }

      return Object.assign({}, base, {
        manual_asset_id: manualAssetId,
        candidate_asset_ids: [],
        resolution_status: "missing",
        resolution_source: "manual",
        resolution_error: manualAsset
          ? active
            ? "type_mismatch"
            : "asset_disabled"
          : "asset_not_found",
      });
    }

    const candidates = findReferenceCandidates(source, assets);

    if (candidates.length === 1) {
      const asset = candidates[0];
      return Object.assign({}, base, {
        asset_id: asset.asset_id,
        asset_type: asset.type || "",
        asset_name: safeAssetName(asset.display_name || asset.displayName || asset.name),
        resolution_status: "resolved",
        resolution_source: "auto",
      });
    }

    if (candidates.length > 1) {
      return Object.assign({}, base, {
        candidate_asset_ids: candidates.map((asset) => asset.asset_id).filter(Boolean),
        resolution_status: "ambiguous",
      });
    }

    return Object.assign({}, base, {
      candidate_asset_ids: [],
      resolution_status: "missing",
    });
  }

  function getBlockedReferences(references) {
    return references.reduce((blocked, reference, referenceIndex) => {
      if (
        reference.required === false ||
        (reference.resolution_status !== "missing" &&
          reference.resolution_status !== "ambiguous")
      ) {
        return blocked;
      }

      blocked.push({
        name: reference.name || "",
        type: reference.type || "",
        reference_index: referenceIndex,
        reason: reference.resolution_error || reference.resolution_status,
        candidate_asset_ids: Array.isArray(reference.candidate_asset_ids)
          ? reference.candidate_asset_ids.slice()
          : [],
      });
      return blocked;
    }, []);
  }

  function getPromptResolutionSignature(record) {
    const references = Array.isArray(record?.references) ? record.references : [];
    const blockedReferences = Array.isArray(record?.blocked_references)
      ? record.blocked_references
      : [];
    return JSON.stringify({
      status: record?.status || "",
      can_generate_images: record?.can_generate_images !== false,
      references: references.map((reference) => {
        return {
          name: reference?.name || "",
          type: reference?.type || "",
          required: reference?.required !== false,
          manual_asset_id: reference?.manual_asset_id || "",
          asset_id: reference?.asset_id || "",
          resolution_status: reference?.resolution_status || "",
          resolution_source: reference?.resolution_source || "",
          resolution_error: reference?.resolution_error || "",
        };
      }),
      blocked_references: blockedReferences.map((reference) => {
        return {
          name: reference?.name || "",
          type: reference?.type || "",
          reference_index: reference?.reference_index,
          reason: reference?.reason || "",
          candidate_asset_ids: Array.isArray(reference?.candidate_asset_ids)
            ? reference.candidate_asset_ids.slice()
            : [],
        };
      }),
    });
  }

  function resolvePromptRecord(record, assets, timestamp) {
    const references = Array.isArray(record?.references)
      ? record.references.filter(isObject).map((reference) => resolvePromptReference(reference, assets))
      : [];
    const blockedReferences = getBlockedReferences(references);
    const isBlocked = blockedReferences.length > 0;

    const resolvedRecord = Object.assign({}, record, {
      references,
      blocked_references: blockedReferences,
      reference_resolution: {
        resolved_count: references.filter(
          (reference) => reference.resolution_status === "resolved",
        ).length,
        blocked_count: blockedReferences.length,
        unresolved_count: references.filter((reference) => {
          return (
            reference.resolution_status === "missing" ||
            reference.resolution_status === "ambiguous"
          );
        }).length,
        resolved_at: timestamp,
      },
      status: isBlocked ? "blocked" : "ready",
      can_generate_images: !isBlocked,
      updated_at: timestamp,
    });

    return getPromptResolutionSignature(record) === getPromptResolutionSignature(resolvedRecord)
      ? record
      : resolvedRecord;
  }

  function resolvePromptRecordsForProject(project, records) {
    const timestamp = new Date().toISOString();
    const assets = getProjectAssets(project);
    return records.map((record) => resolvePromptRecord(record, assets, timestamp));
  }

  function summarizePromptResolution(records) {
    const readyCount = records.filter((record) => record.status === "ready").length;
    const blockedCount = records.filter((record) => record.status === "blocked").length;
    const needsResolutionCount = records.filter(
      (record) => record.status === "needs_resolution",
    ).length;

    return {
      ready_count: readyCount,
      blocked_count: blockedCount,
      needs_resolution_count: needsResolutionCount,
      record_count: records.length,
    };
  }

  function getPromptDisabledReason(record) {
    const blocked = Array.isArray(record?.blocked_references) ? record.blocked_references : [];
    if (blocked.length) {
      return blocked
        .map((reference) => {
          const reason = reference.reason === "ambiguous" ? "Ambiguous" : "Missing";
          const type = reference.type ? ` (${reference.type})` : "";
          return `${reason}: ${reference.name || "unnamed"}${type}`;
        })
        .join("; ");
    }
    if (record?.status !== "ready") return "Prompt is not Ready.";
    if (record?.can_generate_images === false) return "Prompt is marked generation-disabled.";
    return "";
  }

  function buildReferenceRequest(reference, assets) {
    if (!reference || reference.resolution_status !== "resolved" || !reference.asset_id) {
      return {
        ok: false,
        reason: `Reference ${reference?.name || "unnamed"} is not resolved.`,
      };
    }

    const asset = getAssetById(assets, reference.asset_id);
    if (!asset || !isAssetActive(asset)) {
      return {
        ok: false,
        reason: `Reference ${reference.name || "unnamed"} Asset is unavailable.`,
      };
    }

    const primaryFile = getPrimaryAssetFile(asset);
    if (!primaryFile) {
      return {
        ok: false,
        reason: `Reference ${
          reference.name || safeAssetName(asset.display_name || asset.displayName || asset.name)
        } has no Asset File.`,
      };
    }

    return {
      ok: true,
      reference: {
        name: reference.name || "",
        type: reference.type || asset.type || "",
        asset_id: asset.asset_id,
        asset_name: safeAssetName(asset.display_name || asset.displayName || asset.name),
        asset_file_id: primaryFile.asset_file_id,
        file_name: primaryFile.file_name || "reference-file",
        mime_type: primaryFile.mime_type || "application/octet-stream",
        size_bytes: Number(primaryFile.size_bytes || 0),
        role: primaryFile.role || "primary",
        resolution_source: reference.resolution_source || "auto",
      },
    };
  }

  function buildImageGateItem(record, assets) {
    const disabledReason = getPromptDisabledReason(record);
    if (disabledReason) {
      return {
        prompt_id: record.prompt_id,
        file_name: record.file_name,
        image_prompt: record.image_prompt,
        state: record.image_generation_state === "generating" ? "generating" : "blocked",
        can_generate: false,
        disabled_reason: disabledReason,
        references: [],
      };
    }

    const references = Array.isArray(record.references) ? record.references.filter(isObject) : [];
    const requestReferences = new Array();
    const referenceErrors = new Array();
    references
      .filter((reference) => reference.resolution_status === "resolved" && reference.asset_id)
      .forEach((reference) => {
        const result = buildReferenceRequest(reference, assets);
        if (result.ok && result.reference) {
          requestReferences.push(result.reference);
        } else {
          referenceErrors.push(String(result.reason || "Reference could not be prepared."));
        }
      });

    if (referenceErrors.length) {
      return {
        prompt_id: record.prompt_id,
        file_name: record.file_name,
        image_prompt: record.image_prompt,
        state: "blocked",
        can_generate: false,
        disabled_reason: referenceErrors.join("; "),
        references: requestReferences,
      };
    }

    return {
      prompt_id: record.prompt_id,
      file_name: record.file_name,
      image_prompt: record.image_prompt,
      animation_prompt: record.animation_prompt || "",
      state: record.image_generation_state === "generating" ? "generating" : "ready",
      can_generate: record.image_generation_state !== "generating",
      disabled_reason:
        record.image_generation_state === "generating" ? "Image generation is in progress." : "",
      references: requestReferences,
    };
  }

  function getImageGenerationGate(project) {
    const sourceProject = project || studioState.activeProject;
    const promptRecords = getProjectPromptRecords(sourceProject);
    const assets = getProjectAssets(sourceProject);
    const items = promptRecords.map((record) => buildImageGateItem(record, assets));
    const included = items.filter((item) => item.can_generate && item.state === "ready");
    const blocked = items.filter((item) => !item.can_generate && item.state !== "generating");
    const generating = items.filter((item) => item.state === "generating");

    return {
      items,
      included,
      blocked,
      generating,
      ready_count: included.length,
      blocked_count: blocked.length,
      generating_count: generating.length,
      prompt_count: items.length,
    };
  }

  function getAssetFiles(asset) {
    return Array.isArray(asset?.files) ? asset.files.filter(isObject) : [];
  }

  function getProjectImageGenerationRuns(project) {
    return Array.isArray(project?.image_generation_runs)
      ? project.image_generation_runs.filter(isObject)
      : [];
  }

  function getPrimaryAssetFile(asset) {
    const files = getAssetFiles(asset);
    if (!files.length) return null;
    const primaryFileId = asset?.primary_file_id || "";
    return (
      files.find((file) => file.asset_file_id === primaryFileId) ||
      files.find((file) => file.is_primary || file.role === "primary") ||
      files[0]
    );
  }

  function getProjectImageVariants(project) {
    return Array.isArray(project?.image_variants)
      ? project.image_variants.filter(isObject)
      : [];
  }

  function getProjectVideoJobs(project) {
    return Array.isArray(project?.video_jobs) ? project.video_jobs.filter(isObject) : [];
  }

  function getPromptAnimationPrompt(record) {
    return String(record?.animation_prompt || record?.animationPrompt || "").trim();
  }

  function normalizeVideoJobStatus(job) {
    const status = String(job?.status || "").trim().toLowerCase();
    if (status === "queued") return "ready";
    if (status === "completed") return "complete";
    return status || "draft";
  }

  function getVideoStatusView(status) {
    if (status === "not_ready") return { label: "Not Ready", tone: "warning" };
    if (status === "draft") return { label: "Draft", tone: "info" };
    if (status === "ready") return { label: "Ready", tone: "success" };
    if (status === "needs_review") return { label: "Needs Review", tone: "warning" };
    if (status === "running") return { label: "Running", tone: "info" };
    if (status === "failed") return { label: "Failed", tone: "danger" };
    if (status === "complete") return { label: "Complete", tone: "success" };
    return { label: status || "Draft", tone: "info" };
  }

  function buildVideoOutputFileName(fileName) {
    const clean = String(fileName || "").trim() || "video";
    const withoutExtension = clean.replace(/\.[a-z0-9]{2,5}$/i, "") || "video";
    return `${withoutExtension}.mp4`;
  }

  function getVariantSourceFileName(variant) {
    return (
      variant?.generated_file_name ||
      variant?.local_file_name ||
      variant?.expected_file_name ||
      ""
    );
  }

  function getVariantMediaId(variant) {
    return String(variant?.media_id || variant?.mediaId || "").trim();
  }

  function getSelectedVariantForPrompt(project, promptRecord) {
    const selectedVariantId = String(
      promptRecord?.selected_variant_id || promptRecord?.selectedVariantId || "",
    ).trim();
    if (!selectedVariantId) return null;
    return (
      getProjectImageVariants(project).find((variant) => {
        return (
          variant.variant_id === selectedVariantId &&
          variant.prompt_id === promptRecord?.prompt_id
        );
      }) || null
    );
  }

  function isVariantMissingLocalFile(variant) {
    return (
      variant?.file_state === "missing" ||
      variant?.status === "missing" ||
      variant?.repair_state === "missing_local_file"
    );
  }

  function getLatestVideoJobForPrompt(videoJobs, promptId) {
    const promptKey = String(promptId || "").trim();
    return (
      videoJobs
        .filter((job) => String(job.prompt_id || "").trim() === promptKey)
        .slice()
        .sort((left, right) => {
          const leftTime = Date.parse(left.updated_at || left.created_at || "") || 0;
          const rightTime = Date.parse(right.updated_at || right.created_at || "") || 0;
          return rightTime - leftTime;
        })[0] || null
    );
  }

  function getNextVideoQueueOrder(videoJobs) {
    return (
      videoJobs.reduce((maxOrder, job) => {
        const order = Number(job.queue_order || job.queueOrder || 0);
        return Number.isFinite(order) && order > maxOrder ? order : maxOrder;
      }, 0) + 1
    );
  }

  function sortVideoQueueItems(items) {
    const statusRank = {
      ready: 0,
      needs_review: 1,
      draft: 2,
      not_ready: 3,
      failed: 4,
      running: 5,
      complete: 6,
    };
    return items.slice().sort((left, right) => {
      const leftRank = statusRank[left.status] ?? 9;
      const rightRank = statusRank[right.status] ?? 9;
      if (leftRank !== rightRank) return leftRank - rightRank;
      if (left.status === "ready" && right.status === "ready") {
        return Number(left.queue_order || 0) - Number(right.queue_order || 0);
      }
      return Number(left.source_index || 0) - Number(right.source_index || 0);
    });
  }

  function buildVideoJobRecord(project, promptRecord, selectedVariant, existingJob, timestamp, status) {
    const animationPrompt = getPromptAnimationPrompt(promptRecord);
    const promptFileName =
      String(promptRecord?.file_name || selectedVariant?.expected_file_name || "").trim() ||
      "video.png";
    const sourceFileName = getVariantSourceFileName(selectedVariant);

    return Object.assign({}, existingJob || {}, {
      job_id: existingJob?.job_id || createVideoJobId(),
      job_type: "video",
      project_id: project.project_id,
      prompt_id: promptRecord.prompt_id,
      status: status || "draft",
      selected_variant_id: selectedVariant.variant_id,
      start_variant_id: selectedVariant.variant_id,
      start_image_file_name: sourceFileName,
      selected_variant_generated_file_name: selectedVariant.generated_file_name || "",
      animation_prompt: animationPrompt,
      expected_output_file_name:
        existingJob?.expected_output_file_name || buildVideoOutputFileName(promptFileName),
      source_prompt_file_name: promptFileName,
      needs_review_reason: "",
      pending_selected_variant_id: "",
      pending_selected_generated_file_name: "",
      created_at: existingJob?.created_at || timestamp,
      updated_at: timestamp,
    });
  }

  function getVideoJobReviewReason(job, promptRecord, selectedVariant) {
    if (!promptRecord) return "Prompt Record is missing.";
    if (!getPromptAnimationPrompt(promptRecord)) return "Animation prompt is missing.";
    if (!selectedVariant) return "Select an image variant before queueing video.";
    if (isVariantMissingLocalFile(selectedVariant)) {
      return "Selected image needs local file repair before video work.";
    }
    if (job.selected_variant_id !== selectedVariant.variant_id) {
      return "Selected image changed after this draft was prepared.";
    }
    return "";
  }

  function reconcileVideoJobsForSelectionChange(videoJobs, promptId, selectedVariant, timestamp) {
    return videoJobs.map((job) => {
      if (String(job.prompt_id || "").trim() !== promptId) return job;
      const status = normalizeVideoJobStatus(job);
      if (status === "running" || status === "complete") return job;

      if (status === "ready") {
        return Object.assign({}, job, {
          status: "needs_review",
          needs_review_reason: "Selected image changed after this job was marked Ready.",
          pending_selected_variant_id: selectedVariant.variant_id,
          pending_selected_generated_file_name: selectedVariant.generated_file_name || "",
          updated_at: timestamp,
        });
      }

      return Object.assign({}, job, {
        status: "draft",
        selected_variant_id: selectedVariant.variant_id,
        start_variant_id: selectedVariant.variant_id,
        start_image_file_name: getVariantSourceFileName(selectedVariant),
        selected_variant_generated_file_name: selectedVariant.generated_file_name || "",
        needs_review_reason: "",
        pending_selected_variant_id: "",
        pending_selected_generated_file_name: "",
        updated_at: timestamp,
      });
    });
  }

  function getVideoQueueItems(project) {
    const promptRecords = getProjectPromptRecords(project);
    const videoJobs = getProjectVideoJobs(project);

    const items = promptRecords.map((record, sourceIndex) => {
      const animationPrompt = getPromptAnimationPrompt(record);
      const selectedVariant = getSelectedVariantForPrompt(project, record);
      const job = getLatestVideoJobForPrompt(videoJobs, record.prompt_id);
      const status = job ? normalizeVideoJobStatus(job) : selectedVariant ? "draftable" : "not_ready";
      const terminalJob = job && (status === "running" || status === "complete");
      const selectedFileName = selectedVariant ? getVariantSourceFileName(selectedVariant) : "";
      const selectedMissing = selectedVariant && isVariantMissingLocalFile(selectedVariant);
      const reviewReason = job ? getVideoJobReviewReason(job, record, selectedVariant) : "";
      let itemStatus = status === "draftable" ? "draft" : status;
      let reason = "";
      let canCreateDraft = false;
      let canQueue = false;
      let actionLabel = "Create Draft";

      if (!animationPrompt && !selectedVariant) {
        itemStatus = "not_ready";
        reason = "Add an animation prompt and select an image variant.";
      } else if (!animationPrompt) {
        itemStatus = "not_ready";
        reason = "Animation prompt is missing.";
      } else if (!selectedVariant) {
        itemStatus = "not_ready";
        reason = "Select an image variant first.";
      } else if (selectedMissing) {
        itemStatus = "not_ready";
        reason = "Selected image needs local file repair.";
      } else if (!job) {
        itemStatus = "draft";
        reason = "Ready to create a Video Draft.";
        canCreateDraft = true;
      } else if (terminalJob) {
        reason =
          job.selected_variant_id === selectedVariant.variant_id
            ? "Existing job is protected after run starts."
            : "Existing job is protected; create a new draft from the new selection.";
        canCreateDraft = true;
        actionLabel = "Create New Draft";
      } else if (status === "needs_review" || reviewReason) {
        itemStatus = "needs_review";
        reason = job.needs_review_reason || reviewReason;
        canCreateDraft = true;
        actionLabel = "Update Draft";
      } else if (status === "draft") {
        reason = "Draft is ready for queue review.";
        canCreateDraft = true;
        canQueue = true;
        actionLabel = "Update Draft";
      } else if (status === "ready") {
        reason = "Ready for a future video runner.";
      } else if (status === "running") {
        reason = "Video generation is running.";
      } else if (status === "complete") {
        reason = job.video_url || job.output_media_id ? "Video output recorded." : "Video complete.";
      } else if (status === "failed") {
        reason = job.error_message || "Video job failed.";
        canCreateDraft = true;
        actionLabel = "Update Draft";
      }

      const statusView = getVideoStatusView(itemStatus);
      return {
        prompt_id: record.prompt_id,
        file_name: record.file_name || "",
        animation_prompt: animationPrompt,
        selected_variant_id: selectedVariant?.variant_id || "",
        selected_file_name: selectedFileName,
        job,
        job_id: job?.job_id || "",
        status: itemStatus,
        status_label: statusView.label,
        tone: statusView.tone,
        reason,
        source_index: Number(record.source_index || sourceIndex || 0),
        queue_order: Number(job?.queue_order || job?.queueOrder || 0),
        can_create_draft: canCreateDraft,
        create_label: actionLabel,
        can_queue: canQueue,
        can_hold: !!job && status === "ready",
        can_remove: !!job && !terminalJob,
        can_move: !!job && status === "ready",
        can_run: !!job && status === "ready",
        can_retry: !!job && status === "failed",
        can_stop: !!job && status === "running",
      };
    });

    return sortVideoQueueItems(items);
  }

  function normalizeRelativeFileName(value) {
    const parts = String(value || "image.png")
      .replace(/\\/g, "/")
      .replace(/^[a-zA-Z]:/, "")
      .replace(/^\/+/, "")
      .split("/")
      .filter(Boolean)
      .filter((part) => part !== "." && part !== "..")
      .map((part) => part.replace(/[<>:"|?*\x00-\x1f]/g, "-").trim())
      .filter(Boolean);
    if (!parts.length) return ["image.png"];
    return parts;
  }

  function buildImageVariantFileName(expectedFileName, variantIndex) {
    const parts = normalizeRelativeFileName(expectedFileName);
    const leaf = parts.pop() || "image.png";
    const extensionMatch = leaf.match(/\.[^/.]+$/);
    const extension = extensionMatch ? extensionMatch[0] : ".png";
    const baseName = extensionMatch ? leaf.slice(0, -extension.length) : leaf;
    const safeBaseName = baseName || "image";
    const number = Number.isInteger(variantIndex) && variantIndex >= 0 ? variantIndex + 1 : 1;
    parts.push(`${safeBaseName}__${number}${extension}`);
    return parts.join("/");
  }

  function normalizeVariantIndex(input, fallbackIndex) {
    const explicitIndex = Number(input?.variant_index ?? input?.variantIndex);
    if (Number.isInteger(explicitIndex) && explicitIndex >= 0) return explicitIndex;
    const explicitNumber = Number(input?.variant_number ?? input?.variantNumber);
    if (Number.isInteger(explicitNumber) && explicitNumber > 0) return explicitNumber - 1;
    return fallbackIndex;
  }

  function getVariantInputValue(input, snakeName, camelName) {
    if (!isObject(input)) return "";
    const value = Object.prototype.hasOwnProperty.call(input, snakeName)
      ? input[snakeName]
      : input[camelName];
    return String(value || "").trim();
  }

  function getVariantFileState(input) {
    const explicit = getVariantInputValue(input, "file_state", "fileState");
    if (explicit) return explicit;
    const status = getVariantInputValue(input, "status", "status");
    if (status === "failed" || status === "missing" || status === "available") return status;
    const hasLocalFile =
      !!getVariantInputValue(input, "local_path", "localPath") ||
      !!getVariantInputValue(input, "local_file_name", "localFileName") ||
      !!getVariantInputValue(input, "download_id", "downloadId") ||
      input?.downloaded === true;
    return hasLocalFile ? "available" : "missing";
  }

  function getVariantRecordKey(imageRunId, promptId, variantIndex) {
    return [imageRunId || "", promptId || "", String(variantIndex)].join("::");
  }

  function findImageGenerationRun(project, imageRunId) {
    const key = String(imageRunId || "").trim();
    return getProjectImageGenerationRuns(project).find((run) => run.image_run_id === key) || null;
  }

  function findCompletionForPrompt(completions, promptId) {
    return completions.find((item) => String(item.prompt_id || item.promptId || "") === promptId) || {};
  }

  function upsertImageVariant(nextVariants, variant) {
    const key = getVariantRecordKey(
      variant.image_run_id,
      variant.prompt_id,
      variant.variant_index,
    );
    const existingIndex = nextVariants.findIndex((item) => {
      return getVariantRecordKey(item.image_run_id, item.prompt_id, item.variant_index) === key;
    });
    if (existingIndex >= 0) {
      nextVariants[existingIndex] = variant;
      return;
    }
    nextVariants.push(variant);
  }

  function buildImageVariantRecord(project, runRecord, requestItem, variantInput, fallbackIndex, existingVariant, timestamp) {
    const variantIndex = normalizeVariantIndex(variantInput, fallbackIndex);
    const variantNumber = variantIndex + 1;
    const expectedFileName = String(requestItem.file_name || requestItem.fileName || "").trim();
    const explicitGeneratedFileName =
      getVariantInputValue(variantInput, "generated_file_name", "generatedFileName") ||
      getVariantInputValue(variantInput, "file_name", "fileName");
    const generatedFileName =
      explicitGeneratedFileName || buildImageVariantFileName(expectedFileName, variantIndex);
    const fileState = getVariantFileState(variantInput);
    const localFileName =
      getVariantInputValue(variantInput, "local_file_name", "localFileName") ||
      (fileState === "available" ? generatedFileName : "");

    return Object.assign({}, existingVariant || {}, {
      variant_id: existingVariant?.variant_id || createVariantId(),
      project_id: project.project_id,
      prompt_id: requestItem.prompt_id,
      image_run_id: runRecord.image_run_id,
      source_index: Number(requestItem.source_index || 0),
      variant_index: variantIndex,
      variant_number: variantNumber,
      expected_file_name: expectedFileName,
      generated_file_name: generatedFileName,
      local_file_name: localFileName,
      local_path: getVariantInputValue(variantInput, "local_path", "localPath"),
      media_id: getVariantInputValue(variantInput, "media_id", "mediaId"),
      download_id: getVariantInputValue(variantInput, "download_id", "downloadId"),
      thumbnail_url: getVariantInputValue(variantInput, "thumbnail_url", "thumbnailUrl"),
      fife_url: getVariantInputValue(variantInput, "fife_url", "fifeUrl"),
      file_state: fileState,
      repair_state: fileState === "missing" ? "missing_local_file" : "",
      status: fileState === "available" ? "available" : fileState,
      created_at: existingVariant?.created_at || timestamp,
      updated_at: timestamp,
    });
  }

  function findAsset(assetId) {
    const id = String(assetId || "").trim();
    const assets = getProjectAssets(studioState.activeProject);
    return assets.find((asset) => asset.asset_id === id) || null;
  }

  function buildAssetFile(file, isPrimary) {
    const timestamp = new Date().toISOString();
    return readFileAsDataUrl(file).then((dataUrl) => {
      return {
        asset_file_id: createAssetFileId(),
        file_name: file.name || "reference-file",
        mime_type: file.type || "application/octet-stream",
        size_bytes: Number(file.size || 0),
        last_modified: file.lastModified || null,
        data_url: dataUrl,
        source: "manual_upload",
        role: isPrimary ? "primary" : "reference",
        is_primary: !!isPrimary,
        created_at: timestamp,
        updated_at: timestamp,
      };
    });
  }

  function getCounts() {
    const project = studioState.activeProject || {};
    const projects = Array.isArray(studioState.domainState?.projects)
      ? studioState.domainState.projects.length
      : 0;
    const promptRecords = getProjectPromptRecords(project);
    const blockedPromptRecords = promptRecords.filter(
      (record) => record.status === "needs_resolution" || record.status === "blocked",
    );

    return {
      projects,
      assets: countProjectItems(project, [
        "assets",
        "characters",
        "places",
        "reference_files",
        "referenceFiles",
      ]),
      blocked:
        countProjectItems(project, ["blocked_prompts", "blockedPrompts"]) +
        blockedPromptRecords.length,
      gallery: countProjectItems(project, ["gallery", "downloads", "outputs"]),
      images: countProjectItems(project, ["image_variants", "imageVariants", "images"]),
      prompts:
        countProjectItems(project, ["prompts", "prompt_index", "promptIndex"]) +
        promptRecords.length,
      videoJobs: getProjectVideoJobs(project).length,
    };
  }

  function formatDate(value) {
    if (!value) return "Not set";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
  }

  function setActiveView(viewId) {
    studioState.activeView = getViewDefinition(viewId).id;
  }

  function setAssetFilter(type) {
    studioState.assetFilter =
      type === "all" || ASSET_TYPES.some((item) => item.id === type) ? type : "all";
  }

  async function loadProjectState() {
    studioState.isLoading = true;
    try {
      const domain = getDomain();
      if (!domain || typeof domain.load !== "function") {
        throw new Error("Project domain API unavailable.");
      }

      const domainState = await domain.load();
      studioState.domainState = domainState;
      studioState.activeProject = resolveActiveProject(domainState);
      studioState.lastError = null;
      return studioState;
    } catch (error) {
      studioState.lastError = error;
      throw error;
    } finally {
      studioState.isLoading = false;
    }
  }

  async function setActiveProject(projectId) {
    const domain = getDomain();
    if (!domain || typeof domain.setActiveProject !== "function") {
      throw new Error("Project domain API unavailable.");
    }

    const result = await domain.setActiveProject(projectId);
    if (!result || !result.ok) {
      const message = result?.error?.message || "Project switch failed.";
      throw new Error(message);
    }

    studioState.domainState = result.state;
    studioState.activeProject = resolveActiveProject(result.state);
    studioState.lastError = null;
    return studioState;
  }

  async function updateActiveProject(updates) {
    const projectId = studioState.activeProject?.project_id;
    const domain = getDomain();

    if (!projectId) {
      throw new Error("No active Project selected.");
    }
    if (!domain || typeof domain.updateProject !== "function") {
      throw new Error("Project domain API unavailable.");
    }

    const result = await domain.updateProject(projectId, updates);
    if (!result || !result.ok) {
      const message = result?.error?.message || "Project update failed.";
      throw new Error(message);
    }

    studioState.domainState = result.state;
    studioState.activeProject = resolveActiveProject(result.state);
    studioState.lastError = null;
    return studioState;
  }

  async function createAsset(input) {
    const project = studioState.activeProject;
    if (!project) {
      throw new Error("No active Project selected.");
    }

    const timestamp = new Date().toISOString();
    const asset = {
      asset_id: createAssetId(),
      type: safeAssetType(input?.type),
      display_name: safeAssetName(input?.display_name || input?.name),
      aliases: parseAliases(input?.aliases),
      files: [],
      usage_count: 0,
      flow_upload_state: "none",
      created_at: timestamp,
      updated_at: timestamp,
    };

    const assets = getProjectAssets(project).concat(asset);
    await updateActiveProject({ assets });
    return asset;
  }

  async function addAssetFiles(assetId, fileList) {
    const project = studioState.activeProject;
    const asset = findAsset(assetId);
    const incomingFiles = Array.prototype.slice.call(fileList || []).filter(Boolean);

    if (!project) {
      throw new Error("No active Project selected.");
    }
    if (!asset) {
      throw new Error("Asset not found.");
    }
    if (!incomingFiles.length) {
      throw new Error("Choose at least one file.");
    }

    const existingFiles = getAssetFiles(asset);
    const hasPrimary = existingFiles.some((file) => file.is_primary || file.role === "primary");
    const newFiles = await Promise.all(
      incomingFiles.map((file, index) => buildAssetFile(file, !hasPrimary && index === 0)),
    );
    const allFiles = existingFiles.concat(newFiles);
    const primaryFile =
      allFiles.find((file) => file.is_primary || file.role === "primary") || allFiles[0] || null;
    const timestamp = new Date().toISOString();

    const assets = getProjectAssets(project).map((item) => {
      if (item.asset_id !== asset.asset_id) return item;
      return Object.assign({}, item, {
        files: allFiles.map((file) => {
          const isPrimary = primaryFile && file.asset_file_id === primaryFile.asset_file_id;
          return Object.assign({}, file, {
            role: isPrimary ? "primary" : "reference",
            is_primary: !!isPrimary,
          });
        }),
        primary_file_id: primaryFile ? primaryFile.asset_file_id : null,
        flow_upload_state: "none",
        updated_at: timestamp,
      });
    });

    await updateActiveProject({ assets });
    return { asset_id: asset.asset_id, files: newFiles };
  }

  async function setPrimaryAssetFile(assetId, assetFileId) {
    const project = studioState.activeProject;
    const asset = findAsset(assetId);
    const fileId = String(assetFileId || "").trim();

    if (!project) {
      throw new Error("No active Project selected.");
    }
    if (!asset) {
      throw new Error("Asset not found.");
    }

    const files = getAssetFiles(asset);
    if (!files.some((file) => file.asset_file_id === fileId)) {
      throw new Error("Asset file not found.");
    }

    const timestamp = new Date().toISOString();
    const assets = getProjectAssets(project).map((item) => {
      if (item.asset_id !== asset.asset_id) return item;
      return Object.assign({}, item, {
        files: files.map((file) => {
          const isPrimary = file.asset_file_id === fileId;
          return Object.assign({}, file, {
            role: isPrimary ? "primary" : "reference",
            is_primary: isPrimary,
            updated_at: isPrimary ? timestamp : file.updated_at,
          });
        }),
        primary_file_id: fileId,
        updated_at: timestamp,
      });
    });

    await updateActiveProject({ assets });
    return { asset_id: asset.asset_id, asset_file_id: fileId };
  }

  async function updateAsset(assetId, updates) {
    const project = studioState.activeProject;
    const asset = findAsset(assetId);

    if (!project) {
      throw new Error("No active Project selected.");
    }
    if (!asset) {
      throw new Error("Asset not found.");
    }

    const patch = isObject(updates) ? updates : {};
    const timestamp = new Date().toISOString();
    const assets = getProjectAssets(project).map((item) => {
      if (item.asset_id !== asset.asset_id) return item;
      return Object.assign({}, item, {
        type: Object.prototype.hasOwnProperty.call(patch, "type")
          ? safeAssetType(patch.type)
          : item.type,
        display_name: Object.prototype.hasOwnProperty.call(patch, "display_name")
          ? safeAssetName(patch.display_name)
          : item.display_name,
        aliases: Object.prototype.hasOwnProperty.call(patch, "aliases")
          ? parseAliases(patch.aliases)
          : item.aliases,
        updated_at: timestamp,
      });
    });

    await updateActiveProject({ assets });
    return { asset_id: asset.asset_id };
  }

  async function setAssetDisabled(assetId, disabled) {
    const project = studioState.activeProject;
    const asset = findAsset(assetId);

    if (!project) {
      throw new Error("No active Project selected.");
    }
    if (!asset) {
      throw new Error("Asset not found.");
    }

    const timestamp = new Date().toISOString();
    const assets = getProjectAssets(project).map((item) => {
      if (item.asset_id !== asset.asset_id) return item;
      return Object.assign({}, item, {
        disabled: !!disabled,
        disabled_at: disabled ? timestamp : null,
        lifecycle_status: disabled ? "disabled" : "active",
        updated_at: timestamp,
      });
    });

    await updateActiveProject({ assets });
    return { asset_id: asset.asset_id, disabled: !!disabled };
  }

  async function importProjectPromptJson(input, sourceName) {
    const project = studioState.activeProject;
    const contract = getContract();

    if (!project) {
      throw new Error("No active Project selected.");
    }
    if (!contract || typeof contract.parsePromptJson !== "function") {
      throw new Error("Project JSON contract API unavailable.");
    }

    const parsed = contract.parsePromptJson(input);
    if (!parsed || !parsed.ok) {
      const errors = Array.isArray(parsed?.errors) ? parsed.errors.filter(Boolean) : [];
      throw new Error(errors.join(" ") || "Project prompt JSON import failed.");
    }

    const timestamp = new Date().toISOString();
    const importId = createPromptImportId();
    const importedRecords = parsed.records.map((record, index) => {
      const references = Array.isArray(record.references)
        ? record.references.filter(isObject).map((reference) => Object.assign({}, reference))
        : [];
      const rawReferenceNames = getRawReferenceNames(record);
      return {
        prompt_id: createPromptId(),
        file_name: record.file_name,
        image_prompt: record.image_prompt,
        animation_prompt: record.animation_prompt || "",
        references,
        raw_reference_names: rawReferenceNames,
        status: "imported",
        can_generate_images: false,
        source: {
          import_id: importId,
          source_name: String(sourceName || "Project prompt JSON").trim(),
          source_index: index,
          imported_at: timestamp,
        },
        created_at: timestamp,
        updated_at: timestamp,
      };
    });
    const resolvedRecords = resolvePromptRecordsForProject(project, importedRecords);
    const summary = summarizePromptResolution(resolvedRecords);
    const importRecord = {
      import_id: importId,
      source_name: String(sourceName || "Project prompt JSON").trim(),
      imported_at: timestamp,
      record_count: summary.record_count,
      ready_count: summary.ready_count,
      blocked_count: summary.blocked_count,
      needs_resolution_count: summary.needs_resolution_count,
      warning_count: Array.isArray(parsed.warnings) ? parsed.warnings.length : 0,
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings.slice() : [],
      contract_version: parsed.meta?.contract_version || contract.CONTRACT_VERSION || 1,
    };

    await updateActiveProject({
      prompt_records: getProjectPromptRecords(project).concat(resolvedRecords),
      prompt_imports: getProjectPromptImports(project).concat(importRecord),
    });

    return {
      import_record: importRecord,
      records: resolvedRecords,
      warnings: importRecord.warnings.slice(),
    };
  }

  async function resolveActiveProjectPromptReferences() {
    const project = studioState.activeProject;
    if (!project) {
      throw new Error("No active Project selected.");
    }

    const promptRecords = getProjectPromptRecords(project);
    if (!promptRecords.length) {
      throw new Error("No Prompt Records to resolve.");
    }

    const resolvedRecords = resolvePromptRecordsForProject(project, promptRecords);
    await updateActiveProject({ prompt_records: resolvedRecords });
    return {
      records: resolvedRecords,
      summary: summarizePromptResolution(resolvedRecords),
    };
  }

  async function mapPromptReferenceToAsset(promptId, referenceIndex, assetId) {
    const project = studioState.activeProject;
    const promptKey = String(promptId || "").trim();
    const index = Number(referenceIndex);
    const assets = getProjectAssets(project);
    const asset = getAssetById(assets, assetId);

    if (!project) {
      throw new Error("No active Project selected.");
    }
    if (!promptKey) {
      throw new Error("Prompt Record is missing.");
    }
    if (!Number.isInteger(index) || index < 0) {
      throw new Error("Reference selection is invalid.");
    }
    if (!asset || !isAssetActive(asset)) {
      throw new Error("Choose an active Asset.");
    }

    const promptRecords = getProjectPromptRecords(project);
    const prompt = promptRecords.find((record) => record.prompt_id === promptKey);
    if (!prompt) {
      throw new Error("Prompt Record not found.");
    }

    const references = Array.isArray(prompt.references) ? prompt.references.filter(isObject) : [];
    const reference = references[index];
    if (!reference) {
      throw new Error("Reference not found on Prompt Record.");
    }

    const referenceType = String(reference.type || "").trim().toLowerCase();
    if (referenceType && asset.type !== referenceType) {
      throw new Error(`Reference expects ${referenceType}; selected Asset is ${asset.type || "unknown"}.`);
    }

    const timestamp = new Date().toISOString();
    const nextRecords = promptRecords.map((record) => {
      if (record.prompt_id !== promptKey) return record;

      const mappedReferences = references.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        return Object.assign({}, item, {
          manual_asset_id: asset.asset_id,
          asset_id: asset.asset_id,
          asset_type: asset.type || "",
          asset_name: safeAssetName(asset.display_name || asset.displayName || asset.name),
          resolution_status: "resolved",
          resolution_source: "manual",
          resolution_error: "",
        });
      });

      return resolvePromptRecord(
        Object.assign({}, record, {
          references: mappedReferences,
          updated_at: timestamp,
        }),
        assets,
        timestamp,
      );
    });

    await updateActiveProject({ prompt_records: nextRecords });

    return {
      prompt_id: promptKey,
      asset_id: asset.asset_id,
      records: nextRecords,
      summary: summarizePromptResolution(nextRecords),
    };
  }

  async function startImageGenerationRun() {
    /** @type {any} */
    const project = studioState.activeProject;
    if (!project) {
      throw new Error("No active Project selected.");
    }

    const gate = getImageGenerationGate(project);
    if (!gate.included.length) {
      throw new Error("No Ready prompts are eligible for image generation.");
    }

    const timestamp = new Date().toISOString();
    const imageRunId = createImageRunId();
    const projectSettings = Object(project).settings;
    const settings = isObject(projectSettings) ? projectSettings : {};
    const imageCount = Number(settings.image_count || settings.imageCount || 2);
    const requestItems = gate.included.map((item, index) => {
      return {
        prompt_id: item.prompt_id,
        source_index: index,
        file_name: item.file_name,
        image_prompt: item.image_prompt,
        references: item.references.map((reference) => Object.assign({}, reference)),
      };
    });
    const runRecord = {
      image_run_id: imageRunId,
      status: "generating",
      image_count: imageCount > 0 ? imageCount : 2,
      prompt_count: requestItems.length,
      excluded_prompt_count: gate.blocked.length,
      request_items: requestItems,
      created_at: timestamp,
      updated_at: timestamp,
    };
    const includedPromptIds = new Set(requestItems.map((item) => item.prompt_id));
    const promptRecords = getProjectPromptRecords(project).map((record) => {
      if (!includedPromptIds.has(record.prompt_id)) return record;
      return Object.assign({}, record, {
        active_image_run_id: imageRunId,
        image_generation_state: "generating",
        image_generation_started_at: timestamp,
        updated_at: timestamp,
      });
    });

    await updateActiveProject({
      prompt_records: promptRecords,
      image_generation_runs: getProjectImageGenerationRuns(project).concat(runRecord),
    });

    return {
      run: runRecord,
      gate,
    };
  }

  async function recordImageGenerationRunVariants(imageRunId, completionItems) {
    const activeProject = studioState.activeProject;
    if (!activeProject) {
      throw new Error("No active Project selected.");
    }

    const project = Object(activeProject);
    const runKey = String(imageRunId || "").trim();
    const runRecord = findImageGenerationRun(project, runKey);
    if (!runRecord) {
      throw new Error(`Image generation run not found: ${runKey || "(empty id)"}.`);
    }

    const requestItems = Array.isArray(runRecord.request_items)
      ? runRecord.request_items.filter(isObject)
      : [];
    if (!requestItems.length) {
      throw new Error("Image generation run has no request items to record.");
    }

    const timestamp = new Date().toISOString();
    const completions = Array.isArray(completionItems) ? completionItems.filter(isObject) : [];
    const existingVariants = getProjectImageVariants(project);
    const nextVariants = existingVariants.slice();
    const recordedVariants = new Array();
    const completedPromptIds = new Set();
    const defaultImageCount = Number(runRecord.image_count || 2);
    const imageCount = defaultImageCount > 0 ? defaultImageCount : 2;

    requestItems.forEach((requestItem) => {
      const promptId = String(requestItem.prompt_id || "").trim();
      if (!promptId) return;

      const completion = findCompletionForPrompt(completions, promptId);
      const providedVariants = Array.isArray(completion.variants)
        ? completion.variants.filter(isObject)
        : [];
      const variantCount = Math.max(imageCount, providedVariants.length || 0);
      completedPromptIds.add(promptId);

      for (let index = 0; index < variantCount; index += 1) {
        const variantInput = providedVariants[index] || {};
        const variantIndex = normalizeVariantIndex(variantInput, index);
        const existingVariant =
          existingVariants.find((item) => {
            return (
              item.image_run_id === runRecord.image_run_id &&
              item.prompt_id === promptId &&
              Number(item.variant_index) === variantIndex
            );
          }) || null;
        const variant = buildImageVariantRecord(
          project,
          runRecord,
          requestItem,
          variantInput,
          index,
          existingVariant,
          timestamp,
        );
        upsertImageVariant(nextVariants, variant);
        recordedVariants.push(variant);
      }
    });

    const nextRuns = getProjectImageGenerationRuns(project).map((run) => {
      if (run.image_run_id !== runRecord.image_run_id) return run;
      return Object.assign({}, run, {
        status: "completed",
        variant_count: recordedVariants.length,
        completed_at: run.completed_at || timestamp,
        updated_at: timestamp,
      });
    });
    const promptRecords = getProjectPromptRecords(project).map((record) => {
      if (!completedPromptIds.has(record.prompt_id)) return record;
      return Object.assign({}, record, {
        image_generation_state: "generated",
        image_generation_completed_at: timestamp,
        updated_at: timestamp,
      });
    });

    await updateActiveProject({
      image_generation_runs: nextRuns,
      image_variants: nextVariants,
      prompt_records: promptRecords,
    });

    return {
      image_run_id: runRecord.image_run_id,
      variant_count: recordedVariants.length,
      variants: recordedVariants,
    };
  }

  async function createOrUpdateVideoDraft(promptId) {
    const project = studioState.activeProject;
    if (!project) {
      throw new Error("No active Project selected.");
    }

    const promptKey = String(promptId || "").trim();
    const promptRecords = getProjectPromptRecords(project);
    const promptRecord = promptRecords.find((record) => record.prompt_id === promptKey);
    if (!promptRecord) {
      throw new Error(`Prompt Record not found: ${promptKey}.`);
    }
    if (!getPromptAnimationPrompt(promptRecord)) {
      throw new Error("Animation prompt is required for a Video Draft.");
    }

    const selectedVariant = getSelectedVariantForPrompt(project, promptRecord);
    if (!selectedVariant) {
      throw new Error("Select an Image Variant before creating a Video Draft.");
    }
    if (isVariantMissingLocalFile(selectedVariant)) {
      throw new Error("Repair the selected image file before creating a Video Draft.");
    }

    const timestamp = new Date().toISOString();
    const videoJobs = getProjectVideoJobs(project);
    const existingJob =
      videoJobs.find((job) => {
        if (String(job.prompt_id || "").trim() !== promptKey) return false;
        const status = normalizeVideoJobStatus(job);
        return status === "draft" || status === "ready" || status === "needs_review";
      }) || null;
    const nextJob = buildVideoJobRecord(
      project,
      promptRecord,
      selectedVariant,
      existingJob,
      timestamp,
      "draft",
    );
    const nextVideoJobs = existingJob
      ? videoJobs.map((job) => (job.job_id === existingJob.job_id ? nextJob : job))
      : videoJobs.concat(nextJob);

    await updateActiveProject({ video_jobs: nextVideoJobs });
    return nextJob;
  }

  async function addVideoDraftToQueue(jobId) {
    const project = studioState.activeProject;
    if (!project) {
      throw new Error("No active Project selected.");
    }

    const jobKey = String(jobId || "").trim();
    const videoJobs = getProjectVideoJobs(project);
    const targetJob = videoJobs.find((job) => job.job_id === jobKey);
    if (!targetJob) {
      throw new Error(`Video Draft not found: ${jobKey}.`);
    }

    const status = normalizeVideoJobStatus(targetJob);
    if (status === "running" || status === "complete") {
      throw new Error("Running or complete video jobs are protected.");
    }

    const promptRecord = getProjectPromptRecords(project).find(
      (record) => record.prompt_id === targetJob.prompt_id,
    );
    const selectedVariant = getSelectedVariantForPrompt(project, promptRecord);
    const reviewReason = getVideoJobReviewReason(targetJob, promptRecord, selectedVariant);
    const timestamp = new Date().toISOString();

    if (reviewReason) {
      const reviewedJobs = videoJobs.map((job) => {
        if (job.job_id !== targetJob.job_id) return job;
        return Object.assign({}, job, {
          status: "needs_review",
          needs_review_reason: reviewReason,
          pending_selected_variant_id: selectedVariant?.variant_id || "",
          pending_selected_generated_file_name: selectedVariant?.generated_file_name || "",
          updated_at: timestamp,
        });
      });
      await updateActiveProject({ video_jobs: reviewedJobs });
      throw new Error(reviewReason);
    }

    const queuedJobs = videoJobs.map((job) => {
      if (job.job_id !== targetJob.job_id) return job;
      return Object.assign({}, job, {
        status: "ready",
        queue_order: job.queue_order || getNextVideoQueueOrder(videoJobs),
        queued_at: timestamp,
        needs_review_reason: "",
        updated_at: timestamp,
      });
    });

    await updateActiveProject({ video_jobs: queuedJobs });
    return queuedJobs.find((job) => job.job_id === jobKey);
  }

  async function holdVideoJob(jobId) {
    const project = studioState.activeProject;
    if (!project) {
      throw new Error("No active Project selected.");
    }

    const jobKey = String(jobId || "").trim();
    const videoJobs = getProjectVideoJobs(project);
    const targetJob = videoJobs.find((job) => job.job_id === jobKey);
    if (!targetJob) {
      throw new Error(`Video job not found: ${jobKey}.`);
    }

    const status = normalizeVideoJobStatus(targetJob);
    if (status === "running" || status === "complete") {
      throw new Error("Running or complete video jobs are protected.");
    }

    const timestamp = new Date().toISOString();
    const nextJobs = videoJobs.map((job) => {
      if (job.job_id !== jobKey) return job;
      return Object.assign({}, job, {
        status: "draft",
        queue_order: 0,
        queued_at: "",
        hold_reason: "Held before run.",
        updated_at: timestamp,
      });
    });

    await updateActiveProject({ video_jobs: nextJobs });
    return nextJobs.find((job) => job.job_id === jobKey);
  }

  async function removeVideoJob(jobId) {
    const project = studioState.activeProject;
    if (!project) {
      throw new Error("No active Project selected.");
    }

    const jobKey = String(jobId || "").trim();
    const videoJobs = getProjectVideoJobs(project);
    const targetJob = videoJobs.find((job) => job.job_id === jobKey);
    if (!targetJob) {
      throw new Error(`Video job not found: ${jobKey}.`);
    }

    const status = normalizeVideoJobStatus(targetJob);
    if (status === "running" || status === "complete") {
      throw new Error("Running or complete video jobs are protected.");
    }

    await updateActiveProject({
      video_jobs: videoJobs.filter((job) => job.job_id !== jobKey),
    });
    return { job_id: jobKey };
  }

  async function moveVideoJob(jobId, direction) {
    const project = studioState.activeProject;
    if (!project) {
      throw new Error("No active Project selected.");
    }

    const jobKey = String(jobId || "").trim();
    const step = direction === "down" ? 1 : -1;
    const videoJobs = getProjectVideoJobs(project);
    const readyJobs = videoJobs
      .filter((job) => normalizeVideoJobStatus(job) === "ready")
      .slice()
      .sort((left, right) => Number(left.queue_order || 0) - Number(right.queue_order || 0));
    const index = readyJobs.findIndex((job) => job.job_id === jobKey);
    if (index < 0) {
      throw new Error(`Ready video job not found: ${jobKey}.`);
    }

    const nextIndex = index + step;
    if (nextIndex < 0 || nextIndex >= readyJobs.length) {
      return readyJobs[index];
    }

    const moved = readyJobs.slice();
    const currentJob = moved[index];
    moved[index] = moved[nextIndex];
    moved[nextIndex] = currentJob;

    const timestamp = new Date().toISOString();
    const orderByJobId = new Map(
      moved.map((job, orderIndex) => [job.job_id, orderIndex + 1]),
    );
    const nextJobs = videoJobs.map((job) => {
      if (!orderByJobId.has(job.job_id)) return job;
      return Object.assign({}, job, {
        queue_order: orderByJobId.get(job.job_id),
        updated_at: timestamp,
      });
    });

    await updateActiveProject({ video_jobs: nextJobs });
    return nextJobs.find((job) => job.job_id === jobKey);
  }

  async function runVideoJob(jobId) {
    const project = studioState.activeProject;
    if (!project) {
      throw new Error("No active Project selected.");
    }

    const jobKey = String(jobId || "").trim();
    const videoJobs = getProjectVideoJobs(project);
    const targetJob = videoJobs.find((job) => job.job_id === jobKey);
    if (!targetJob) {
      throw new Error(`Video job not found: ${jobKey}.`);
    }

    const status = normalizeVideoJobStatus(targetJob);
    if (status !== "ready" && status !== "failed") {
      throw new Error("Only Ready or Failed video jobs can run.");
    }

    const promptRecord = getProjectPromptRecords(project).find(
      (record) => record.prompt_id === targetJob.prompt_id,
    );
    const selectedVariant = getSelectedVariantForPrompt(project, promptRecord);
    const reviewReason = getVideoJobReviewReason(targetJob, promptRecord, selectedVariant);
    if (reviewReason) {
      await updateActiveProject({
        video_jobs: videoJobs.map((job) =>
          job.job_id === jobKey
            ? Object.assign({}, job, {
                status: "needs_review",
                needs_review_reason: reviewReason,
                updated_at: new Date().toISOString(),
              })
            : job,
        ),
      });
      throw new Error(reviewReason);
    }

    const mediaId = getVariantMediaId(selectedVariant);
    if (!mediaId) {
      const message = "Selected image has no Flow media ID for start-frame video.";
      await updateActiveProject({
        video_jobs: videoJobs.map((job) =>
          job.job_id === jobKey
            ? Object.assign({}, job, {
                status: "needs_review",
                needs_review_reason: message,
                updated_at: new Date().toISOString(),
              })
            : job,
        ),
      });
      throw new Error(message);
    }

    const runtime = root.chrome?.runtime;
    if (!runtime || typeof runtime.sendMessage !== "function") {
      throw new Error("Chrome runtime messaging unavailable.");
    }

    const timestamp = new Date().toISOString();
    const folder = project.display_name || project.name || "autoflow-project-videos";
    const settings = Object.assign({}, project.settings || {}, {
      mode: "video",
      folder,
      videoMode: "start_frame",
      referenceMode: "mapped",
      perPromptStartFrames: { 0: mediaId },
      videoCount: 1,
      videoQuality: project.settings?.videoQuality || "lite",
      videoRatio: project.settings?.videoRatio || "landscape",
      videoDuration: project.settings?.videoDuration || 8,
      autoDownloadImages: false,
      autoDownloadVideos: true,
      videoDownloadQuality: project.settings?.videoDownloadQuality || "standard",
      projectName: project.display_name || project.name || "AutoFlow Project",
      projectFolder: folder,
      batchKind: "project_video_job",
      speedMode: project.settings?.speedMode || "fast",
    });

    const response = await runtime.sendMessage({
      type: "START_BATCH",
      batchId: targetJob.job_id,
      prompts: [targetJob.animation_prompt || getPromptAnimationPrompt(promptRecord)],
      promptIndexMap: [0],
      settings,
      featureFlags: {},
      uploadsThisSession: [],
    });

    if (response && response.ok === false) {
      throw new Error(response.error || "Video generation did not start.");
    }

    const nextJobs = videoJobs.map((job) => {
      if (job.job_id !== jobKey) return job;
      return Object.assign({}, job, {
        status: "running",
        run_batch_id: targetJob.job_id,
        run_prompt_index: 0,
        run_started_at: timestamp,
        error_message: "",
        updated_at: timestamp,
      });
    });

    await updateActiveProject({ video_jobs: nextJobs });
    return nextJobs.find((job) => job.job_id === jobKey);
  }

  async function stopVideoJob(jobId) {
    const project = studioState.activeProject;
    if (!project) {
      throw new Error("No active Project selected.");
    }

    const jobKey = String(jobId || "").trim();
    const videoJobs = getProjectVideoJobs(project);
    const targetJob = videoJobs.find((job) => job.job_id === jobKey);
    if (!targetJob) {
      throw new Error(`Video job not found: ${jobKey}.`);
    }
    if (normalizeVideoJobStatus(targetJob) !== "running") {
      throw new Error("Only Running video jobs can be stopped.");
    }

    await root.chrome?.runtime?.sendMessage?.({ type: "STOP_BATCH" });
    const timestamp = new Date().toISOString();
    const nextJobs = videoJobs.map((job) => {
      if (job.job_id !== jobKey) return job;
      return Object.assign({}, job, {
        status: "failed",
        error_message: "Stopped by user.",
        stopped_at: timestamp,
        updated_at: timestamp,
      });
    });
    await updateActiveProject({ video_jobs: nextJobs });
    return nextJobs.find((job) => job.job_id === jobKey);
  }

  async function handleVideoRuntimeMessage(message) {
    if (!message || message.type !== "FROM_BACKGROUND" || !message.uiBatchId) {
      return false;
    }

    const project = studioState.activeProject;
    if (!project) return false;

    const batchId = String(message.uiBatchId || "").trim();
    const videoJobs = getProjectVideoJobs(project);
    const targetJob = videoJobs.find(
      (job) => job.job_id === batchId || job.run_batch_id === batchId,
    );
    if (!targetJob) return false;

    const timestamp = new Date().toISOString();
    let nextJob = null;
    if (message.subType === "PREVIEW_READY" && message.mediaType === "video") {
      nextJob = Object.assign({}, targetJob, {
        status: "complete",
        output_media_id: message.mediaId || "",
        video_url: message.videoUrl || "",
        workflow_id: message.workflowId || targetJob.workflow_id || "",
        output_file_name: message.fileName || targetJob.expected_output_file_name || "",
        completed_at: timestamp,
        error_message: "",
        updated_at: timestamp,
      });
    } else if (message.subType === "PROMPT_STATUS") {
      if (message.status === "running") {
        nextJob = Object.assign({}, targetJob, {
          status: "running",
          error_message: "",
          updated_at: timestamp,
        });
      } else if (message.status === "failed") {
        nextJob = Object.assign({}, targetJob, {
          status: "failed",
          error_message: message.error || "Video generation failed.",
          updated_at: timestamp,
        });
      } else if (message.status === "submitted") {
        nextJob = Object.assign({}, targetJob, {
          status: "complete",
          completed_at: targetJob.completed_at || timestamp,
          updated_at: timestamp,
        });
      }
    }

    if (!nextJob) return false;
    await updateActiveProject({
      video_jobs: videoJobs.map((job) => (job.job_id === targetJob.job_id ? nextJob : job)),
    });
    return true;
  }

  async function selectImageVariant(promptId, variantId) {
    const activeProject = studioState.activeProject;
    if (!activeProject) {
      throw new Error("No active Project selected.");
    }

    const project = Object(activeProject);
    const promptKey = String(promptId || "").trim();
    const variantKey = String(variantId || "").trim();
    if (!promptKey || !variantKey) {
      throw new Error("Prompt and variant are required for selection.");
    }

    const variants = getProjectImageVariants(project);
    const selectedVariant = variants.find((variant) => variant.variant_id === variantKey);
    if (!selectedVariant) {
      throw new Error(`Image Variant not found: ${variantKey}.`);
    }
    if (selectedVariant.prompt_id !== promptKey) {
      throw new Error("Image Variant belongs to a different Prompt Record.");
    }

    const promptRecords = getProjectPromptRecords(project);
    const promptExists = promptRecords.some((record) => record.prompt_id === promptKey);
    if (!promptExists) {
      throw new Error(`Prompt Record not found: ${promptKey}.`);
    }

    const timestamp = new Date().toISOString();
    const nextPromptRecords = promptRecords.map((record) => {
      if (record.prompt_id !== promptKey) return record;
      return Object.assign({}, record, {
        selected_variant_id: selectedVariant.variant_id,
        selected_variant_file_name: selectedVariant.expected_file_name || record.file_name || "",
        selected_variant_generated_file_name: selectedVariant.generated_file_name || "",
        selected_variant_selected_at: timestamp,
        updated_at: timestamp,
      });
    });
    const nextVariants = variants.map((variant) => {
      if (variant.prompt_id !== promptKey) return variant;
      const isSelected = variant.variant_id === variantKey;
      return Object.assign({}, variant, {
        is_selected: isSelected,
        selected_at: isSelected ? timestamp : null,
        updated_at: timestamp,
      });
    });
    const nextVideoJobs = reconcileVideoJobsForSelectionChange(
      getProjectVideoJobs(project),
      promptKey,
      selectedVariant,
      timestamp,
    );

    await updateActiveProject({
      prompt_records: nextPromptRecords,
      image_variants: nextVariants,
      video_jobs: nextVideoJobs,
    });

    return {
      prompt_id: promptKey,
      variant_id: variantKey,
      generated_file_name: selectedVariant.generated_file_name || "",
    };
  }

  root.TFProjectStudioState = Object.freeze({
    $,
    $all,
    ASSET_TYPES,
    VIEWS,
    addAssetFiles,
    addVideoDraftToQueue,
    createOrUpdateVideoDraft,
    createAsset,
    formatDate,
    getAssetTypeDefinition,
    getCounts,
    getFilteredAssets,
    getImageGenerationGate,
    getProjectImageGenerationRuns,
    getProjectImageVariants,
    getProjectPromptImports,
    getProjectPromptRecords,
    getProjectVideoJobs,
    getVideoQueueItems,
    getActiveAssets(project) {
      return getProjectAssets(project).filter(isAssetActive);
    },
    getReadyPromptRecords(project) {
      return getProjectPromptRecords(project).filter((record) => {
        return record.status === "ready" && record.can_generate_images !== false;
      });
    },
    getState() {
      return studioState;
    },
    getViewDefinition,
    handleVideoRuntimeMessage,
    importProjectPromptJson,
    loadProjectState,
    mapPromptReferenceToAsset,
    holdVideoJob,
    moveVideoJob,
    removeVideoJob,
    recordImageGenerationRunVariants,
    readTextFile,
    resolveActiveProjectPromptReferences,
    buildImageVariantFileName,
    selectImageVariant,
    startImageGenerationRun,
    runVideoJob,
    stopVideoJob,
    setActiveProject,
    setAssetDisabled,
    setAssetFilter,
    setActiveView,
    setPrimaryAssetFile,
    updateAsset,
    updateActiveProject,
  });
})(globalThis);
