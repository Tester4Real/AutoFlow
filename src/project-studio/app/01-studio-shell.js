// AutoFlow Project Studio shard: shell rendering and navigation.
// Loaded by src/project-studio/index.html after studio state helpers.
(function initTFProjectStudioShell(root) {
  "use strict";

  const stateApi = root.TFProjectStudioState;

  if (!stateApi) {
    root.TFProjectStudioShell = Object.freeze({
      boot() {},
    });
    return;
  }

  const VIEW_METRICS = {
    project: [
      ["Projects", "projects"],
      ["Assets", "assets"],
      ["Blocked", "blocked"],
    ],
    assets: [
      ["Assets", "assets"],
      ["Characters / Places", "assets"],
      ["Gallery Items", "gallery"],
    ],
    import: [
      ["Prompts", "prompts"],
      ["Blocked", "blocked"],
      ["Assets", "assets"],
    ],
    images: [
      ["Image Variants", "images"],
      ["Selected Finals", "gallery"],
      ["Blocked", "blocked"],
    ],
    video: [
      ["Video Jobs", "videoJobs"],
      ["Ready Outputs", "gallery"],
      ["Blocked", "blocked"],
    ],
    gallery: [
      ["Gallery Items", "gallery"],
      ["Image Variants", "images"],
      ["Video Jobs", "videoJobs"],
    ],
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getProjectName(project) {
    return project?.display_name || project?.name || "No project selected";
  }

  function getAssetName(asset) {
    return asset?.display_name || asset?.name || "Untitled Asset";
  }

  function getActiveAssets(project) {
    if (typeof stateApi.getActiveAssets === "function") {
      return stateApi.getActiveAssets(project);
    }
    return Array.isArray(project?.assets)
      ? project.assets.filter((asset) => !asset?.disabled && asset?.lifecycle_status !== "disabled")
      : [];
  }

  function getAssetState(asset) {
    if (asset?.disabled || asset?.lifecycle_status === "disabled") {
      return { label: "Disabled", tone: "danger" };
    }
    const fileCount = Array.isArray(asset?.files) ? asset.files.length : 0;
    const usageCount = Number(asset?.usage_count || asset?.usageCount || 0);
    if (asset?.flow_upload_state === "stale" || asset?.flowUploadState === "stale") {
      return { label: "Stale Flow upload", tone: "danger" };
    }
    if (fileCount === 0) return { label: "No files", tone: "warning" };
    if (usageCount > 0) return { label: "In use", tone: "info" };
    return { label: "Complete", tone: "success" };
  }

  function getAssetDependencySummary(asset) {
    const prompts = Number(
      asset?.usage_count || asset?.prompt_usage_count || asset?.promptUsageCount || 0,
    );
    const jobs = Number(asset?.job_usage_count || asset?.jobUsageCount || 0);
    return { jobs, prompts };
  }

  function getPromptStatus(record) {
    if (record?.image_generation_state === "generating") {
      return { label: "Generating", tone: "info" };
    }
    if (record?.status === "ready") return { label: "Ready", tone: "success" };
    if (record?.status === "needs_resolution") {
      return { label: "Needs resolution", tone: "warning" };
    }
    if (record?.status === "blocked") return { label: "Blocked", tone: "danger" };
    return { label: record?.status || "Imported", tone: "info" };
  }

  function getPromptReferences(record) {
    const rawNames = Array.isArray(record?.raw_reference_names) ? record.raw_reference_names : [];
    if (rawNames.length) return rawNames;
    return Array.isArray(record?.references)
      ? record.references.map((reference) => reference?.name).filter(Boolean)
      : [];
  }

  function getPromptResolutionText(record) {
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

    const references = Array.isArray(record?.references) ? record.references : [];
    if (!references.length) return "No references";

    const resolved = references.filter(
      (reference) => reference?.resolution_status === "resolved" && reference.asset_id,
    );
    if (resolved.length === references.length) {
      return `Resolved ${resolved.length}/${references.length}`;
    }

    return `Resolved ${resolved.length}/${references.length}`;
  }

  function getBlockedReasonLabel(reason) {
    if (reason === "ambiguous") return "Ambiguous";
    if (reason === "type_mismatch") return "Type mismatch";
    if (reason === "asset_disabled") return "Asset disabled";
    if (reason === "asset_not_found") return "Asset unavailable";
    return "Missing";
  }

  function renderAssetOptions(assets, reference) {
    const referenceType = String(reference?.type || "").trim().toLowerCase();
    const compatibleAssets = referenceType
      ? assets.filter((asset) => asset.type === referenceType)
      : assets.slice();

    if (!compatibleAssets.length) {
      return '<option value="">No compatible Assets</option>';
    }

    return ['<option value="">Choose Asset</option>']
      .concat(
        compatibleAssets.map((asset) => {
          const label = `${getAssetName(asset)} (${asset.type || "reference"})`;
          return `<option value="${escapeHtml(asset.asset_id)}">${escapeHtml(label)}</option>`;
        }),
      )
      .join("");
  }

  function renderBlockedReferenceActions(record, assets) {
    const blocked = Array.isArray(record?.blocked_references) ? record.blocked_references : [];
    if (!blocked.length) return "";

    return `<div class="prompt-map-panel" data-prompt-id="${escapeHtml(
      record.prompt_id,
    )}">${blocked
      .map((reference) => {
        const name = reference.name || "unnamed";
        const reason = getBlockedReasonLabel(reference.reason);
        const type = reference.type ? ` (${reference.type})` : "";
        const options = renderAssetOptions(assets, reference);
        const disabled = options.indexOf("No compatible Assets") >= 0;
        return `<div class="prompt-map-row" data-reference-index="${escapeHtml(
          reference.reference_index,
        )}"><span class="prompt-map-reason">${escapeHtml(
          `${reason}: ${name}${type}`,
        )}</span><select class="compact-select reference-map-select" aria-label="Map reference ${escapeHtml(
          name,
        )}">${options}</select><button class="secondary-button reference-map-button" type="button"${
          disabled ? " disabled" : ""
        }>Map</button></div>`;
      })
      .join("")}</div>`;
  }

  function renderProjectPicker() {
    const picker = stateApi.$("#project-picker");
    const current = stateApi.getState();
    const projects = Array.isArray(current.domainState?.projects)
      ? current.domainState.projects
      : [];

    if (!picker) return;

    if (!projects.length) {
      picker.innerHTML = '<option value="">No project</option>';
      picker.disabled = true;
      return;
    }

    picker.disabled = false;
    picker.innerHTML = projects
      .map((project) => {
        const id = escapeHtml(project.project_id);
        const name = escapeHtml(getProjectName(project));
        return `<option value="${id}">${name}</option>`;
      })
      .join("");

    picker.value = current.activeProject?.project_id || "";
  }

  function renderTopbar() {
    const current = stateApi.getState();
    const readout = stateApi.$("#active-project-readout");
    if (!readout) return;

    if (!current.activeProject) {
      readout.textContent = "No project selected";
      return;
    }

    readout.textContent = current.activeProject.project_id;
  }

  function renderNav() {
    const current = stateApi.getState();
    stateApi.$all(".nav-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.view === current.activeView);
    });
  }

  function renderMetricGrid(viewId, counts) {
    const metrics = VIEW_METRICS[viewId] || VIEW_METRICS.project;
    return `<div class="metric-grid">${metrics
      .map(([label, key]) => {
        return `<div class="metric-tile"><span class="metric-label">${escapeHtml(
          label,
        )}</span><span class="metric-value">${escapeHtml(counts[key] || 0)}</span></div>`;
      })
      .join("")}</div>`;
  }

  function renderProjectFacts(project, domainState) {
    if (!project) return "";

    const facts = [
      ["Project name", getProjectName(project)],
      ["Project ID", project.project_id],
      ["Created", stateApi.formatDate(project.created_at)],
      ["Updated", stateApi.formatDate(project.updated_at)],
      ["Schema", `v${domainState?.schema_version || "?"}`],
      ["Storage", domainState?.meta?.storage_key || root.TFProjectDomain?.STORAGE_KEY || "unknown"],
    ];

    return `<section class="section-band"><h3>Project Facts</h3><dl class="facts-list">${facts
      .map(([label, value]) => {
        return `<div class="fact-row"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(
          value,
        )}</dd></div>`;
      })
      .join("")}</dl></section>`;
  }

  function renderProjectSettingsForm(project) {
    if (!project) return "";

    return `<section class="section-band project-settings-panel"><div class="section-title-row"><h3>Project Settings</h3><span id="project-settings-status" class="form-status" aria-live="polite"></span></div><form id="project-settings-form" class="settings-form"><label class="field-label" for="project-display-name">Display name</label><div class="field-row"><input id="project-display-name" class="text-field" name="display_name" type="text" value="${escapeHtml(
      getProjectName(project),
    )}" autocomplete="off" /><button class="primary-button" type="submit">Save</button></div><div class="readonly-row"><span>Stable ID</span><code>${escapeHtml(
      project.project_id,
    )}</code></div></form></section>`;
  }

  function renderAssetCreateForm() {
    const typeOptions = stateApi.ASSET_TYPES.map((type) => {
      return `<option value="${escapeHtml(type.id)}">${escapeHtml(type.label)}</option>`;
    }).join("");

    return `<section class="section-band asset-create-panel"><div class="section-title-row"><h3>Add Asset</h3><span id="asset-manager-status" class="form-status" aria-live="polite"></span></div><form id="asset-create-form" class="asset-form"><select id="asset-type-input" class="compact-select" name="type" aria-label="Asset type">${typeOptions}</select><input id="asset-name-input" class="text-field" name="display_name" type="text" placeholder="Asset name" autocomplete="off" /><input id="asset-aliases-input" class="text-field" name="aliases" type="text" placeholder="Aliases, comma separated" autocomplete="off" /><button class="primary-button" type="submit">Add</button></form></section>`;
  }

  function renderAssetFilters() {
    const current = stateApi.getState();
    const filter = current.assetFilter || "all";
    const options = [{ id: "all", label: "All types" }].concat(stateApi.ASSET_TYPES);

    return `<div class="asset-toolbar"><label for="asset-type-filter">Filter</label><select id="asset-type-filter" class="compact-select" aria-label="Filter Assets by type">${options
      .map((type) => {
        const selected = type.id === filter ? " selected" : "";
        return `<option value="${escapeHtml(type.id)}"${selected}>${escapeHtml(
          type.label,
        )}</option>`;
      })
      .join("")}</select></div>`;
  }

  function getPrimaryAssetFileId(asset) {
    if (asset?.primary_file_id) return asset.primary_file_id;
    const primary = Array.isArray(asset?.files)
      ? asset.files.find((file) => file.is_primary || file.role === "primary")
      : null;
    return primary?.asset_file_id || "";
  }

  function renderAssetFilePanel(asset) {
    const files = Array.isArray(asset.files) ? asset.files : [];
    const primaryFileId = getPrimaryAssetFileId(asset);
    const fileRows = files.length
      ? files
          .map((file) => {
            const isPrimary = file.asset_file_id === primaryFileId || file.is_primary;
            const sizeKb = Math.max(1, Math.round(Number(file.size_bytes || 0) / 1024));
            return `<div class="asset-file-row"><span class="material-symbols-outlined">attach_file</span><span class="asset-file-name" title="${escapeHtml(
              file.file_name || "reference-file",
            )}">${escapeHtml(file.file_name || "reference-file")}</span><span>${escapeHtml(
              file.mime_type || "file",
            )}</span><span>${escapeHtml(sizeKb)} KB</span><span>${isPrimary ? '<span class="state-chip primary">Primary</span>' : ""}</span><button class="file-primary-button" type="button" data-asset-id="${escapeHtml(
              asset.asset_id,
            )}" data-file-id="${escapeHtml(file.asset_file_id)}"${
              isPrimary ? " disabled" : ""
            }>Make primary</button></div>`;
          })
          .join("")
      : '<div class="asset-file-empty">Upload reference files.</div>';

    return `<div class="asset-file-panel" data-asset-id="${escapeHtml(
      asset.asset_id,
    )}"><div class="asset-file-actions"><strong>Files</strong><label class="asset-upload-button"><span class="material-symbols-outlined">upload_file</span><span>Upload reference files</span><input class="asset-file-input" type="file" multiple data-asset-id="${escapeHtml(
      asset.asset_id,
    )}" /></label></div><div class="asset-file-list">${fileRows}</div></div>`;
  }

  function renderAssetEditPanel(asset) {
    const typeOptions = stateApi.ASSET_TYPES.map((type) => {
      const selected = type.id === asset.type ? " selected" : "";
      return `<option value="${escapeHtml(type.id)}"${selected}>${escapeHtml(type.label)}</option>`;
    }).join("");
    const aliases = Array.isArray(asset.aliases) ? asset.aliases.join(", ") : "";
    const dependencies = getAssetDependencySummary(asset);
    const disabled = asset?.disabled || asset?.lifecycle_status === "disabled";
    const dependencyText = `${dependencies.prompts} prompt${dependencies.prompts === 1 ? "" : "s"} · ${dependencies.jobs} job${dependencies.jobs === 1 ? "" : "s"}`;

    return `<div class="asset-edit-panel"><form class="asset-edit-form" data-asset-id="${escapeHtml(
      asset.asset_id,
    )}"><div class="asset-edit-grid"><label><span>Type</span><select class="compact-select" name="type">${typeOptions}</select></label><label><span>Name</span><input class="text-field" name="display_name" type="text" value="${escapeHtml(
      getAssetName(asset),
    )}" /></label><label><span>Aliases</span><input class="text-field" name="aliases" type="text" value="${escapeHtml(
      aliases,
    )}" placeholder="Aliases, comma separated" /></label><button class="primary-button" type="submit">Save</button></div><div class="asset-consequence"><span>Stable ID</span><code>${escapeHtml(
      asset.asset_id,
    )}</code><span>Dependencies</span><strong>${escapeHtml(
      dependencyText,
    )}</strong><span>Consequence</span><em>Renames keep dependencies linked by asset_id. Disable is reversible.</em></div></form><button class="asset-danger-button" type="button" data-asset-id="${escapeHtml(
      asset.asset_id,
    )}" data-next-disabled="${disabled ? "false" : "true"}">${disabled ? "Enable Asset" : "Disable Asset"}</button></div>`;
  }

  function renderAssetRows(assets) {
    if (!assets.length) {
      return '<div class="empty-inline">No Assets match this view.</div>';
    }

    function renderAssetRow(asset) {
        const type = stateApi.getAssetTypeDefinition(asset.type);
        const aliases = Array.isArray(asset.aliases) ? asset.aliases : [];
        const files = Array.isArray(asset.files) ? asset.files.length : 0;
        const usage = Number(asset.usage_count || asset.usageCount || 0);
        const state = getAssetState(asset);
        const disabledClass =
          asset?.disabled || asset?.lifecycle_status === "disabled" ? " disabled" : "";
        return `<div class="asset-row${disabledClass}" role="row" data-asset-id="${escapeHtml(
          asset.asset_id,
        )}"><span class="asset-type"><span class="material-symbols-outlined">${escapeHtml(
          type.icon,
        )}</span>${escapeHtml(type.label)}</span><span class="asset-name" title="${escapeHtml(
          getAssetName(asset),
        )}">${escapeHtml(getAssetName(asset))}</span><span class="alias-list">${aliases
          .map((alias) => `<span>${escapeHtml(alias)}</span>`)
          .join("") || '<span class="muted">None</span>'}</span><span>${escapeHtml(
          files,
        )}</span><span>${escapeHtml(usage)}</span><span><span class="state-chip ${escapeHtml(
          state.tone,
        )}">${escapeHtml(state.label)}</span></span></div>${renderAssetFilePanel(
          asset,
        )}${renderAssetEditPanel(asset)}`;
    }

    const currentFilter = stateApi.getState().assetFilter || "all";
    const groups =
      currentFilter === "all"
        ? stateApi.ASSET_TYPES.map((type) => {
            return {
              label: type.label,
              assets: assets.filter((asset) => asset.type === type.id),
            };
          }).filter((group) => group.assets.length)
        : [
            {
              label: stateApi.getAssetTypeDefinition(currentFilter).label,
              assets,
            },
          ];

    return `<div class="asset-table" role="table" aria-label="Project Assets"><div class="asset-row asset-head" role="row"><span>Type</span><span>Name</span><span>Aliases</span><span>Files</span><span>Used by</span><span>State</span></div>${groups
      .map((group) => {
        return `<div class="asset-group-row">${escapeHtml(group.label)} · ${escapeHtml(
          group.assets.length,
        )}</div>${group.assets.map(renderAssetRow).join("")}`;
      })
      .join("")}</div>`;
  }

  function renderAssetManager() {
    const current = stateApi.getState();
    const assets = stateApi.getFilteredAssets();
    const totalAssets = Array.isArray(current.activeProject?.assets)
      ? current.activeProject.assets.length
      : 0;

    return [
      renderAssetCreateForm(),
      `<section class="section-band"><div class="section-title-row"><h3>Asset Library</h3><span class="form-status">${escapeHtml(
        totalAssets,
      )} total</span></div>${renderAssetFilters()}${renderAssetRows(assets)}</section>`,
    ].join("");
  }

  function renderPromptImportPanel(project) {
    const imports = stateApi.getProjectPromptImports(project).slice().reverse();
    const hasPromptRecords = stateApi.getProjectPromptRecords(project).length > 0;
    const importRows = imports.length
      ? imports
          .slice(0, 8)
          .map((item) => {
            const warnings = Number(item.warning_count || 0);
            const blockedCount = Number(item.blocked_count || item.needs_resolution_count || 0);
            const summary = `${item.record_count || 0} record${
              item.record_count === 1 ? "" : "s"
            } - ${item.ready_count || 0} ready - ${blockedCount} blocked`;
            return `<div class="import-history-row"><span class="material-symbols-outlined">history</span><span class="import-source" title="${escapeHtml(
              item.source_name || "Project prompt JSON",
            )}">${escapeHtml(item.source_name || "Project prompt JSON")}</span><span>${escapeHtml(
              summary,
            )}</span><span>${escapeHtml(stateApi.formatDate(item.imported_at))}</span><span>${
              warnings
                ? `<span class="state-chip warning">${escapeHtml(warnings)} warning${
                    warnings === 1 ? "" : "s"
                  }</span>`
                : '<span class="state-chip success">Clean</span>'
            }</span></div>`;
          })
          .join("")
      : '<div class="empty-inline">No imports yet.</div>';

    return `<section class="section-band import-panel"><div class="section-title-row"><h3>Import Prompt JSON</h3><span id="prompt-import-status" class="form-status" aria-live="polite"></span></div><div class="import-actions"><label class="json-upload-button"><span class="material-symbols-outlined">upload_file</span><span>Import JSON</span><input id="prompt-json-input" type="file" accept=".json,application/json" /></label><button id="btn-resolve-prompts" class="secondary-button" type="button"${
      hasPromptRecords ? "" : " disabled"
    }><span class="material-symbols-outlined">rule_folder</span><span>Resolve References</span></button></div><div class="import-history">${importRows}</div></section>`;
  }

  function renderPromptRecordRows(records, assets) {
    if (!records.length) {
      return '<div class="empty-inline">No prompt records imported.</div>';
    }

    const statusOrder = ["blocked", "needs_resolution", "ready"];
    const labels = {
      blocked: "Blocked",
      needs_resolution: "Needs Resolution",
      ready: "Ready",
    };
    const grouped = statusOrder
      .map((status) => {
        return {
          status,
          label: labels[status] || status,
          records: records.filter((record) => record.status === status),
        };
      })
      .filter((group) => group.records.length);
    const otherRecords = records.filter((record) => statusOrder.indexOf(record.status) < 0);
    if (otherRecords.length) {
      grouped.push({ status: "other", label: "Other", records: otherRecords });
    }

    return `<div class="prompt-record-table" role="table" aria-label="Imported prompt records"><div class="prompt-record-row prompt-record-head" role="row"><span>Status</span><span>File</span><span>References</span><span>Resolution</span><span>Image Prompt</span></div>${grouped
      .map((group) => {
        return `<div class="prompt-group-row">${escapeHtml(group.label)} - ${escapeHtml(
          group.records.length,
        )}</div>${group.records
          .map((record) => {
            const status = getPromptStatus(record);
            const references = getPromptReferences(record);
            const referenceText = references.length ? references.join(", ") : "None";
            const resolutionText = getPromptResolutionText(record);
            return `<div class="prompt-record-row" role="row" data-prompt-id="${escapeHtml(
              record.prompt_id,
            )}"><span><span class="state-chip ${escapeHtml(status.tone)}">${escapeHtml(
              status.label,
            )}</span></span><span class="prompt-file-name" title="${escapeHtml(
              record.file_name,
            )}">${escapeHtml(record.file_name)}</span><span class="prompt-reference-list" title="${escapeHtml(
              referenceText,
            )}">${escapeHtml(referenceText)}</span><span class="prompt-resolution-text" title="${escapeHtml(
              resolutionText,
            )}">${escapeHtml(resolutionText)}</span><span class="prompt-text" title="${escapeHtml(
              record.image_prompt,
            )}">${escapeHtml(record.image_prompt)}</span></div>${renderBlockedReferenceActions(
              record,
              assets,
            )}`;
          })
          .join("")}`;
      })
      .join("")}</div>`;
  }

  function renderImportManager() {
    const current = stateApi.getState();
    const project = current.activeProject;
    const records = stateApi.getProjectPromptRecords(project);
    const assets = getActiveAssets(project);

    return [
      renderPromptImportPanel(project),
      `<section class="section-band"><div class="section-title-row"><h3>Prompt Records</h3><span class="form-status">${escapeHtml(
        records.length,
      )} total</span></div>${renderPromptRecordRows(records, assets)}</section>`,
    ].join("");
  }

  function getImageGateStatus(item) {
    if (item.state === "generating") return { label: "Generating", tone: "info" };
    if (item.can_generate) return { label: "Ready", tone: "success" };
    return { label: "Disabled", tone: "danger" };
  }

  function renderImageGateRows(gate) {
    if (!gate.items.length) {
      return '<div class="empty-inline">Import Prompt Records before preparing image generation.</div>';
    }

    return `<div class="image-gate-table" role="table" aria-label="Image generation readiness"><div class="image-gate-row image-gate-head" role="row"><span>Status</span><span>File</span><span>References</span><span>Reason</span></div>${gate.items
      .map((item) => {
        const state = getImageGateStatus(item);
        const referenceText = item.references.length
          ? item.references
              .map((reference) => `${reference.asset_name} / ${reference.file_name}`)
              .join(", ")
          : "None";
        const reason = item.disabled_reason || (item.can_generate ? "Included in next image run" : "");
        return `<div class="image-gate-row" role="row" data-prompt-id="${escapeHtml(
          item.prompt_id,
        )}"><span><span class="state-chip ${escapeHtml(state.tone)}">${escapeHtml(
          state.label,
        )}</span></span><span class="prompt-file-name" title="${escapeHtml(
          item.file_name,
        )}">${escapeHtml(item.file_name)}</span><span class="prompt-reference-list" title="${escapeHtml(
          referenceText,
        )}">${escapeHtml(referenceText)}</span><span class="prompt-resolution-text" title="${escapeHtml(
          reason,
        )}">${escapeHtml(reason)}</span></div>`;
      })
      .join("")}</div>`;
  }

  function getPromptReferenceChips(record) {
    const references = Array.isArray(record?.references) ? record.references : [];
    return references
      .filter((reference) => reference && reference.resolution_status === "resolved")
      .map((reference) => {
        const type = reference.type || reference.asset_type || "ref";
        const name = reference.name || reference.asset_name || reference.asset_id || "reference";
        return `${type}:${name}`;
      });
  }

  function getVariantPreviewUrl(variant) {
    return (
      variant?.thumbnail_url ||
      variant?.data_url ||
      variant?.preview_url ||
      variant?.fife_url ||
      ""
    );
  }

  function getVariantState(variant, selectedVariantId) {
    if (!variant) return { label: "Missing", tone: "warning" };
    const needsRepair = variant.file_state === "missing" || variant.status === "missing";
    if (selectedVariantId && variant.variant_id === selectedVariantId) {
      return needsRepair
        ? { label: "Selected - repair needed", tone: "warning" }
        : { label: "Selected", tone: "success" };
    }
    if (needsRepair) {
      return { label: "Repair needed", tone: "warning" };
    }
    if (variant.file_state === "failed" || variant.status === "failed") {
      return { label: "Failed", tone: "danger" };
    }
    return { label: "Available", tone: "info" };
  }

  function renderVariantSlot(variant, slotIndex, promptRecord, selectedVariantId) {
    const slotNumber = slotIndex + 1;
    const state = getVariantState(variant, selectedVariantId);
    const expectedFile = promptRecord?.file_name || variant?.expected_file_name || "image.png";
    const generatedFile =
      variant?.generated_file_name ||
      (typeof stateApi.buildImageVariantFileName === "function"
        ? stateApi.buildImageVariantFileName(expectedFile, slotIndex)
        : expectedFile);
    const previewUrl = getVariantPreviewUrl(variant);
    const selectedText = state.label === "Selected" ? "Selected" : "Not selected";
    const ariaLabel = `Variant ${slotNumber}, ${generatedFile}, ${selectedText}, ${state.label}`;

    return `<button class="variant-slot ${variant ? "" : "empty"} ${
      state.label.indexOf("Selected") === 0 ? "selected" : ""
    }" type="button" aria-label="${escapeHtml(ariaLabel)}" ${
      variant
        ? `data-prompt-id="${escapeHtml(promptRecord?.prompt_id || "")}" data-variant-id="${escapeHtml(
            variant.variant_id,
          )}"`
        : "disabled"
    }><span class="variant-preview-frame">${
      previewUrl
        ? `<img src="${escapeHtml(previewUrl)}" alt="" loading="lazy" />`
        : '<span class="material-symbols-outlined">image</span>'
    }</span><span class="variant-slot-footer"><strong>Variant ${escapeHtml(
      slotNumber,
    )}</strong><span class="variant-file-name" title="${escapeHtml(generatedFile)}">${escapeHtml(
      generatedFile,
    )}</span><span class="state-chip ${escapeHtml(state.tone)}">${escapeHtml(
      state.label,
    )}</span><span class="variant-action-label">${
      state.label.indexOf("Selected") === 0 ? "Selected" : "Select"
    }</span></span></button>`;
  }

  function renderImageReviewBoard(project) {
    const promptRecords = stateApi.getProjectPromptRecords(project);
    const variants =
      typeof stateApi.getProjectImageVariants === "function"
        ? stateApi.getProjectImageVariants(project)
        : [];
    const videoReadinessByPrompt = new Map(
      typeof stateApi.getVideoQueueItems === "function"
        ? stateApi.getVideoQueueItems(project).map((item) => [item.prompt_id, item])
        : [],
    );
    if (!variants.length) {
      return '<section class="section-band image-review-board"><div class="section-title-row"><h3>Image Review Board</h3><span class="form-status">0 variants</span></div><div class="empty-inline">No generated variants recorded yet.</div></section>';
    }

    const promptById = new Map(promptRecords.map((record) => [record.prompt_id, record]));
    const grouped = new Map();
    variants.forEach((variant) => {
      const promptId = variant.prompt_id || "";
      if (!grouped.has(promptId)) grouped.set(promptId, []);
      grouped.get(promptId).push(variant);
    });

    const rows = Array.from(grouped.entries())
      .map(([promptId, promptVariants]) => {
        const promptRecord =
          promptById.get(promptId) ||
          {
            prompt_id: promptId,
            file_name: promptVariants[0]?.expected_file_name || promptVariants[0]?.generated_file_name || "",
            image_prompt: "",
            references: [],
          };
        const sortedVariants = promptVariants
          .slice()
          .sort((left, right) => Number(left.variant_index || 0) - Number(right.variant_index || 0));
        const promptRecordId = promptRecord["prompt_id"] || promptId;
        const promptFileName = promptRecord["file_name"] || "Untitled prompt";
        const promptText = promptRecord["image_prompt"] || "No prompt text";
        const selectedVariantId =
          promptRecord["selected_variant_id"] || promptRecord["selectedVariantId"] || "";
        const chips = getPromptReferenceChips(promptRecord);
        const slotOne = sortedVariants.find((variant) => Number(variant.variant_index) === 0);
        const slotTwo = sortedVariants.find((variant) => Number(variant.variant_index) === 1);
        const overflowCount = Math.max(0, sortedVariants.length - 2);
        const selectedVariant = selectedVariantId
          ? sortedVariants.find((variant) => variant.variant_id === selectedVariantId)
          : null;
        const selectedNeedsRepair =
          selectedVariant &&
          (selectedVariant.file_state === "missing" || selectedVariant.status === "missing");
        const videoItem = videoReadinessByPrompt.get(promptRecordId);
        const videoReadiness = videoItem
          ? `Video: ${videoItem.status_label} - ${videoItem.reason || "Ready"}`
          : selectedVariantId
            ? selectedNeedsRepair
              ? "Video: selected image needs repair"
              : "Video: animation prompt missing"
            : "Video: waiting for selected image";

        return `<article class="image-review-row" data-prompt-id="${escapeHtml(
          promptRecordId,
        )}"><div class="image-review-meta"><div><h4 title="${escapeHtml(
          promptFileName,
        )}">${escapeHtml(promptFileName)}</h4><p title="${escapeHtml(promptText)}">${escapeHtml(
          promptText,
        )}</p></div><div class="reference-chip-list">${
          chips.length
            ? chips.map((chip) => `<span class="reference-chip">${escapeHtml(chip)}</span>`).join("")
            : '<span class="reference-chip muted">No refs</span>'
        }</div></div><div class="variant-slot-grid">${renderVariantSlot(
          slotOne,
          0,
          promptRecord,
          selectedVariantId,
        )}${renderVariantSlot(slotTwo, 1, promptRecord, selectedVariantId)}</div><div class="image-review-readiness"><span>${escapeHtml(
          videoReadiness,
        )}</span>${
          overflowCount
            ? `<span class="state-chip warning">${escapeHtml(overflowCount)} more</span>`
            : ""
        }</div></article>`;
      })
      .join("");

    return `<section class="section-band image-review-board"><div class="section-title-row"><h3>Image Review Board</h3><span class="form-status">${escapeHtml(
      variants.length,
    )} variant${variants.length === 1 ? "" : "s"}</span></div><div class="image-review-list">${rows}</div></section>`;
  }

  function renderVideoQueueBuilder() {
    const current = stateApi.getState();
    const project = current.activeProject;
    const items =
      typeof stateApi.getVideoQueueItems === "function" ? stateApi.getVideoQueueItems(project) : [];
    const readyCount = items.filter((item) => item.status === "ready").length;
    const draftCount = items.filter((item) => item.status === "draft").length;
    const reviewCount = items.filter((item) => item.status === "needs_review").length;

    if (!items.length) {
      return '<section class="section-band video-queue-builder"><div class="section-title-row"><h3>Video Queue Builder</h3><span id="video-queue-status" class="form-status">0 prompts</span></div><div class="empty-inline">Import Prompt Records before preparing video drafts.</div></section>';
    }

    const rows = items
      .map((item) => {
        const jobText = item.job_id ? item.job_id : "No draft";
        const queueText =
          item.status === "ready" && item.queue_order ? `Queue #${item.queue_order}` : jobText;
        const selectedText = item.selected_file_name || "No selected image";
        const draftDisabled = item.can_create_draft ? "" : "disabled";
        const queueDisabled = item.can_queue ? "" : "disabled";
        const holdDisabled = item.can_hold ? "" : "disabled";
        const removeDisabled = item.can_remove ? "" : "disabled";
        const moveDisabled = item.can_move ? "" : "disabled";
        const runDisabled = item.can_run || item.can_retry ? "" : "disabled";
        const stopDisabled = item.can_stop ? "" : "disabled";
        const draftLabel = item.create_label || "Create Draft";
        const queueLabel = item.status === "ready" ? "Ready" : "Add to Queue";
        const runLabel = item.can_retry ? "Retry" : "Run";
        return `<article class="video-queue-row" data-prompt-id="${escapeHtml(
          item.prompt_id,
        )}"><div class="video-queue-main"><span class="state-chip primary">Video</span><span class="state-chip ${escapeHtml(
          item.tone,
        )}">${escapeHtml(item.status_label)}</span><div><h4 title="${escapeHtml(
          item.file_name,
        )}">${escapeHtml(item.file_name || "Untitled prompt")}</h4><p title="${escapeHtml(
          item.animation_prompt || "No animation prompt",
        )}">${escapeHtml(item.animation_prompt || "No animation prompt")}</p></div></div><div class="video-queue-meta"><span>Selected image</span><strong title="${escapeHtml(
          selectedText,
        )}">${escapeHtml(selectedText)}</strong><code title="${escapeHtml(jobText)}">${escapeHtml(
          queueText,
        )}</code></div><div class="video-queue-reason" title="${escapeHtml(
          item.reason,
        )}">${escapeHtml(item.reason || "Ready")}</div><div class="video-queue-actions"><button class="secondary-button video-draft-button" type="button" data-prompt-id="${escapeHtml(
          item.prompt_id,
        )}" ${draftDisabled}>${escapeHtml(
          draftLabel,
        )}</button><button class="primary-button video-queue-button" type="button" data-job-id="${escapeHtml(
          item.job_id,
        )}" ${queueDisabled}>${escapeHtml(
          queueLabel,
        )}</button><button class="secondary-button video-move-button" type="button" data-direction="up" data-job-id="${escapeHtml(
          item.job_id,
        )}" ${moveDisabled}>Up</button><button class="secondary-button video-move-button" type="button" data-direction="down" data-job-id="${escapeHtml(
          item.job_id,
        )}" ${moveDisabled}>Down</button><button class="secondary-button video-hold-button" type="button" data-job-id="${escapeHtml(
          item.job_id,
        )}" ${holdDisabled}>Hold</button><button class="secondary-button video-remove-button" type="button" data-job-id="${escapeHtml(
          item.job_id,
        )}" ${removeDisabled}>Remove</button><button class="primary-button video-run-button" type="button" data-job-id="${escapeHtml(
          item.job_id,
        )}" ${runDisabled}>${escapeHtml(
          runLabel,
        )}</button><button class="secondary-button video-stop-button" type="button" data-job-id="${escapeHtml(
          item.job_id,
        )}" ${stopDisabled}>Stop</button></div></article>`;
      })
      .join("");

    return `<section class="section-band video-queue-builder"><div class="section-title-row"><h3>Video Queue Builder</h3><span id="video-queue-status" class="form-status">${escapeHtml(
      readyCount,
    )} ready, ${escapeHtml(draftCount)} draft, ${escapeHtml(
      reviewCount,
    )} review</span></div><div class="video-queue-list">${rows}</div></section>`;
  }

  function renderImageGenerationManager() {
    const current = stateApi.getState();
    const project = current.activeProject;
    const gate =
      typeof stateApi.getImageGenerationGate === "function"
        ? stateApi.getImageGenerationGate(project)
        : { items: [], included: [], blocked: [], generating: [] };
    const runs =
      typeof stateApi.getProjectImageGenerationRuns === "function"
        ? stateApi.getProjectImageGenerationRuns(project).slice().reverse()
        : [];
    const latestRun = runs[0] || null;
    const canStart = gate.included.length > 0;
    const latestRunHtml = latestRun
      ? `<div class="readonly-row"><span>Latest run</span><code>${escapeHtml(
          latestRun.image_run_id,
        )}</code></div><div class="readonly-row"><span>Status</span><strong>${escapeHtml(
          latestRun.status || "planned",
        )} - ${escapeHtml(latestRun.prompt_count || 0)} prompt${
          latestRun.prompt_count === 1 ? "" : "s"
        }</strong></div>`
      : '<div class="empty-inline">No image run prepared yet.</div>';

    return [
      `<section class="section-band image-gate-panel"><div class="section-title-row"><h3>Image Generation Gate</h3><span id="image-gate-status" class="form-status" aria-live="polite"></span></div><div class="image-gate-actions"><button id="btn-start-image-run" class="primary-button" type="button"${
        canStart ? "" : " disabled"
      }>Start Image Run</button><span class="form-status">${escapeHtml(
        gate.included.length,
      )} ready - ${escapeHtml(gate.blocked.length)} blocked - ${escapeHtml(
        gate.generating.length,
      )} generating</span></div>${latestRunHtml}</section>`,
      `<section class="section-band"><div class="section-title-row"><h3>Prompt Readiness</h3><span class="form-status">${escapeHtml(
        gate.items.length,
      )} total</span></div>${renderImageGateRows(gate)}</section>`,
      renderImageReviewBoard(project),
    ].join("");
  }

  function renderWorkspace() {
    const current = stateApi.getState();
    const view = stateApi.getViewDefinition(current.activeView);
    const counts = stateApi.getCounts();
    const icon = stateApi.$("#workspace-icon");
    const title = stateApi.$("#workspace-title");
    const subtitle = stateApi.$("#workspace-subtitle");
    const content = stateApi.$("#workspace-content");

    if (icon) icon.textContent = view.icon;
    if (title) title.textContent = view.title;
    if (subtitle) subtitle.textContent = view.subtitle;
    if (!content) return;

    if (current.lastError) {
      content.innerHTML = `<div class="error-state"><div><span class="material-symbols-outlined">error</span><h3>Project state unavailable</h3><p>${escapeHtml(
        current.lastError.message || current.lastError,
      )}</p></div></div>`;
      return;
    }

    if (!current.activeProject) {
      content.innerHTML =
        '<div class="empty-state"><div><span class="material-symbols-outlined">folder_off</span><h3>No project selected</h3><p>Project state is empty.</p></div></div>';
      return;
    }

    if (view.id === "project") {
      content.innerHTML = [
        renderProjectSettingsForm(current.activeProject),
        renderMetricGrid(view.id, counts),
        renderProjectFacts(current.activeProject, current.domainState),
      ].join("");
      return;
    }

    if (view.id === "assets") {
      content.innerHTML = renderAssetManager();
      return;
    }

    if (view.id === "import") {
      content.innerHTML = renderImportManager();
      return;
    }

    if (view.id === "images") {
      content.innerHTML = renderImageGenerationManager();
      return;
    }

    if (view.id === "video") {
      content.innerHTML = [
        renderVideoQueueBuilder(),
        renderMetricGrid(view.id, counts),
        renderProjectFacts(current.activeProject, current.domainState),
      ].join("");
      return;
    }

    content.innerHTML = [
      renderMetricGrid(view.id, counts),
      renderProjectFacts(current.activeProject, current.domainState),
    ].join("");
  }

  function renderDetails() {
    const current = stateApi.getState();
    const counts = stateApi.getCounts();
    const view = stateApi.getViewDefinition(current.activeView);
    const details = stateApi.$("#details-list");
    if (!details) return;

    const activeProject = current.activeProject;
    const rows = [
      ["Active project", getProjectName(activeProject)],
      ["Project ID", activeProject?.project_id || "Not set"],
      ["View", view.label],
      ["Projects", counts.projects],
      ["Assets", counts.assets],
      ["Blocked", counts.blocked],
      ["Queue", counts.videoJobs],
      ["Schema", `v${current.domainState?.schema_version || "?"}`],
      ["Updated", stateApi.formatDate(current.domainState?.meta?.updated_at)],
    ];

    details.innerHTML = rows
      .map(([label, value]) => {
        return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`;
      })
      .join("");
  }

  function renderAll() {
    renderProjectPicker();
    renderTopbar();
    renderNav();
    renderWorkspace();
    renderDetails();
  }

  function setFormStatus(message, tone) {
    const status = stateApi.$("#project-settings-status");
    if (!status) return;
    status.textContent = message || "";
    status.classList.toggle("success", tone === "success");
    status.classList.toggle("danger", tone === "danger");
  }

  function setAssetStatus(message, tone) {
    const status = stateApi.$("#asset-manager-status");
    if (!status) return;
    status.textContent = message || "";
    status.classList.toggle("success", tone === "success");
    status.classList.toggle("danger", tone === "danger");
  }

  function setImportStatus(message, tone) {
    const status = stateApi.$("#prompt-import-status");
    if (!status) return;
    status.textContent = message || "";
    status.classList.toggle("success", tone === "success");
    status.classList.toggle("danger", tone === "danger");
    status.classList.toggle("warning", tone === "warning");
  }

  function setImageGateStatus(message, tone) {
    const status = stateApi.$("#image-gate-status");
    if (!status) return;
    status.textContent = message || "";
    status.classList.toggle("success", tone === "success");
    status.classList.toggle("danger", tone === "danger");
    status.classList.toggle("warning", tone === "warning");
  }

  function setVideoQueueStatus(message, tone) {
    const status = stateApi.$("#video-queue-status");
    if (!status) return;
    status.textContent = message || "";
    status.classList.toggle("success", tone === "success");
    status.classList.toggle("danger", tone === "danger");
    status.classList.toggle("warning", tone === "warning");
  }

  async function refresh() {
    try {
      await stateApi.loadProjectState();
    } catch (error) {
      stateApi.getState().lastError = error;
    }
    renderAll();
  }

  function bindEvents() {
    stateApi.$all(".nav-item").forEach((item) => {
      item.addEventListener("click", () => {
        stateApi.setActiveView(item.dataset.view);
        renderAll();
        stateApi.$("#studio-workspace")?.focus();
      });
    });

    stateApi.$("#project-picker")?.addEventListener("change", async (event) => {
      const projectId = event.target.value;
      if (!projectId) return;
      try {
        await stateApi.setActiveProject(projectId);
      } catch (error) {
        stateApi.getState().lastError = error;
      }
      renderAll();
    });

    stateApi.$("#btn-refresh-project-state")?.addEventListener("click", () => {
      refresh();
    });

    stateApi.$("#workspace-content")?.addEventListener("submit", async (event) => {
      if (event.target?.id !== "project-settings-form") return;
      event.preventDefault();

      const input = stateApi.$("#project-display-name");
      const button = event.target.querySelector("button[type='submit']");
      const originalProjectId = stateApi.getState().activeProject?.project_id || "";

      try {
        if (button) button.disabled = true;
        await stateApi.updateActiveProject({ display_name: input?.value || "" });
        const updatedProjectId = stateApi.getState().activeProject?.project_id || "";
        renderAll();
        if (updatedProjectId !== originalProjectId) {
          setFormStatus("Project ID changed unexpectedly.", "danger");
          return;
        }
        setFormStatus("Saved", "success");
      } catch (error) {
        setFormStatus(error.message || "Project save failed.", "danger");
      } finally {
        if (button) button.disabled = false;
      }
    });

    stateApi.$("#workspace-content")?.addEventListener("submit", async (event) => {
      if (event.target?.id !== "asset-create-form") return;
      event.preventDefault();

      const button = event.target.querySelector("button[type='submit']");
      const type = stateApi.$("#asset-type-input")?.value || "reference";
      const displayName = stateApi.$("#asset-name-input")?.value || "";
      const aliases = stateApi.$("#asset-aliases-input")?.value || "";

      try {
        if (button) button.disabled = true;
        await stateApi.createAsset({ type, display_name: displayName, aliases });
        renderAll();
        setAssetStatus("Asset added", "success");
      } catch (error) {
        setAssetStatus(error.message || "Asset save failed.", "danger");
      } finally {
        if (button) button.disabled = false;
      }
    });

    stateApi.$("#workspace-content")?.addEventListener("submit", async (event) => {
      if (!event.target?.classList?.contains("asset-edit-form")) return;
      event.preventDefault();

      const form = event.target;
      const button = form.querySelector("button[type='submit']");
      const assetId = form.dataset.assetId;

      try {
        if (button) button.disabled = true;
        await stateApi.updateAsset(assetId, {
          type: form.elements.type.value,
          display_name: form.elements.display_name.value,
          aliases: form.elements.aliases.value,
        });
        const updatedAsset = stateApi
          .getState()
          .activeProject?.assets?.find((asset) => asset.asset_id === assetId);
        renderAll();
        if (!updatedAsset) {
          setAssetStatus("Asset ID changed unexpectedly.", "danger");
          return;
        }
        setAssetStatus("Asset updated", "success");
      } catch (error) {
        setAssetStatus(error.message || "Asset update failed.", "danger");
      } finally {
        if (button) button.disabled = false;
      }
    });

    stateApi.$("#workspace-content")?.addEventListener("change", (event) => {
      if (event.target?.id !== "asset-type-filter") return;
      stateApi.setAssetFilter(event.target.value);
      renderAll();
    });

    stateApi.$("#workspace-content")?.addEventListener("change", async (event) => {
      if (event.target?.id !== "prompt-json-input") return;
      const input = event.target;
      const file = input.files && input.files[0];
      if (!file) return;

      try {
        input.disabled = true;
        const text = await stateApi.readTextFile(file);
        const result = await stateApi.importProjectPromptJson(text, file.name);
        const warningCount = Array.isArray(result.warnings) ? result.warnings.length : 0;
        const blockedCount = result.records.filter((record) => record.status === "blocked").length;
        const readyCount = result.records.filter((record) => record.status === "ready").length;
        renderAll();
        setImportStatus(
          `Imported ${result.records.length} prompt${
            result.records.length === 1 ? "" : "s"
          }: ${readyCount} ready, ${blockedCount} blocked${
            warningCount ? `, ${warningCount} warning${warningCount === 1 ? "" : "s"}` : ""
          }`,
          blockedCount || warningCount ? "warning" : "success",
        );
      } catch (error) {
        setImportStatus(error.message || "Prompt JSON import failed.", "danger");
      } finally {
        input.disabled = false;
        input.value = "";
      }
    });

    stateApi.$("#workspace-content")?.addEventListener("click", async (event) => {
      const button = event.target?.closest?.("#btn-resolve-prompts");
      if (!button) return;

      try {
        button.disabled = true;
        const result = await stateApi.resolveActiveProjectPromptReferences();
        renderAll();
        setImportStatus(
          `Resolved ${result.summary.record_count} prompt${
            result.summary.record_count === 1 ? "" : "s"
          }: ${result.summary.ready_count} ready, ${result.summary.blocked_count} blocked`,
          result.summary.blocked_count ? "warning" : "success",
        );
      } catch (error) {
        setImportStatus(error.message || "Reference resolution failed.", "danger");
      } finally {
        button.disabled = false;
      }
    });

    stateApi.$("#workspace-content")?.addEventListener("click", async (event) => {
      const button = event.target?.closest?.(".reference-map-button");
      if (!button) return;

      const row = button.closest(".prompt-map-row");
      const panel = button.closest(".prompt-map-panel");
      const select = row?.querySelector(".reference-map-select");
      const promptId = panel?.dataset.promptId || "";
      const referenceIndex = row?.dataset.referenceIndex || "";
      const assetId = select?.value || "";

      if (!assetId) {
        setImportStatus("Choose an Asset to map.", "danger");
        return;
      }

      try {
        button.disabled = true;
        const result = await stateApi.mapPromptReferenceToAsset(
          promptId,
          referenceIndex,
          assetId,
        );
        renderAll();
        setImportStatus(
          `Mapped reference: ${result.summary.ready_count} ready, ${result.summary.blocked_count} blocked`,
          result.summary.blocked_count ? "warning" : "success",
        );
      } catch (error) {
        setImportStatus(error.message || "Reference mapping failed.", "danger");
      } finally {
        button.disabled = false;
      }
    });

    stateApi.$("#workspace-content")?.addEventListener("click", async (event) => {
      const button = event.target?.closest?.("#btn-start-image-run");
      if (!button) return;

      try {
        button.disabled = true;
        const result = await stateApi.startImageGenerationRun();
        renderAll();
        setImageGateStatus(
          `Image run prepared: ${result.run.prompt_count} prompt${
            result.run.prompt_count === 1 ? "" : "s"
          }, ${result.run.excluded_prompt_count} excluded`,
          result.run.excluded_prompt_count ? "warning" : "success",
        );
      } catch (error) {
        setImageGateStatus(error.message || "Image generation gate failed.", "danger");
      } finally {
        button.disabled = false;
      }
    });

    stateApi.$("#workspace-content")?.addEventListener("click", async (event) => {
      const button = event.target?.closest?.(".variant-slot[data-variant-id]");
      if (!button) return;

      try {
        button.disabled = true;
        const result = await stateApi.selectImageVariant(
          button.dataset.promptId,
          button.dataset.variantId,
        );
        renderAll();
        setImageGateStatus(`Selected ${result.generated_file_name || "variant"}`, "success");
      } catch (error) {
        setImageGateStatus(error.message || "Variant selection failed.", "danger");
      } finally {
        button.disabled = false;
      }
    });

    stateApi.$("#workspace-content")?.addEventListener("change", async (event) => {
      if (!event.target?.classList?.contains("asset-file-input")) return;
      const input = event.target;
      const assetId = input.dataset.assetId;

      try {
        await stateApi.addAssetFiles(assetId, input.files);
        const count = input.files ? input.files.length : 0;
        renderAll();
        setAssetStatus(`${count} file${count === 1 ? "" : "s"} attached`, "success");
      } catch (error) {
        setAssetStatus(error.message || "File upload failed.", "danger");
      } finally {
        input.value = "";
      }
    });

    stateApi.$("#workspace-content")?.addEventListener("click", async (event) => {
      const button = event.target?.closest?.(".file-primary-button");
      if (!button) return;

      const originalAssetId = button.dataset.assetId;
      try {
        button.disabled = true;
        await stateApi.setPrimaryAssetFile(button.dataset.assetId, button.dataset.fileId);
        renderAll();
        setAssetStatus("Primary file updated", "success");
        const updatedAsset = stateApi
          .getFilteredAssets()
          .find((asset) => asset.asset_id === originalAssetId);
        if (!updatedAsset) {
          setAssetStatus("Asset ID changed unexpectedly.", "danger");
        }
      } catch (error) {
        setAssetStatus(error.message || "Primary file update failed.", "danger");
      } finally {
        button.disabled = false;
      }
    });

    stateApi.$("#workspace-content")?.addEventListener("click", async (event) => {
      const button = event.target?.closest?.(".asset-danger-button");
      if (!button) return;

      const assetId = button.dataset.assetId;
      const nextDisabled = button.dataset.nextDisabled === "true";
      const asset = stateApi
        .getState()
        .activeProject?.assets?.find((item) => item.asset_id === assetId);
      const dependencies = getAssetDependencySummary(asset);

      if (
        nextDisabled &&
        !root.confirm(
          `Disable this Asset? Affected dependencies: ${dependencies.prompts} prompt(s), ${dependencies.jobs} job(s). You can cancel now or re-enable it later.`,
        )
      ) {
        setAssetStatus("Disable cancelled", "success");
        return;
      }

      try {
        button.disabled = true;
        await stateApi.setAssetDisabled(assetId, nextDisabled);
        const updatedAsset = stateApi
          .getState()
          .activeProject?.assets?.find((item) => item.asset_id === assetId);
        renderAll();
        if (!updatedAsset || updatedAsset.asset_id !== assetId) {
          setAssetStatus("Asset ID changed unexpectedly.", "danger");
          return;
        }
        setAssetStatus(nextDisabled ? "Asset disabled" : "Asset enabled", "success");
      } catch (error) {
        setAssetStatus(error.message || "Asset state update failed.", "danger");
      } finally {
        button.disabled = false;
      }
    });

    stateApi.$("#workspace-content")?.addEventListener("click", async (event) => {
      const button = event.target?.closest?.(".video-draft-button[data-prompt-id]");
      if (!button) return;

      try {
        button.disabled = true;
        const job = await stateApi.createOrUpdateVideoDraft(button.dataset.promptId);
        renderAll();
        setVideoQueueStatus(`Draft ready: ${job.expected_output_file_name || "video"}`, "success");
      } catch (error) {
        setVideoQueueStatus(error.message || "Video Draft update failed.", "danger");
      } finally {
        button.disabled = false;
      }
    });

    stateApi.$("#workspace-content")?.addEventListener("click", async (event) => {
      const button = event.target?.closest?.(".video-queue-button[data-job-id]");
      if (!button) return;

      try {
        button.disabled = true;
        const job = await stateApi.addVideoDraftToQueue(button.dataset.jobId);
        renderAll();
        setVideoQueueStatus(`Ready: ${job.expected_output_file_name || "video"}`, "success");
      } catch (error) {
        renderAll();
        setVideoQueueStatus(error.message || "Video queue update failed.", "danger");
      } finally {
        button.disabled = false;
      }
    });

    stateApi.$("#workspace-content")?.addEventListener("click", async (event) => {
      const button = event.target?.closest?.(".video-hold-button[data-job-id]");
      if (!button) return;

      try {
        button.disabled = true;
        await stateApi.holdVideoJob(button.dataset.jobId);
        renderAll();
        setVideoQueueStatus("Video job held as Draft", "success");
      } catch (error) {
        setVideoQueueStatus(error.message || "Video hold failed.", "danger");
      } finally {
        button.disabled = false;
      }
    });

    stateApi.$("#workspace-content")?.addEventListener("click", async (event) => {
      const button = event.target?.closest?.(".video-remove-button[data-job-id]");
      if (!button) return;

      if (!root.confirm("Remove this Video Draft or Ready job? Running and complete work is protected.")) {
        setVideoQueueStatus("Remove cancelled", "warning");
        return;
      }

      try {
        button.disabled = true;
        await stateApi.removeVideoJob(button.dataset.jobId);
        renderAll();
        setVideoQueueStatus("Video job removed", "success");
      } catch (error) {
        setVideoQueueStatus(error.message || "Video remove failed.", "danger");
      } finally {
        button.disabled = false;
      }
    });

    stateApi.$("#workspace-content")?.addEventListener("click", async (event) => {
      const button = event.target?.closest?.(".video-move-button[data-job-id]");
      if (!button) return;

      try {
        button.disabled = true;
        await stateApi.moveVideoJob(button.dataset.jobId, button.dataset.direction);
        renderAll();
        setVideoQueueStatus("Video queue order updated", "success");
      } catch (error) {
        setVideoQueueStatus(error.message || "Video reorder failed.", "danger");
      } finally {
        button.disabled = false;
      }
    });

    stateApi.$("#workspace-content")?.addEventListener("click", async (event) => {
      const button = event.target?.closest?.(".video-run-button[data-job-id]");
      if (!button) return;

      try {
        button.disabled = true;
        const job = await stateApi.runVideoJob(button.dataset.jobId);
        renderAll();
        setVideoQueueStatus(`Running: ${job.expected_output_file_name || "video"}`, "success");
      } catch (error) {
        renderAll();
        setVideoQueueStatus(error.message || "Video run failed.", "danger");
      } finally {
        button.disabled = false;
      }
    });

    stateApi.$("#workspace-content")?.addEventListener("click", async (event) => {
      const button = event.target?.closest?.(".video-stop-button[data-job-id]");
      if (!button) return;

      try {
        button.disabled = true;
        await stateApi.stopVideoJob(button.dataset.jobId);
        renderAll();
        setVideoQueueStatus("Video job stopped", "warning");
      } catch (error) {
        setVideoQueueStatus(error.message || "Video stop failed.", "danger");
      } finally {
        button.disabled = false;
      }
    });

    root.chrome?.runtime?.onMessage?.addListener?.((message) => {
      if (typeof stateApi.handleVideoRuntimeMessage !== "function") return;
      stateApi
        .handleVideoRuntimeMessage(message)
        .then((updated) => {
          if (!updated) return;
          renderAll();
          setVideoQueueStatus("Video job updated", "success");
        })
        .catch((error) => {
          setVideoQueueStatus(error.message || "Video status update failed.", "danger");
        });
    });

    root.chrome?.storage?.onChanged?.addListener?.((changes, areaName) => {
      const storageKey = root.TFProjectDomain?.STORAGE_KEY;
      if (areaName === "local" && storageKey && changes[storageKey]) {
        refresh();
      }
    });
  }

  async function boot() {
    bindEvents();
    await refresh();
  }

  root.TFProjectStudioShell = Object.freeze({
    boot,
    refresh,
  });
})(globalThis);
