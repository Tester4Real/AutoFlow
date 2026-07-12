"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function loadScript(context, relativePath) {
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  vm.runInContext(source, context, { filename: relativePath });
}

function createStorage() {
  const data = {};
  return {
    data,
    get(keys, callback) {
      const result = {};
      if (typeof keys === "string") {
        result[keys] = data[keys];
      } else if (Array.isArray(keys)) {
        keys.forEach((key) => {
          result[key] = data[key];
        });
      } else {
        Object.keys(keys || {}).forEach((key) => {
          result[key] = data[key] === undefined ? keys[key] : data[key];
        });
      }
      queueMicrotask(() => callback(result));
    },
    set(items, callback) {
      Object.assign(data, JSON.parse(JSON.stringify(items)));
      queueMicrotask(() => callback?.());
    },
  };
}

class FakeFileReader {
  constructor() {
    this.listeners = {};
    this.result = "";
    this.error = null;
  }

  addEventListener(type, listener) {
    this.listeners[type] = listener;
  }

  readAsDataURL(file) {
    this.result = file.dataUrl || "";
    queueMicrotask(() => this.listeners.load?.());
  }
}

function createContext(storage) {
  let id = 0;
  const context = vm.createContext({
    Array,
    Boolean,
    Date,
    Error,
    FakeFileReader,
    FileReader: FakeFileReader,
    JSON,
    Map,
    Math,
    Number,
    Object,
    Promise,
    RegExp,
    Set,
    String,
    TextDecoder,
    Uint8Array,
    clearTimeout,
    console,
    queueMicrotask,
    setTimeout,
    chrome: {
      runtime: {
        async sendMessage() {
          return { ok: true };
        },
      },
      storage: { local: storage },
    },
    crypto: {
      randomUUID() {
        id += 1;
        return `00000000-0000-4000-8000-${String(id).padStart(12, "0")}`;
      },
    },
  });
  context.globalThis = context;
  loadScript(context, "src/shared/project-domain/00-project-domain.js");
  loadScript(context, "src/shared/project-domain/01-project-json-contract.js");
  loadScript(context, "src/shared/project-domain/02-project-prompt-import.js");
  loadScript(context, "src/project-studio/app/00-studio-state.js");
  return context;
}

