# Key Screen Wireframes

These are lightweight behavioral wireframes for the AutoFlow Project Studio UX. They are not implementation code.

## Side Panel - Operations Cockpit

```text
+------------------------------------------------+
| AutoFlow                                       |
| Project: [Finance Channel v]     Flow: Ready   |
+------------------------------------------------+
| Queue                                          |
| Images: 12 ready / 3 running                   |
| Videos: 8 draft / 2 queued                     |
| Blocked: 3 missing refs                        |
+------------------------------------------------+
| [Import JSON] [Open Project Studio]            |
| [Run Queue]  [Stop]  [Retry Failed]            |
| [Sync Folder]                                  |
+------------------------------------------------+
| Alerts                                         |
| ! scene_04 blocked: missing bedroom            |
| ! Flow context changed: 2 refs need upload     |
+------------------------------------------------+
```

## Project Studio Shell

```text
+--------------------------------------------------------------------------------+
| Project: [Finance Channel v]  Flow: Ready  Blocked: 3  Queue: 2 running         |
+----------------------+---------------------------------------------------------+
| Project Settings     | Section title                                           |
| Assets               | Primary action                         [Details panel] |
| Import / Resolve     |                                                         |
| Image Review         | Main workspace rows / grids                            |
| Video Queue          |                                                         |
| Gallery / Downloads  |                                                         |
+----------------------+---------------------------------------------------------+
```

## Assets

```text
+--------------------------------------------------------------------------------+
| Assets                                                     [+ Add Asset]        |
+--------------------------------------------------------------------------------+
| Type       Name          Aliases           Files     Used by      State         |
| Character  Jack          jack, narrator    2         34 prompts   Complete      |
| Place      Bedroom       bedroom           3         12 prompts   Complete      |
| Prop       Phone         phone             0         4 prompts    No files      |
| Style      Soft 3D       soft-3d           1         18 prompts   Complete      |
+--------------------------------------------------------------------------------+
| Details: Bedroom                                                              |
| Name [Bedroom]  Type [Place]  Aliases [bedroom, room]                         |
| Files: bedroom-wide.png [Primary]  bed-corner.png                             |
+--------------------------------------------------------------------------------+
```

## Import / Resolve

```text
+--------------------------------------------------------------------------------+
| Import / Resolve JSON                                      [Import JSON]       |
+--------------------------------------------------------------------------------+
| Ready prompts (18)                                                             |
| scene_01.png  refs: jack, bedroom                  [Generate ready]            |
| scene_02.png  refs: jack, office                                               |
+--------------------------------------------------------------------------------+
| Blocked prompts (3)                                                            |
| scene_04.png  missing: kitchen                     [Upload / Map kitchen]      |
| scene_07.png  missing: sarah                       [Upload / Map sarah]        |
| scene_11.png  missing: red-car                     [Upload / Map red-car]      |
+--------------------------------------------------------------------------------+
```

## Image Review

```text
+--------------------------------------------------------------------------------+
| Image Review                                        [Generate Ready Images]    |
+--------------------------------------------------------------------------------+
| scene_01.png                                                                    |
| Prompt: Jack sitting on the edge of his bed...                                  |
| Refs: character:jack  place:bedroom                                             |
| +--------------------------+ +--------------------------+                       |
| | Variant 1                | | Variant 2                |                       |
| | [image thumbnail]        | | [image thumbnail]        |                       |
| | scene_01__1.png          | | scene_01__2.png          |                       |
| | [Select]                 | | SELECTED                 |                       |
| +--------------------------+ +--------------------------+                       |
| Video: Draft ready from selected image                         [Review draft]  |
+--------------------------------------------------------------------------------+
```

## Video Queue Builder

```text
+--------------------------------------------------------------------------------+
| Video Queue Builder                                      [Add ready to queue]  |
+--------------------------------------------------------------------------------+
| Ready drafts                                                                    |
| scene_01.mp4  start: scene_01__2.png  prompt: Jack looks toward... [Add]       |
| scene_02.mp4  start: scene_02__1.png  prompt: Camera pushes in... [Add]       |
+--------------------------------------------------------------------------------+
| Not ready                                                                       |
| scene_04.mp4  reason: no selected image                         [Review image] |
| scene_07.mp4  reason: missing sarah reference                    [Resolve refs] |
+--------------------------------------------------------------------------------+
| Queued                                                                          |
| scene_03.mp4  queued                                             [Remove]      |
+--------------------------------------------------------------------------------+
```
