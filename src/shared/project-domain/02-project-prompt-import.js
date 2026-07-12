(function initTFProjectPromptImport(root) {
  "use strict";

  function isObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function getDomain() {
    return root.TFProjectDomain || null;
  }

  function getContract() {
    return root.TFProjectJsonContract || null;
  }

  function getProjectAssets(project) {
    return Array.isArray(project?.assets) ? project.assets.filter(isObject) : [];
  }

  function safeAssetName(value) {
    return String(value || "").trim() || "Untitled Asset";
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
    const lookupValues = getLookupValues(reference?.name);
    if (!lookupValues.length) return [];

    return assets.filter((asset) => {
      if (!isAssetActive(asset)) return false;
      const assetValues = getAssetLookupValues(asset);
      return lookupValues.some((lookup) => assetValues.indexOf(lookup) >= 0);
    });
  }

  function resolvePromptReference(reference, assets) {
    const source = isObject(reference) ? reference : {};
    const base = {
      name: String(source.name || "").trim(),
      type: String(source.type || "").trim().toLowerCase(),
      required: source.required !== false,
    };
    const manualAssetId = String(
      source.manual_asset_id || (source.resolution_source === "manual" ? source.asset_id : ""),
    ).trim();

    if (manualAssetId) {
      const manualAsset = getAssetById(assets, manualAssetId);
      const active = isAssetActive(manualAsset);
      if (manualAsset && active) {
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
        resolution_error: manualAsset ? "asset_disabled" : "asset_not_found",
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
      references: references.map((reference) => ({
        name: reference?.name || "",
        type: reference?.type || "",
        required: reference?.required !== false,
        manual_asset_id: reference?.manual_asset_id || "",
        asset_id: reference?.asset_id || "",
        resolution_status: reference?.resolution_status || "",
        resolution_source: reference?.resolution_source || "",
        resolution_error: reference?.resolution_error || "",
      })),
      blocked_references: blockedReferences.map((reference) => ({
        name: reference?.name || "",
        type: reference?.type || "",
        reference_index: reference?.reference_index,
        reason: reference?.reason || "",
        candidate_asset_ids: Array.isArray(reference?.candidate_asset_ids)
          ? reference.candidate_asset_ids.slice()
          : [],
      })),
    });
  }

  function resolvePromptRecord(record, assets, timestamp) {
    const references = Array.isArray(record?.references)
      ? record.references.filter(isObject).map((reference) => resolvePromptReference(reference, assets))
      : [];
    const blockedReferences = getBlockedReferences(references);
    const resolvedRecord = Object.assign({}, record, {
      references,
      blocked_references: blockedReferences,
      reference_resolution: {
        resolved_count: references.filter(
          (reference) => reference.resolution_status === "resolved",
        ).length,
        blocked_count: blockedReferences.length,
        unresolved_count: references.filter(
          (reference) =>
            reference.resolution_status === "missing" ||
            reference.resolution_status === "ambiguous",
        ).length,
        resolved_at: timestamp,
      },
      status: blockedReferences.length ? "blocked" : "ready",
      can_generate_images: blockedReferences.length === 0,
      updated_at: timestamp,
    });
    return getPromptResolutionSignature(record) === getPromptResolutionSignature(resolvedRecord)
      ? record
      : resolvedRecord;
  }

  function resolvePromptRecordsForProject(project, records) {
    const timestamp = new Date().toISOString();
    const assets = getProjectAssets(project);
    return (Array.isArray(records) ? records : []).map((record) =>
      resolvePromptRecord(record, assets, timestamp),
    );
  }

  function summarizePromptResolution(records) {
    const list = Array.isArray(records) ? records : [];
    return {
      ready_count: list.filter((record) => record.status === "ready").length,
      blocked_count: list.filter((record) => record.status === "blocked").length,
      needs_resolution_count: list.filter(
        (record) => record.status === "needs_resolution",
      ).length,
      record_count: list.length,
    };
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

  function createImportError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  async function importPromptJson(input, options) {
    const domain = getDomain();
    const contract = getContract();
    if (!domain || typeof domain.load !== "function" || typeof domain.appendPromptImport !== "function") {
      throw createImportError("PROJECT_DOMAIN_UNAVAILABLE", "Channel storage API unavailable.");
    }
    if (!contract || typeof contract.parsePromptJson !== "function") {
      throw createImportError("PROJECT_JSON_CONTRACT_UNAVAILABLE", "Channel JSON contract API unavailable.");
    }

    const parsed = contract.parsePromptJson(input);
    if (!parsed?.ok) {
      const errors = Array.isArray(parsed?.errors) ? parsed.errors.filter(Boolean) : [];
      throw createImportError(
        "PROJECT_JSON_INVALID",
        errors.join(" ") || "Channel prompt JSON import failed.",
      );
    }

    const state = await domain.load();
    const requestedProjectId = String(options?.projectId || "").trim();
    const projectId = requestedProjectId || String(state?.active_project_id || "").trim();
    const project = Array.isArray(state?.projects)
      ? state.projects.find((item) => item.project_id === projectId)
      : null;
    if (!project) {
      throw createImportError(
        "PROJECT_NOT_FOUND",
      `Channel not found: ${projectId || "(no active Channel)"}`,
      );
    }

    const timestamp = new Date().toISOString();
    const importId = domain.createId("prompt_import");
    const sourceName = String(options?.sourceName || "Channel prompt JSON").trim();
    const importedRecords = parsed.records.map((record, index) => ({
      prompt_id: domain.createId("prompt"),
      file_name: record.file_name,
      image_prompt: record.image_prompt,
      animation_prompt: record.animation_prompt || "",
      references: Array.isArray(record.references)
        ? record.references.filter(isObject).map((reference) => Object.assign({}, reference))
        : [],
      raw_reference_names: getRawReferenceNames(record),
      status: "imported",
      can_generate_images: false,
      source: {
        import_id: importId,
        source_name: sourceName,
        source_index: index,
        imported_at: timestamp,
      },
      created_at: timestamp,
      updated_at: timestamp,
    }));
    const records = resolvePromptRecordsForProject(project, importedRecords);
    const summary = summarizePromptResolution(records);
    const warnings = Array.isArray(parsed.warnings) ? parsed.warnings.slice() : [];
    const importRecord = {
      import_id: importId,
      source_name: sourceName,
      imported_at: timestamp,
      record_count: summary.record_count,
      ready_count: summary.ready_count,
      blocked_count: summary.blocked_count,
      needs_resolution_count: summary.needs_resolution_count,
      warning_count: warnings.length,
      warnings,
      contract_version: parsed.meta?.contract_version || contract.CONTRACT_VERSION || 1,
    };
    const persisted = await domain.appendPromptImport(projectId, records, importRecord);
    if (!persisted?.ok) {
      throw createImportError(
        persisted?.error?.code || "PROJECT_IMPORT_WRITE_FAILED",
        persisted?.error?.message || "Channel prompt JSON could not be saved.",
      );
    }

    return {
      state: persisted.state,
      project: persisted.project,
      import_record: importRecord,
      records,
      summary,
      warnings: warnings.slice(),
    };
  }

  root.TFProjectPromptImport = Object.freeze({
    importPromptJson,
    resolvePromptRecord,
    resolvePromptRecordsForProject,
    resolvePromptReference,
    summarizePromptResolution,
  });
})(globalThis);
