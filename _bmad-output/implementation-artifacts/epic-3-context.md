# Epic 3 Context: Ready Image Generation And Variant Review

<!-- Compiled planning artifacts. Edit freely. Regenerate compile-epic-context if planning docs change. -->

## Goal

Epic 3 lets users generate images only from Ready Prompt Records, preserve generated variants under the active Project, review them in Project Studio, and choose one canonical variant without destructive file changes. Selection must remain metadata-first because later video preparation depends on the chosen variant.

## Stories

- Story 3.1: Gate Image Generation By Project Prompt Readiness
- Story 3.2: Persist Image Variant Records And Filename Mapping
- Story 3.3: Build Project Studio Image Review Board
- Story 3.4: Select Canonical Variant With Metadata
- Story 3.5: Handle Selection Changes After Downstream Work

## Requirements & Constraints

Image generation must include only Ready Prompt Records and must not attach hardcoded global references. Image Variant records stay Project-scoped and link stable `variant_id`, `project_id`, `prompt_id`, image run, expected canonical filename, and generated variant filename. Selecting a variant stores canonical mapping metadata on the Prompt Record, keeps alternates visible, and must not rename or delete files. Once downstream video preparation exists, selection changes must update Draft work or mark Ready/queued work as Needs Review while never silently mutating Running or Complete jobs.

## Technical Decisions

Project-domain data persists in the existing `autoflowProjectStateV1` envelope. Shared domain code must remain DOM-free and loaded as ordered classic scripts. Project Studio state writes should go through named state helper commands that validate identity relationships before calling the project-domain update command. No bundler, modules, or new dependency model should be introduced.

## UX & Interaction Patterns

Project Studio uses compact operational rows, explicit state chips, fixed media slots, and visible disabled reasons. Image Review should surface video readiness from selected images, and Video Queue preparation should show Not Ready, Draft, Ready, Needs Review, Running, Failed, and Complete states with concrete reasons and repair/update actions.

## Cross-Story Dependencies

Story 3.5 depends on a minimal Video Draft / Ready Video Job model from Epic 4 so selection-change safety has real downstream records to update or protect.
