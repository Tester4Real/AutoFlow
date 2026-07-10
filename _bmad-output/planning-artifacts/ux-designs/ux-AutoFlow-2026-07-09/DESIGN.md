---
name: AutoFlow Project Studio
status: final
created: "2026-07-09"
updated: "2026-07-09"
description: Dense production workspace for project-based Google Flow image and video generation.
colors:
  surface-base: '#F7F8FA'
  surface-raised: '#FFFFFF'
  surface-subtle: '#EEF1F4'
  ink-primary: '#15171A'
  ink-secondary: '#59606A'
  ink-muted: '#8A929D'
  border: '#D8DEE6'
  border-strong: '#AEB7C2'
  primary: '#256C5F'
  primary-foreground: '#FFFFFF'
  accent: '#C9792B'
  accent-foreground: '#1F1308'
  info: '#3468A8'
  warning: '#B7791F'
  danger: '#B42318'
  success: '#2F7D4F'
  selected: '#E7F4EF'
  selected-border: '#71B39E'
  blocked: '#FFF3D6'
  blocked-border: '#D99A2B'
  queued: '#E9F0FA'
  queued-border: '#7FA1CD'
typography:
  page-title:
    fontFamily: 'Google Sans, Arial, sans-serif'
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.25'
    letterSpacing: '0'
  section-title:
    fontFamily: 'Google Sans, Arial, sans-serif'
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '1.35'
    letterSpacing: '0'
  body:
    fontFamily: 'Google Sans, Arial, sans-serif'
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.45'
    letterSpacing: '0'
  label:
    fontFamily: 'Google Sans, Arial, sans-serif'
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.35'
    letterSpacing: '0'
  caption:
    fontFamily: 'Google Sans, Arial, sans-serif'
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.35'
    letterSpacing: '0'
rounded:
  sm: 4px
  md: 6px
  lg: 8px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
  side-panel-padding: 12px
  studio-gutter: 16px
  row-gap: 8px
components:
  primary-button:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.md}'
  secondary-button:
    background: '{colors.surface-raised}'
    foreground: '{colors.ink-primary}'
    border: '{colors.border}'
    radius: '{rounded.md}'
  danger-button:
    background: '{colors.danger}'
    foreground: '#FFFFFF'
    radius: '{rounded.md}'
  tool-panel:
    background: '{colors.surface-raised}'
    border: '{colors.border}'
    radius: '{rounded.lg}'
  selected-variant:
    background: '{colors.selected}'
    border: '{colors.selected-border}'
    radius: '{rounded.lg}'
  blocked-row:
    background: '{colors.blocked}'
    border: '{colors.blocked-border}'
    radius: '{rounded.md}'
  status-badge:
    radius: '{rounded.full}'
    font: '{typography.caption}'
---

# DESIGN.md: AutoFlow Project Studio

## Brand & Style

AutoFlow Project Studio should feel like a calm production tool, not a creator-brand landing page. The user is managing assets, prompts, generated variants, filenames, queue state, and account recovery; the interface should prioritize scanning, comparison, and repeated action.

The visual metaphor is a production board: projects are workspaces, assets are reusable cast/locations/props, prompt rows are shots, generated images are takes, selected variants become final frames, and video jobs are planned renders. The design should make state obvious without decoration.

The style is compact, work-focused, and stable. Avoid oversized hero areas, marketing copy, decorative gradients, bokeh/orbs, and one-note chromatic themes. Let the media thumbnails and state labels carry the page.

## Colors

- **Base surfaces** use `{colors.surface-base}`, `{colors.surface-raised}`, and `{colors.surface-subtle}` to separate the application shell, panels, and grouped rows.
- **Primary green (`{colors.primary}`)** marks the main next action: create project, import, generate ready images, add selected videos to queue, or run queue.
- **Accent copper (`{colors.accent}`)** marks user decisions that change production state, such as selected variant and finalization controls.
- **Info blue (`{colors.info}`)** marks queued/in-progress operational state.
- **Warning amber (`{colors.warning}` / `{colors.blocked}`)** marks blocked prompts, unresolved references, stale Flow context, and Needs Review jobs.
- **Danger red (`{colors.danger}`)** is reserved for destructive removal, failed jobs, or irreversible clear/reset actions.
- **Success green (`{colors.success}`)** confirms resolved references, selected images, repaired sync, and completed jobs.

Do not use color alone to communicate state. Every important state also needs text and, where compact, an icon.

