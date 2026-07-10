// AutoFlow project-aware prompt JSON contract.
// DOM-free classic script shared by extension pages and MV3 service worker.
(function initTFProjectJsonContract(root) {
  "use strict";

  const CONTRACT_VERSION = 1;
  const CANONICAL_REFERENCE_FIELD = "references";
  const ACCEPTED_REFERENCE_FIELDS = Object.freeze([
    "references",
    "refs",
    "reference_names",
    "referenceNames",
  ]);
  const ALIAS_UNIQUENESS_SCOPE = "per_asset_type";
  const ASSET_TYPES = Object.freeze([
    "character",
    "place",
    "prop",
    "style",
    "reference",
  ]);

  function isObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function cleanString(value) {
    return String(value || "").trim();
  }

  function safeAssetType(value) {
    const type = cleanString(value).toLowerCase();
    return ASSET_TYPES.indexOf(type) >= 0 ? type : "";
  }

  function getPromptItems(input) {
    const source = typeof input === "string" ? JSON.parse(input) : input;
    if (Array.isArray(source)) return source;
    if (Array.isArray(source?.items)) return source.items;
    if (Array.isArray(source?.prompts)) return source.prompts;
    throw new Error("Project prompt JSON must be an array, items array, or prompts array.");
  }

  function findReferenceField(record) {
    for (const field of ACCEPTED_REFERENCE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(record, field)) {
        return field;
      }
    }
    return "";
  }

  function normalizeReference(reference, promptIndex, referenceIndex) {
    if (typeof reference === "string") {
      const name = cleanString(reference);
      if (!name) {
        return {
          error: `Item ${promptIndex + 1} reference ${referenceIndex + 1} is empty.`,
        };
      }
      return { value: { name, type: "", required: true } };
    }

    if (!isObject(reference)) {
      return {
        error: `Item ${promptIndex + 1} reference ${referenceIndex + 1} must be a string or object.`,
      };
    }

    const name = cleanString(reference.name || reference.alias || reference.ref);
    if (!name) {
      return {
        error: `Item ${promptIndex + 1} reference ${referenceIndex + 1} needs a name.`,
      };
    }

    return {
      value: {
        name,
        type: safeAssetType(reference.type || reference.asset_type || reference.assetType),
        required: reference.required !== false,
      },
    };
  }

  function normalizeReferences(record, promptIndex, errors, warnings) {
    const field = findReferenceField(record);
    if (!field) return [];

    if (field !== CANONICAL_REFERENCE_FIELD) {
      warnings.push(
        `Item ${promptIndex + 1} uses ${field}; ${CANONICAL_REFERENCE_FIELD} is canonical.`,
      );
    }

    const raw = record[field];
    const references = Array.isArray(raw) ? raw : [raw];
    const normalized = [];
    references.forEach((reference, referenceIndex) => {
      const result = normalizeReference(reference, promptIndex, referenceIndex);
      if (result.error) {
        errors.push(result.error);
      } else {
        normalized.push(result.value);
      }
    });
    return normalized;
  }

  function normalizePromptRecord(record, index, errors, warnings) {
    if (!isObject(record)) {
      errors.push(`Item ${index + 1} must be an object.`);
      return null;
    }

    const fileName = cleanString(record.file_name || record.fileName);
    const imagePrompt = cleanString(record.image_prompt || record.imagePrompt);
    const animationPrompt = cleanString(record.animation_prompt || record.animationPrompt);

    if (!fileName) errors.push(`Item ${index + 1} needs file_name.`);
    if (!imagePrompt) errors.push(`Item ${index + 1} needs image_prompt.`);

    return {
      file_name: fileName,
      image_prompt: imagePrompt,
      animation_prompt: animationPrompt || "",
      references: normalizeReferences(record, index, errors, warnings),
      raw: record,
    };
  }

  function parsePromptJson(input) {
    const errors = [];
    const warnings = [];
    let items = [];

    try {
      items = getPromptItems(input);
    } catch (error) {
      return {
        ok: false,
        errors: [error.message || "Project prompt JSON could not be parsed."],
        warnings,
        records: [],
      };
    }

    const records = items
      .map((record, index) => normalizePromptRecord(record, index, errors, warnings))
      .filter(Boolean);

    if (!records.length && !errors.length) {
      errors.push("Project prompt JSON did not contain any prompt records.");
    }

    return {
      ok: errors.length === 0,
      errors,
      warnings,
      records,
      meta: {
        contract_version: CONTRACT_VERSION,
        canonical_reference_field: CANONICAL_REFERENCE_FIELD,
        accepted_reference_fields: ACCEPTED_REFERENCE_FIELDS.slice(),
        alias_uniqueness_scope: ALIAS_UNIQUENESS_SCOPE,
      },
    };
  }

  root.TFProjectJsonContract = Object.freeze({
    ACCEPTED_REFERENCE_FIELDS,
    ALIAS_UNIQUENESS_SCOPE,
    ASSET_TYPES,
    CANONICAL_REFERENCE_FIELD,
    CONTRACT_VERSION,
    parsePromptJson,
  });
})(globalThis);
