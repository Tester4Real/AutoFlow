// TurboFlow side panel shard: active Channel selector.
// Loaded by src/sidepanel/index.html after shared side panel helpers.
(function initSidePanelProjectSelector(root) {
  "use strict";

  const selectorState = {
    activeProject: null,
    domainState: null,
    lastError: null,
  };

  function query(selector) {
    if (typeof r === "function") return r(selector);
    return root.document.querySelector(selector);
  }

  function getDomain() {
    return root.TFProjectDomain || null;
  }

  function projects() {
    return Array.isArray(selectorState.domainState?.projects)
      ? selectorState.domainState.projects
      : [];
  }

  function projectName(project) {
    return project?.display_name || project?.name || "Untitled Channel";
  }

  function resolveActiveProject(domainState) {
    const list = Array.isArray(domainState?.projects) ? domainState.projects : [];
    if (!list.length) return null;
    return (
      list.find((project) => project.project_id === domainState.active_project_id) ||
      list[0]
    );
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function hasActiveWork() {
    try {
      if (typeof l !== "undefined" && l.activeBatchId) return true;
      if (
        typeof l !== "undefined" &&
        Array.isArray(l.batches) &&
        l.batches.some((batch) => batch.status === "running")
      ) {
        return true;
      }
      if (
        typeof u !== "undefined" &&
        u instanceof Map &&
        Array.from(u.values()).some((item) => {
          return item.status === "generating" || item.status === "downloading";
        })
      ) {
        return true;
      }
    } catch (error) {
      return false;
    }
    return false;
  }

  function setStatus(text, tone) {
    const status = query("#sidepanel-project-status");
    if (!status) return;
    status.textContent = text;
    status.classList.toggle("warning", tone === "warning");
    status.classList.toggle("danger", tone === "danger");
  }

  function normalizeVideoStatus(job) {
    const status = String(job?.status || "").trim().toLowerCase();
    if (status === "queued") return "ready";
    if (status === "completed") return "complete";
    return status || "draft";
  }

  function countBlockedPromptRecords(project) {
    const prompts = Array.isArray(project?.prompt_records) ? project.prompt_records : [];
    return prompts.filter((record) => {
      return record?.status === "blocked" || record?.status === "needs_resolution";
    }).length;
  }

  function getProjectQueueSummary(project) {
    const jobs = Array.isArray(project?.video_jobs) ? project.video_jobs : [];
    const counts = {
      draft: 0,
      ready: 0,
      running: 0,
      failed: 0,
      complete: 0,
      blocked: countBlockedPromptRecords(project),
    };
    let alert = "";

    jobs.forEach((job) => {
      const status = normalizeVideoStatus(job);
      if (status === "needs_review") {
        counts.blocked++;
        if (!alert) {
          alert = job.needs_review_reason || "Video job needs review before running.";
        }
        return;
      }
      if (Object.prototype.hasOwnProperty.call(counts, status)) {
        counts[status]++;
      }
      if (!alert && status === "failed") {
        alert = job.error_message || "Video job failed; retry from Channel Studio.";
      }
    });
    if (!alert && jobs.length && !project.current_flow_context_id) {
      alert = "Disconnected: open the current Flow project before repairing or retrying media.";
    }

    return {
      alert,
      counts,
      total:
        counts.draft +
        counts.ready +
        counts.running +
        counts.failed +
        counts.complete +
        counts.blocked,
    };
  }

  function renderQueueSummary() {
    const summary = query("#sidepanel-project-queue-summary");
    const videoButton = query("#btn-open-project-video-queue");
    const project = selectorState.activeProject;
    if (!summary) return;

    if (!project) {
      summary.innerHTML = '<span class="project-queue-chip muted">Queue: no active Channel</span>';
      if (videoButton) videoButton.disabled = true;
      return;
    }

    const { alert, counts, total } = getProjectQueueSummary(project);
    const chips = [
      ["Ready/queued", counts.ready, "ready"],
      ["Draft", counts.draft, "draft"],
      ["Running", counts.running, "running"],
      ["Failed", counts.failed, "failed"],
      ["Blocked", counts.blocked, "blocked"],
    ].filter((item) => item[1] > 0);

    summary.innerHTML = chips.length
      ? chips
          .map(([label, count, tone]) => {
            return `<span class="project-queue-chip ${tone}">${escapeHtml(label)} ${escapeHtml(
              count,
            )}</span>`;
          })
          .join("")
      : '<span class="project-queue-chip muted">Queue: no channel work</span>';

    if (alert) {
      summary.innerHTML += `<span class="project-queue-alert">${escapeHtml(alert)}</span>`;
    } else if (total > 0) {
      summary.innerHTML += '<span class="project-queue-alert muted">Use Studio for video preparation.</span>';
    }

    if (videoButton) videoButton.disabled = false;
  }

  function emitProjectChanged(reason) {
    try {
      root.dispatchEvent(
        new CustomEvent("TF_PROJECT_CHANGED", {
          detail: {
            activeProject: selectorState.activeProject,
            domainState: selectorState.domainState,
            reason,
          },
        }),
      );
    } catch (error) {}
  }

  function render() {
    const picker = query("#sidepanel-project-picker");
    const createButton = query("#btn-create-sidepanel-project");
    const list = projects();

    if (!picker) return;

    if (selectorState.lastError) {
      picker.innerHTML = '<option value="">Channel unavailable</option>';
      picker.disabled = true;
      if (createButton) createButton.disabled = true;
      setStatus(selectorState.lastError.message || "Channel unavailable", "danger");
      renderQueueSummary();
      return;
    }

    if (!list.length) {
      picker.innerHTML = '<option value="">No channel</option>';
      picker.disabled = true;
      if (createButton) createButton.disabled = _creatingProject || _queuedCreateProject;
      setStatus("No active Channel", "warning");
      renderQueueSummary();
      return;
    }

    picker.disabled = false;
    if (createButton) createButton.disabled = _creatingProject || _queuedCreateProject;
    picker.innerHTML = list
      .map((project) => {
        const id = escapeHtml(project.project_id);
        const name = escapeHtml(projectName(project));
        return `<option value="${id}">${name}</option>`;
      })
      .join("");
    picker.value = selectorState.activeProject?.project_id || "";

    const count = list.length;
    const suffix = count === 1 ? "Channel" : "Channels";
    setStatus(`${projectName(selectorState.activeProject)} - ${count} ${suffix}`);
    renderQueueSummary();
  }

  let _creatingProject = false;
  let _loadingInProgress = false;
  let _projectStateVersion = 0;
  let _queuedCreateProject = false;
  let _queuedLoadReason = "";

  function queueProjectLoad(reason) {
    _queuedLoadReason = reason || _queuedLoadReason || "storage";
  }

  function flushQueuedProjectLoad() {
    if (_loadingInProgress || _creatingProject) return;
    if (_queuedCreateProject) {
      _queuedCreateProject = false;
      root.setTimeout(() => {
        createProject();
      }, 0);
      return;
    }
    if (!_queuedLoadReason) return;
    const reason = _queuedLoadReason;
    _queuedLoadReason = "";
    root.setTimeout(() => {
      loadProjects(reason);
    }, 0);
  }

  async function loadProjects(reason) {
    if (_loadingInProgress || _creatingProject) {
      queueProjectLoad(reason);
      return;
    }
    _loadingInProgress = true;
    const readVersion = _projectStateVersion;
    try {
      const domain = getDomain();
      if (!domain || typeof domain.load !== "function") {
        throw new Error("Channel storage unavailable.");
      }
      const domainState = await domain.load();
      if (readVersion !== _projectStateVersion || _creatingProject) {
        queueProjectLoad(reason);
        return;
      }
      selectorState.domainState = domainState;
      selectorState.activeProject = resolveActiveProject(selectorState.domainState);
      selectorState.lastError = null;
      render();
      emitProjectChanged(reason || "load");
    } catch (error) {
      selectorState.lastError = error;
      render();
    } finally {
      _loadingInProgress = false;
      flushQueuedProjectLoad();
    }
  }

  async function createProject() {
    if (_creatingProject || _queuedCreateProject) return;
    if (_loadingInProgress) {
      _queuedCreateProject = true;
      const createButton = query("#btn-create-sidepanel-project");
      if (createButton) createButton.disabled = true;
      return;
    }
    _creatingProject = true;
    _queuedLoadReason = "";
    _projectStateVersion += 1;
    const createButton = query("#btn-create-sidepanel-project");
    try {
      if (createButton) createButton.disabled = true;
      const domain = getDomain();
      if (!domain || typeof domain.createProject !== "function") {
        throw new Error("Channel storage unavailable.");
      }
      const result = await domain.createProject();
      if (!result || !result.ok) {
        throw new Error(result?.error?.message || "Channel creation failed.");
      }
      selectorState.domainState = result.state;
      selectorState.activeProject = resolveActiveProject(result.state);
      selectorState.lastError = null;
      render();
      emitProjectChanged("create");
    } catch (error) {
      selectorState.lastError = error;
      render();
    } finally {
      _creatingProject = false;
      if (createButton) createButton.disabled = false;
      flushQueuedProjectLoad();
    }
  }

  async function switchProject(projectId) {
    const currentId = selectorState.activeProject?.project_id || "";
    if (!projectId || projectId === currentId) {
      render();
      return;
    }

    if (
      hasActiveWork() &&
      !root.confirm(
        "Switch Channels? Current queue work will keep running, but this panel may show a different Channel view.",
      )
    ) {
      render();
      return;
    }

    try {
      _projectStateVersion += 1;
      const domain = getDomain();
      if (!domain || typeof domain.setActiveProject !== "function") {
        throw new Error("Channel storage unavailable.");
      }
      const result = await domain.setActiveProject(projectId);
      if (!result || !result.ok) {
        throw new Error(result?.error?.message || "Channel switch failed.");
      }
      selectorState.domainState = result.state;
      selectorState.activeProject = resolveActiveProject(result.state);
      selectorState.lastError = null;
      render();
      emitProjectChanged("switch");
    } catch (error) {
      selectorState.lastError = error;
      render();
    }
  }

  function attach() {
    query("#sidepanel-project-picker")?.addEventListener("change", (event) => {
      switchProject(event.target.value);
    });
    query("#btn-create-sidepanel-project")?.addEventListener("click", () => {
      createProject();
    });
    root.chrome?.storage?.onChanged?.addListener?.((changes, areaName) => {
      const storageKey = root.TFProjectDomain?.STORAGE_KEY;
      if (areaName === "local" && storageKey && changes[storageKey]) {
        if (_creatingProject) {
          queueProjectLoad("storage");
          return;
        }
        loadProjects("storage");
      }
    });
    loadProjects("boot");
  }

  if (root.document.readyState === "loading") {
    root.document.addEventListener("DOMContentLoaded", attach, { once: true });
  } else {
    attach();
  }

  root.TFProjectSidePanelSelector = Object.freeze({
    refresh: loadProjects,
  });
})(globalThis);