async function run() {
  const storage = createStorage();
  const context = createContext(storage);
  const domain = context.TFProjectDomain;
  const importer = context.TFProjectPromptImport;
  const studio = context.TFProjectStudioState;
  domain.setStorageAdapter(storage);

  const created = await domain.createProject({
    display_name: "Finance Channel",
    current_flow_context_id: "flow-context-1",
    assets: [
      {
        asset_id: "asset_jack",
        display_name: "Jack",
        files: [
          {
            asset_file_id: "file_jack",
            file_name: "Jack.jpg",
            mime_type: "image/jpeg",
            data_url: "data:image/jpeg;base64,SmFjaw==",
            is_primary: true,
          },
        ],
        primary_file_id: "file_jack",
      },
    ],
  });

  const firstImport = await importer.importPromptJson(
    JSON.stringify({
      prompts: [
        {
          file_name: "scenes/jack_checks_his_budget.png",
          image_prompt: "Jack checks his budget",
          animation_prompt: "Jack studies the numbers and nods.",
          references: ["Jack"],
        },
        {
          file_name: "budget_chart.png",
          image_prompt: "A clean budget chart",
        },
      ],
    }),
    { projectId: created.project.project_id, sourceName: "budget-basics.json" },
  );
  const secondImport = await importer.importPromptJson(
    JSON.stringify([
      {
        file_name: "market_open.png",
        image_prompt: "Market opens",
        animation_prompt: "Numbers tick upward.",
      },
    ]),
    { projectId: created.project.project_id, sourceName: "market-update.json" },
  );

  let domainState = await domain.load();
  let project = domainState.projects[0];
  const firstVideoId = project.prompt_imports[0].import_id;
  const secondVideoId = project.prompt_imports[1].import_id;
  const firstPromptId = firstImport.records[0].prompt_id;
  const firstVariant = {
    variant_id: "variant_budget_1",
    prompt_id: firstPromptId,
    variant_index: 0,
    file_name: "scenes/jack_checks_his_budget.png",
    generated_file_name: "scenes/jack_checks_his_budget.png",
    thumbnail_url: "data:image/png;base64,cHJldmlldw==",
    media_id: "flow-media-1",
    flow_context_id: "flow-context-1",
    status: "available",
    is_selected: true,
  };
  await domain.updateProject(project.project_id, {
    prompt_records: project.prompt_records.map((record) =>
      record.prompt_id === firstPromptId
        ? Object.assign({}, record, { selected_variant_id: firstVariant.variant_id })
        : record,
    ),
    image_variants: [firstVariant],
  });

  await studio.loadProjectState();
  project = studio.getState().activeProject;
  const videos = studio.getProjectVideos(project);
  assert.equal(videos.length, 2);
  assert.equal(videos[0].video_id, firstVideoId);
  assert.equal(videos[0].display_name, "budget-basics");
  assert.equal(videos[0].prompt_count, 2);
  assert.equal(videos[1].video_id, secondVideoId);
  assert.equal(studio.getVideoPromptRecords(project, firstVideoId).length, 2);
  assert.equal(studio.getVideoPromptRecords(project, secondVideoId).length, 1);
  assert.equal(
    studio.sceneTitleFromFileName("scenes/jack_checks_his_budget.png"),
    "jack_checks_his_budget",
  );

  let firstQueue = studio.getVideoQueueItems(project, firstVideoId);
  let secondQueue = studio.getVideoQueueItems(project, secondVideoId);
  assert.equal(firstQueue.length, 2);
  assert.equal(secondQueue.length, 1);
  assert.equal(firstQueue[0].selected_preview_url, firstVariant.thumbnail_url);
  assert.equal(firstQueue[0].scene_title, "jack_checks_his_budget");
  assert.equal(firstQueue[0].status, "draft");
  assert.equal(secondQueue[0].selected_preview_url, "");

  const queuedJob = await studio.queuePromptVideo(firstPromptId);
  assert.equal(queuedJob.status, "ready");
  assert.equal(queuedJob.source_prompt_file_name, "scenes/jack_checks_his_budget.png");
  assert.equal(queuedJob.expected_output_file_name, "scenes/jack_checks_his_budget.mp4");
  project = studio.getState().activeProject;
  firstQueue = studio.getVideoQueueItems(project, firstVideoId);
  assert.equal(firstQueue[0].status, "ready");
  assert.equal(firstQueue[0].can_run, true);

  const assetCount = project.assets.length;
  const newAsset = await studio.createAssetWithFile(
    { display_name: "Office" },
    [
      {
        name: "office.webp",
        type: "image/webp",
        size: 42,
        lastModified: 123,
        dataUrl: "data:image/webp;base64,b2ZmaWNl",
      },
    ],
  );
  assert.equal(newAsset.display_name, "Office");
  assert.equal(newAsset.files.length, 1);
  assert.equal(newAsset.files[0].data_url, "data:image/webp;base64,b2ZmaWNl");
  project = studio.getState().activeProject;
  assert.equal(project.assets.length, assetCount + 1);
  await assert.rejects(
    studio.createAssetWithFile(
      { display_name: "Invalid" },
      [{ name: "notes.txt", type: "text/plain", dataUrl: "data:text/plain;base64,eA==" }],
    ),
    /must be an image/,
  );
  assert.equal(studio.getState().activeProject.assets.length, assetCount + 1);

  const jobsBeforeAssetDelete = studio.getState().activeProject.video_jobs.length;
  await studio.deleteAsset("asset_jack");
  project = studio.getState().activeProject;
  assert.equal(project.assets.some((asset) => asset.asset_id === "asset_jack"), false);
  const affectedPrompt = project.prompt_records.find((record) => record.prompt_id === firstPromptId);
  assert.equal(affectedPrompt.status, "blocked");
  assert.equal(project.video_jobs.length, jobsBeforeAssetDelete);

  await studio.renameProjectVideo(secondVideoId, "Daily Market Update");
  project = studio.getState().activeProject;
  assert.equal(
    studio.getProjectVideos(project).find((video) => video.video_id === secondVideoId).display_name,
    "Daily Market Update",
  );
  await studio.deleteProjectVideo(secondVideoId);
  project = studio.getState().activeProject;
  assert.equal(studio.getProjectVideos(project).some((video) => video.video_id === secondVideoId), false);
  assert.equal(
    project.prompt_records.some((record) => record.prompt_id === secondImport.records[0].prompt_id),
    false,
  );

  const studioSource = fs.readFileSync(
    path.join(root, "src/project-studio/react/studio.jsx"),
    "utf8",
  );
  const studioHtml = fs.readFileSync(
    path.join(root, "src/project-studio/index.html"),
    "utf8",
  );
  assert.match(studioSource, /from "@heroui\/react"/);
  assert.doesNotMatch(studioSource, /Create Draft/);
  assert.match(studioSource, /items\.find\(\(item\) => item\.status === "failed"\)/);
  assert.match(studioSource, /appendStudioLog\(`Video queue paused:/);
  assert.match(studioHtml, /generated\/studio\.bundle\.js/);
  assert.doesNotMatch(studioHtml, /01-studio-shell\.js|07-studio-boot\.js|details-inspector/);

  console.log("studio workspace smoke tests passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
