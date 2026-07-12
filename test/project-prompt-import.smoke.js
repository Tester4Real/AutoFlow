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
  let writeCount = 0;
  return {
    get writeCount() {
      return writeCount;
    },
    get(key, callback) {
      const result = { [key]: data[key] };
      queueMicrotask(() => callback(result));
    },
    set(items, callback) {
      Object.assign(data, JSON.parse(JSON.stringify(items)));
      writeCount += 1;
      queueMicrotask(callback);
    },
  };
}

function createContext(storage) {
  const context = vm.createContext({
    console,
    Date,
    Error,
    JSON,
    Map,
    Math,
    Object,
    Promise,
    Set,
    String,
    Array,
    Number,
    Boolean,
    RegExp,
    TextDecoder,
    Uint8Array,
    queueMicrotask,
    setTimeout,
    clearTimeout,
    chrome: { runtime: {}, storage: { local: storage } },
    crypto: {
      randomUUID: (() => {
        let index = 0;
        return () => `00000000-0000-4000-8000-${String(++index).padStart(12, "0")}`;
      })(),
    },
  });
  context.globalThis = context;
  loadScript(context, "src/shared/project-domain/00-project-domain.js");
  loadScript(context, "src/shared/project-domain/01-project-json-contract.js");
  loadScript(context, "src/shared/project-domain/02-project-prompt-import.js");
  return context;
}

async function expectReject(promise, code, messagePart) {
  await assert.rejects(promise, (error) => {
    assert.equal(error.code, code);
    assert.match(error.message, new RegExp(messagePart));
    return true;
  });
}

async function run() {
  const storage = createStorage();
  const context = createContext(storage);
  const domain = context.TFProjectDomain;
  const importer = context.TFProjectPromptImport;
  domain.setStorageAdapter(storage);
  assert.equal(
    domain.repairTextEncoding("ðŸ“Š Generation complete â€” 4/4 âœ…"),
    "\u{1f4ca} Generation complete \u2014 4/4 \u2705",
  );
  assert.equal(
    domain.repairTextEncoding("\u0645\u0631\u062d\u0628\u0627 ðŸ“Š"),
    "\u0645\u0631\u062d\u0628\u0627 \u{1f4ca}",
  );

  const created = await domain.createProject({
    display_name: "Smoke Project",
    assets: [
      { asset_id: "asset_jack", display_name: "Jack", type: "character" },
      { asset_id: "asset_desk_a", display_name: "Desk" },
      { asset_id: "asset_desk_b", display_name: "Desk" },
      { asset_id: "asset_disabled", display_name: "Disabled", type: "character", disabled: true },
      { asset_id: "asset_location", display_name: "Office", type: "location" },
    ],
  });
  const projectId = created.project.project_id;
  const validJson = JSON.stringify({
    prompts: [
      {
        file_name: "S01.png",
        image_prompt: "Jack at work",
        animation_prompt: "Jack looks up",
        references: [{ name: "Jack", type: "character" }],
      },
      {
        file_name: "S02.png",
        image_prompt: "A missing person",
        references: ["Ghost"],
      },
      {
        file_name: "S03.png",
        image_prompt: "A desk",
        references: [{ name: "Desk", type: "object" }],
      },
      {
        file_name: "S04.png",
        image_prompt: "Optional prop",
        references: [{ name: "Lamp", type: "object", required: false }],
      },
    ],
  });

  const imported = await importer.importPromptJson(validJson, {
    projectId,
    sourceName: "prompt-index.json",
  });
  assert.deepEqual(
    JSON.parse(JSON.stringify(imported.summary)),
    { ready_count: 2, blocked_count: 2, needs_resolution_count: 0, record_count: 4 },
  );
  assert.equal(imported.records[0].animation_prompt, "Jack looks up");
  assert.equal(imported.records[0].references[0].resolution_status, "resolved");
  assert.equal(imported.records[1].blocked_references[0].reason, "missing");
  assert.equal(imported.records[2].references[0].resolution_status, "ambiguous");
  assert.equal(imported.records[3].status, "ready");
  assert.deepEqual(Array.from(imported.records[0].raw_reference_names), ["Jack"]);
  assert.equal(imported.project.prompt_imports.length, 1);
  assert.equal(imported.project.prompt_records.length, 4);

  const disabled = importer.resolvePromptReference(
    { name: "Disabled", type: "character", manual_asset_id: "asset_disabled" },
    created.project.assets,
  );
  assert.equal(disabled.resolution_error, "asset_disabled");
  const writesBeforeInvalid = storage.writeCount;
  await expectReject(
    importer.importPromptJson("{", { projectId }),
    "PROJECT_JSON_INVALID",
    "Unexpected|JSON",
  );
  assert.equal(storage.writeCount, writesBeforeInvalid);

  const writesBeforeMissing = storage.writeCount;
  await expectReject(
    importer.importPromptJson(validJson, { projectId: "missing_project" }),
    "PROJECT_NOT_FOUND",
    "Channel not found",
  );
  assert.equal(storage.writeCount, writesBeforeMissing);

  const concurrentImport = importer.importPromptJson(
    JSON.stringify([{ file_name: "S05.png", image_prompt: "Concurrent" }]),
    { projectId, sourceName: "concurrent.json" },
  );
  const concurrentUpdate = domain.updateProject(projectId, {
    settings: { concurrent_marker: "preserved" },
  });
  await Promise.all([concurrentImport, concurrentUpdate]);
  const finalState = await domain.load();
  const finalProject = finalState.projects.find((project) => project.project_id === projectId);
  assert.equal(finalProject.settings.concurrent_marker, "preserved");
  assert.equal(finalProject.prompt_imports.length, 2);
  assert.equal(finalProject.prompt_records.length, 5);

  const sideContext = vm.createContext({
    console,
    globalThis: null,
    TFProjectPromptImport: {
      importPromptJson: async () => {
        const error = new Error("shared import failed");
        error.code = "PROJECT_NOT_FOUND";
        throw error;
      },
    },
  });
  sideContext.globalThis = sideContext;
  loadScript(sideContext, "src/sidepanel/app/05b-json-folder-sync.js");
  await assert.rejects(
    sideContext.tfImportPromptIndexJson(validJson, "prompt-index.json"),
    /shared import failed/,
  );

  const loaders = [
    "src/background/runtime.js",
    "src/sidepanel/index.html",
    "src/project-studio/index.html",
  ];
  loaders.forEach((relativePath) => {
    const source = fs.readFileSync(path.join(root, relativePath), "utf8");
    const domainIndex = source.indexOf("00-project-domain.js");
    const contractIndex = source.indexOf("01-project-json-contract.js");
    const importerIndex = source.indexOf("02-project-prompt-import.js");
    assert.ok(domainIndex >= 0 && domainIndex < contractIndex && contractIndex < importerIndex);
  });

  console.log("project prompt import smoke tests passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
