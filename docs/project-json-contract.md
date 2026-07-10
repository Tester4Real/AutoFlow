# Project JSON Reference Contract

This contract applies to new project-aware prompt JSON imports. Legacy `prompt-index.json` import still exists separately and may keep compatibility behavior until the project-aware importer replaces it.

## Prompt Record Shape

Project-aware prompt JSON may be a top-level array, `{ "items": [...] }`, or `{ "prompts": [...] }`.

Each prompt record supports:

| Field | Required | Notes |
| --- | --- | --- |
| `file_name` | Yes | Expected still-image output filename. `fileName` is accepted as compatibility input. |
| `image_prompt` | Yes | Text prompt for image generation. `imagePrompt` is accepted as compatibility input. |
| `animation_prompt` | No | Text prompt for video generation/draft creation. `animationPrompt` is accepted as compatibility input. |
| `references` | No | Canonical project-aware reference list. |

Accepted reference field names are `references`, `refs`, `reference_names`, and `referenceNames`. New files should use `references`. The parser normalizes all accepted names to `references`.

## Reference Shape

A reference may be a string:

```json
"bedroom"
```

Or an object:

```json
{
  "name": "bedroom",
  "type": "place",
  "required": true
}
```

Reference object fields:

| Field | Required | Notes |
| --- | --- | --- |
| `name` | Yes | User-facing reference name or alias to resolve. `alias` and `ref` are accepted as compatibility input. |
| `type` | No | One of `character`, `place`, `prop`, `style`, `reference`. `asset_type` and `assetType` are accepted. |
| `required` | No | Defaults to `true`. Required unresolved references block the prompt. |

## Alias Scope

Aliases are unique per Asset type, not globally across the whole Project.

Example: a `place` and a `style` may both use alias `bedroom` only if imports specify type where needed. If an untyped reference name matches more than one active Asset, the prompt must become ambiguous/blocked until the user resolves it manually.

## Resolution Rules

Project Studio resolves imported references against active Project Assets by Asset display/name, Asset aliases, and slug forms of those names. Example: `The Character Bedroom` can match `the-character-bedroom`.

Disabled Assets are ignored. If a reference includes `type`, only Assets of that type are considered. If exactly one active Asset matches, the Prompt Record reference stores `asset_id`, `asset_type`, `asset_name`, and `resolution_status: "resolved"`.

Required references default to `true`. A required reference with no match is `missing`; a required reference with multiple matches is `ambiguous`. Either state marks the Prompt Record `blocked` and `can_generate_images: false`. Optional unresolved references may remain on a `ready` Prompt Record.

## Manual Reference Mapping

Project Studio can repair a blocked reference by mapping it to an existing active Asset. Manual mappings are stored on the Prompt Record reference as `manual_asset_id` and `resolution_source: "manual"`.

The resolver respects manual mappings on later runs. If the mapped Asset is disabled, removed, or incompatible with the reference `type`, the prompt remains `blocked` with a visible reason. Mapping a reference never auto-creates Assets or uploads files.

## Image Generation Gate

Project-aware image generation planning reads Ready Prompt Records through the Project Studio gate. Blocked Prompt Records are excluded. Resolved references contribute Project Asset File metadata (`asset_id`, `asset_file_id`, filename, MIME type, and role). Prompt Records with no references remain valid and use an empty reference list.

The project-aware gate does not attach `assets/reference/Jack.jpg` or any other global reference unless that file is part of an explicit Project Asset.

## Image Variant Records

Project Image Variant records live on the active Project as `image_variants`. Each record links `project_id`, `prompt_id`, `image_run_id`, stable `variant_id`, expected prompt `file_name`, and generated variant filename. The current two-variant MVP maps expected names to `__1` and `__2` generated filenames, preserving compatibility with legacy filename traceability while keeping selection metadata-first. Missing local files remain records with repairable state instead of being dropped.

Selected image state is metadata on the Prompt Record: `selected_variant_id` points to the canonical Image Variant, while `selected_variant_file_name` and `selected_variant_generated_file_name` preserve the expected final filename and generated variant filename. Selecting a variant does not rename or delete files; non-selected variants remain recoverable.

## Empty References

If a prompt record has no accepted reference field, it remains valid with an empty `references` list. No global character, channel-specific reference, or bundled Jack reference is attached.

## Legacy Jack Boundary

The legacy side-panel `prompt-index.json` importer currently attaches `assets/reference/Jack.jpg` through compatibility behavior. New project-aware imports must not attach `assets/reference/Jack.jpg` unless:

- a Project Asset explicitly contains that file, or
- a future migration explicitly maps a legacy reference to a Project Asset.

## Parser

The executable contract lives in `src/shared/project-domain/01-project-json-contract.js` as `globalThis.TFProjectJsonContract`.

Use `TFProjectJsonContract.parsePromptJson(input)` to normalize project-aware prompt JSON before future import/resolution work. It returns:

- `ok`
- `records`
- `errors`
- `warnings`
- `meta.contract_version`
- `meta.canonical_reference_field`
- `meta.accepted_reference_fields`
- `meta.alias_uniqueness_scope`