## Typography

Use Google Sans if already available in the side panel, otherwise fall back to Arial/system sans-serif. Typography should be compact and legible:

- `{typography.page-title}` for Project Studio title and active Project name.
- `{typography.section-title}` for panel headers and major tabs.
- `{typography.body}` for prompt text, metadata, and form content.
- `{typography.label}` for field labels, table headers, and compact state labels.
- `{typography.caption}` for secondary metadata: file names, asset IDs, Flow context, timestamps, and warnings.

Do not scale font size with viewport width. Long filenames and prompt excerpts wrap or truncate with tooltips; they must not resize panels or buttons.

## Layout & Spacing

Use an 8px-based spacing system. Project Studio is a full extension page optimized for desktop-width work, while the side panel remains narrow and operational.

- Side panel: single column, `{spacing.side-panel-padding}`, compact controls, no nested cards.
- Project Studio: app shell with top bar, left navigation, main work area, and optional right details inspector.
- Main work areas use stable row heights, grid tracks, and thumbnail aspect ratios so loading states, selected labels, and warning text do not shift the layout.
- Use panels for functional surfaces. Avoid cards inside cards.
- Image Review rows should reserve fixed thumbnail slots for the two generated variants.

## Elevation & Depth

Depth should be quiet. Use borders and tonal surfaces before shadows.

- Panels: `{components.tool-panel}`.
- Hover: subtle border darkening or background shift, not dramatic shadow.
- Dialogs/drawers: one elevation level above page surface.
- Avoid stacked modal flows. Use a right details drawer or inline resolver when possible.

## Shapes

Corners are practical and compact:

- `{rounded.sm}` for inputs and small controls.
- `{rounded.md}` for buttons, warning rows, and compact groups.
- `{rounded.lg}` for panels, dialogs, thumbnails, and variant containers.
- `{rounded.full}` only for small status badges or icon-only circular affordances.

Do not use large rounded rectangles as decorative text containers. Prefer icon buttons, tabs, segmented controls, and state badges with explicit labels.

## Components

- **Top bar** - Active Project selector, Flow context status, Open Side Panel/Studio bridge, and key actions. Uses `{colors.surface-raised}` with bottom border `{colors.border}`.
- **Left navigation** - Project Settings, Assets, Import / Resolve, Image Review, Video Queue, Gallery / Downloads. Active item uses `{colors.selected}` and left accent border `{colors.selected-border}`.
- **Project selector** - Searchable dropdown with active Project name, blocked count, and queue count. Create Project appears as a command row.
- **Asset tile/list row** - Type icon, display name, aliases, file count, prompt usage count, and warning state. Dense list is default; thumbnail grid is optional for visual browsing.
- **Upload drop zone** - Bordered surface using `{colors.border}`. Empty state text is direct: "Upload reference files."
- **Resolve reference row** - Uses `{components.blocked-row}` when unresolved. Shows missing reference name, type if known, affected prompt count, and Upload/Map action.
- **Prompt row** - File name, prompt excerpt, reference chips, state, generated variant count, selected variant, and video readiness.
- **Variant selector** - Two stable thumbnail slots per prompt for MVP. Selected slot uses `{components.selected-variant}` plus explicit "Selected" label.
- **Video draft row** - Selected thumbnail, animation prompt excerpt, expected output filename, readiness state, and Add to Queue action.
- **Queue row** - Job type icon, project, prompt/filename, state, retry/stop controls, and error detail disclosure.
- **State badge** - Text plus color. Required states: Ready, Blocked, Missing refs, Selected, Needs review, Draft, Queued, Running, Failed, Complete, Stale context.
- **Details inspector** - Right panel for selected project, asset, prompt, variant, or job. Shows editable fields and dependency warnings.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Optimize for scanning many prompts and assets | Build a hero-style dashboard |
| Use stable rows, fixed thumbnails, and compact panels | Let thumbnails, warnings, or buttons resize the layout |
| Make blocked/missing states impossible to miss | Silently skip missing references |
| Use selected state as explicit metadata | Rename/delete local files immediately on selection |
| Keep side panel small and operational | Put full image review in the side panel |
| Use neutral surfaces with distinct state colors | Make the whole app one blue/slate/purple theme |
| Let media thumbnails be the visual focus | Add decorative gradients, orbs, or stock-like imagery |
| Prefer icon buttons with tooltips for repeated operations | Use long text buttons for every tool action |
