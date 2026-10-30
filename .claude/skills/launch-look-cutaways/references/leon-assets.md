# Leon's materials

Leon's studio (LaunchAnything) made CodeRabbit's launch films. Their handoffs came through the shared Slack channel with the studio, as Drive links. Everything below is local only and gitignored. Ask for the files if a machine doesn't have them.

## Where they live

- **`.studio-data/leon-raw/`** (about 2.7 GB):
  - `finals/`: the films, all 3840 × 2160.

    | File | Length and rate | Contents |
    | --- | --- | --- |
    | `CodeRabbit-Triage-v4-4k.mp4` | 69.1 s, 29.97 fps | |
    | `CodeRabbit-Change-Stack-v2-AUDIO.mp4` | 68.25 s, 24 fps | Blast radius at 35.9–45.3 s: node cards on a dark grid, the camera pushing into the selected node, then a findings panel |
    | `CodeRabbit-Security-Final-2026-08-11.mp4` | 77 s | the dashboard-style Security film |
    | `CodeRabbit-Secure-Launch.mp4` | 86 s | attack surface map, agents, DeepScan |
    | `CodeRabbit-Final-2026-10-27.mp4` | 84.3 s | a later Secure cut, with runtime-verification node boards (LIBRARY and API columns) |

  - `analysis/`: Whisper transcripts of the Triage and Change Stack films.
  - `change-stack/`: the After Effects project (not opened) and footage, including `UI (Figma)` PNGs at about 6332 × 4000. These are the frames the app rebuild copies.
  - `triage/`: its After Effects project and assets: cards, a tags cloud, a settings panel, the triage board, `lock.mp4`.
  - `secure-v2/CodeRabbit-Secure-Collected-files.zip`: 605 MB, not extracted. It holds the project, animatic stills, cursor PNGs, "Fix with AI" art and the music and effects stems.
- **`.studio-data/walk-talk-final/public/media/leon/`:** the handoff images the scenes use.
  - In use: `p1-sandboxer.png`, `p1-align.png`, `cs-popover.png`.
  - Unused: `p1-bootstrap.png`, `p1-db.png`, `cs-item.png`.

## Working with them

- **Extract zips with non-ASCII names using `ditto -x -k <zip> <dir>`.** `unzip` mangles them.
- **Contact sheets of the finals** show his vocabulary fast:

  ```
  ffmpeg -i <final> -vf "fps=1/3,scale=480:-1,tile=5x6" -frames:v 1 sheet.jpg
  ```

- **His After Effects collect reports name the comps worth copying:**
  - Change Stack: "GRAPH - node cascade IN", "UI (Figma) - main build", "UI - ASCII Wipe Scene", "UI Edge Glow", "TXT - word by word".
  - Secure: "Lane headings", "Security points by lane", "Verification tiles grid", "Deep scan", "TRACE", "NODES", "Dotted grid", "3D/4D Mouse Rig", "FIX WITH AI".
- **His projects use Geist Mono, Inter, Source Code Pro and Consolas.** The Remotion scenes use the brand kit's Geist and Hack instead.
- **Rebuild, don't paste.** Rebuild his UI in code from his Figma frames, so it can animate, scale for a phone and stay consistent: the Change Stack app in `StackV3`. Use his raster images only as a whole card (the Triage P1 card).
- **Make sample numbers consistent across the frame,** and say it is a sample.

## Which piece fed which scene

| Leon source | Scene in the worked example |
| --- | --- |
| Secure launch film: lanes, tiles, DeepScan, agents | `SecureLaunch` attack surface map, `Agent` |
| Change Stack film: Figma UI frames, popover | `StackV3` app rebuild; the popover in `StackLaunch` |
| Change Stack film: blast-radius node graph | `MiniBlast` |
| Triage film: P1 card, fast-track pill, dissolved card | `TagsLaunch` |
| The Change Stack hero's 4 px point grid | `Stage` |
| The Secure Update animatic's gap chart | `OutputChart`, without its sample multipliers |

## Where the unbuilt pieces appear

Times are approximate (read off a contact sheet, ±1.5 s) in `finals/CodeRabbit-Final-2026-10-27.mp4`, unless the row names another source.

| Piece | Where | Comp or effect in his projects |
| --- | --- | --- |
| Red threat code passages with warning signs | 6–10 s | — |
| 3D-tilted UI planes: node graph, attack map | about 21 s and 51–54 s | "3D/4D Mouse Rig"; Camera Lens Blur |
| Runtime-verification boards (HIGH RISK) | 39–46 s | "Verification tiles grid" |
| Pixel rain of green tiles | about 48 s | — |
| LIBRARY / API node boards with a mint callout | 57–67 s | "NODES", "TRACE" |
| "Fix with AI" button and its toast | 69–73 s | "FIX WITH AI" (art in the `secure-v2` zip) |
| Word-by-word statement ("the gaps") | about 75 s | "TXT - word by word" (Change Stack project) |
| "Available now" end card | about 81 s | — |
| ASCII wipe, edge glow | Change Stack project | "UI - ASCII Wipe Scene", "UI Edge Glow (loop 12s)" |
| Mosaic and pixelate transitions, light sweeps | both projects' effect lists | Mosaic, S_WipePixelate, CC Light Sweep |

Each piece and the rule for rebuilding it is listed at the end of `vocabulary.md`.
