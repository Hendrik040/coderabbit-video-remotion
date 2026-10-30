---
name: launch-look-cutaways
description: Use this skill whenever building or revising full-screen product cutaways in the look of CodeRabbit's launch films (Leon's Triage, Change Stack and Secure films) in Remotion, or a presenter-led product film (a walk-and-talk, a product update) that mixes such cutaways with floating product-UI cards. It covers dark plates with rail wipes; the attack surface map with a DeepScan sweep, red vulnerable tiles and exploit paths; voxel AI AGENT cursors; a PR dot field; an app rebuilt from Figma with camera push-ins; blast-radius graphs; commit graphs from real data; studio wipes, colour-bar straps and the sting outro; and music beds fitted to the cut. Use it to decide which beats go full screen and which float, to work through Cutroom notes on such a film, and to render, verify and deliver it, even when the user only says "make it look like the launch videos", "use Leon's animations" or "another walk-and-talk".
metadata:
  version: 1.2.0
---

# Launch-look cutaways

A presenter film that explains products needs two kinds of graphics:

- **Floating cards** beside the presenter, for the story and claim beats. These come from `product-ui-animations`.
- **Full-screen cutaways**, for the beats whose content is the product's own data or UI. These use the look of CodeRabbit's launch films, made by Leon's studio (LaunchAnything): dark plates, the attack surface map, voxel agent cursors, the app rebuilt from Figma with the camera pushing in.

This skill covers the second kind, and how the two mix in one film edited as one Remotion composition.

## The worked example

The walk-and-talk final cut is in `studio/src/walktalk-final/` of this repo, on branch `claude/walk-talk-final-cut`. Until that branch is merged, it exists only in the local checkout (`~/Desktop/motion-graphics`). Check `git log` for which versions are committed.

- It went through five versions. The presenter reviewed V1–V4 in Cutroom (2–10 notes each); V5 answers his V4 notes, and three music alternatives of V5 swap only its bed.
- Its cue sheet `cues.ts` keeps every version, so each step can be compared with the next.
- Read its README section "Walk-and-talk final edit" before changing it.

## Related skills and inputs

| Skill or tool | Where | Use it for |
| --- | --- | --- |
| `product-ui-animations` | `.claude/skills/` on main (worktree `~/Desktop/motion-graphics-skill`) | The floating cards and the card kit |
| `launch-video-editing` | private repo Hendrik040/editing-skills | Cutting the footage |
| The presenter build | `~/Documents/recording-studio` | `build.py` with an edit plan per film |

**What the edit hands over:**
- the A-roll as one graded file;
- the dialogue master WAV;
- `edit-map.json` (clip ranges on the output clock);
- a word-timing JSON: a list of `[word, start, end]` in edit seconds.

These go into a gitignored `.studio-data/<film>/public/media/`.

## When to use it

- A presenter-led film with product explanations: a walk-and-talk, a founder or product update, a launch recap.
- A beat whose content is a map, an app's real UI, a field of items, or more than about four labelled rows.
- Reproducing the launch films' look in Remotion, or extending the worked example's scenes.
- Reviewing or revising such a film from Cutroom notes, and rendering, checking and delivering it.

Not for:

- Floating inserts only, composited over footage elsewhere. Use `product-ui-animations`.
- Cutting the presenter footage itself: takes, joins, audio cleanup. Use `launch-video-editing` and the presenter build.
- The launch films themselves, which Leon's studio makes in After Effects.

## Which beat gets which

In V3 of the example, a several-product film, about 35% of the running time is full-screen plates, 35% floating cards, and 30% clean presenter plus the outro.

1. **Floating cards (product-ui-animations) for story and claim beats.** Examples: what shipped, the problem statement, the PR inbox, the closing recap. He keeps talking to camera, so keep him in the shot.
2. **A full-screen plate when the beat depends on reading a map, app chrome or more than about four labelled rows.**
   - Examples: the chart, the Triage dot field, the Change Stack app, the Security map.
   - A card can still carry a texture graph or abstract rows, if its one beat-critical element is large: the shipped graph's 48 px stat, the review card's "Line N" chip.
   - Inside a plate, push the camera in on what each line names, at 1.2–1.5 times. Don't shrink the UI to fit.
3. **Start small, then grow.** A card can hand off to a plate through a shared element: the PR inbox's chips shrink into the dots of the full-screen field. The viewer sees one thing transform, not a cut.
4. **Keep the close floating over the wide shot.** Show one live miniature per product: a code-review scan, a triage list, a blast radius, the Security map's one scan and chained path. The minis then merge into one card that decodes the name. A full-screen slogan plate was rejected.
5. **Leave scenic and personal moments clean, and never freeze him.** The last shot runs on under the end wipe into the outro.
6. **The brand frame comes from Sourabh's brand studio** (`BrandAsset` and `Wipe` in `WalkTalkFinal.tsx`), not from Leon or the card skill.
   - Use its colour-bar lower thirds: chapter straps per product, plus the presenter's name intro near the end.
   - Use its stack and colour-bar wipes, and the `CR-sting-dark` outro.
   - In a mixed film every full-screen moment is a dark plate. Rebuild the card skill's cream stages (finding, end card) inside `Plate` and `CornerFrame`.
7. **One meaning per element, across both systems:**
   - voxel AI AGENT cursors are agents: several of them, doing visible work, then dissolving;
   - the kit's orange `Cursor` is "you". The example breaks this once: StackV3's "you" is a voxel `Agent` labelled YOU. Use `Cursor` when reusing it;
   - Decode is for names and for one headline title or number per card: the PR inbox title, the shipped stat, the close's name;
   - colours: red means vulnerable; mint means merged, safe or shipped; orange means attention or active; cobalt means agents; grey means closed.
     - A fix that is proposed but not merged keeps its tile red, with a cobalt agent PR chip. It turns mint only on a merge the film shows.
     - Known exceptions in the example: product chips carry product colours (Triage orange, Explain mint, Secure cobalt), and the PR dot field's "Your team" dots are mint.
8. **Plates use the brand wipes.** A plate enters behind its orange rail. It leaves one of two ways:
   - it peels onto the next wipe's bars at their full cover (Triage, Secure);
   - it hides a picture cut under itself and clears onto the new shot (the chart, Explain).
   A floating card never straddles a cut.

**For a single-feature update** (about 90 s), the 35/35/30 split doesn't hold. Give the feature one or two plates, only for its own data or UI. Use cards for the claim and the result. The close is the feature's mini and one result card merging into the name.

## Workflow

0. **No edit yet?**
   - Write the script beat by beat. Mark each beat card or plate, and give each payoff a word that names it.
   - Plan the shots the rules need: a clean side of frame for cards, a wide shot for the close, scenic moments to leave clean.
   - Then cut with `launch-video-editing`.
1. **New film?**
   - Copy `studio/src/walktalk-final/` to `studio/src/<film>/`, keeping only the scenes it uses. Give it its own `Version` type, `cues.ts` and `index.tsx`. Preview with `npx remotion studio studio/src/<film>/index.tsx`.
   - Copy `scripts/render-walktalk-final.mjs` to `scripts/render-<film>.mjs`, with its own spans, section names and paths.
   - Never add another film's versions to the walk-and-talk's `cues.ts`.
2. **Inventory.** Gather:
   - the edit's hand-over (above);
   - Leon's materials (`references/leon-assets.md`);
   - a real source for every number the film will show;
   - the current on-screen product names. Spoken "Change Stack" shows as **Explain** and "Security Agent" as **Secure**. For any other feature, confirm the name with Hendrik before building straps, kickers or the close.
3. **Write the cue sheet in edit seconds.**
   - Add one `Version` per round, built by spreading the previous one, with a new `slug`.
   - Comments quote the words a beat sits under.
   - Cue beats on measured voice onsets (`scripts/onsets.py`). Whisper's word times can be off by 0.4–0.7 s either way.
   - **In V3+, the scenes read `v3.*`**, but the render script reads the base `triage`, `tags`, `stack` and `close` fields for effects and section ranges. Change both together.
   - **Product names live in three places:** `names` (kickers and the close), `straps[].title`, and `shipped.items[].label`. Change all three.
4. **Decide card or plate for each beat** (above). For every floating graphic, map the presenter's face and hair across its whole span, leans included, not just one frame.
5. **Build** from `references/vocabulary.md` (the components) and `references/combining.md` (tokens, type, timing, hand-offs, layout).
6. **Render in stages:** stills, then section renders, then the full film. Render in parts when the disk is tight. Then run the technical checks.
   - Every command needs `--version=<id>`; without it the script renders the old Bay Bridge cut:

     ```
     npm run walktalk:final -- --version=WalkTalkFinalCutV5 [--stills=t1,t2 | --section=triage|stack|security|close|shipped|queue | --frames=a-b | --remux] [--system-chrome]
     ```

7. **Review before delivering:** one agent per lens, each followed by a skeptic (`references/review-and-delivery.md`). Fix, then re-render only the parts that changed.
8. **Deliver** to a Drive folder per version and a new version in the Cutroom stack. Give the direct Cutroom link and the Drive path. Update the README section and memory.

## Rules learned in review

- **Phone first. Size text by its role.**
  - **Beat-critical, at least about 22 px at 1080p:** status lines, chips, strap text, the chart's labels (28 and 22 px), kickers (22 px), name words (64 px), and agent tags while they name an agent.
  - **Texture, at most about 14 px and dim:** lane names on a busy map, a graph's month row, node labels in a mini card.
  - The example still has a few 15–20 px labels in between: badges, PR chips, the tags. Treat them as exceptions, not the target.
  - Check frames downscaled to 640 px wide.
- **Keep graphics off his face and hair, including when he leans.** Measure against the raw A-roll, frame by frame, over the whole span. In the example, a nine-deep pile, a card edge and a landing flash each caught his hair for a few frames, and each needed a fix.
  - This includes soft shadows: a pile's drop shadow dimmed his hair by 19% until it was cast down and left.
  - And the brand straps. The full-width strap (840 px) covers his chin for about 1.4 s as he leans in at 95.5 s. Narrowing it means dropping the "· CodeRabbit" he asked to keep, so it is his call: plan shorter copy or a framing with him before the edit.
  - A skin mask (R−G > 15, G−B > 5, R > 110) also catches yellow foliage. Look at what it counted before you trust the number.
- **Agents do visible work.**
  - Use voxel cursors that drop tiles or drop PRs onto a pile, each PR landing on the pile itself, clear of the tags.
  - Their tags name them only while they arrive: through the fly-in and onto the first tile, gone before the agent moves on (on a card, as he finishes the word "agents").
  - Choreograph where they work. A tag hangs down and right of its cursor, so pick each agent's first tile where the tag clears every red tile and the path. Put the first tiles far apart, so tags never stack. Keep every tile an agent works at least a tile away from the path's lines: one tile beside the path put a cursor, a lock and a ping on it for 2.4 s.
  - Fly in over 0.8–1.0 s, so the cursor decelerates into its tile instead of jumping.
  - The agents dissolve once they stop moving.
  - A chip that says "Background agents" is not enough.
- **Security semantics.**
  - Red means vulnerable.
  - An exploit path chains only red tiles. It runs in the gutters between tiles, never across a green one, and meets each red tile at the middle of an edge, so its warning sign stays clear.
  - A scan should run once and find things. The big map's sweep loops (it suits "continuous monitoring"); `MiniChain` shows the one-pass version.
  - Marks stay in the gutters. A junction square in an 8 px row gutter is 4 px, so it touches neither the red tile nor the one across. A scan box closes onto the gutters (`tight` 22) and lets go once its job is done: the zero-day's as the path reaches it.
  - A number on the map (N POINTS MAPPED) is the drawn tile count: an illustration, unless you have a real count.
- **Data is real and labelled.**
  - Count from a real source (GitHub search, a published post), and say what is counted: merged PRs, not "commits shipped".
  - An illustration says so: "An illustration, not to scale."
  - Quiet months must still show activity, or the graph says nothing happened before.
  - Space a growth graph's levels on a log scale, about 4–6× apart. Linear levels against the busiest day put ten months on one flat level. Let the stat carry the size of the growth. The thresholds hint at private counts, so they go in the data file too.
  - Outlines and brackets sit in gutters, never across a cell.
  - Private numbers stay out of Git: the data file sits in the gitignored media folder and loads at render time.
- **Messaging.**
  - Never say review doesn't scale; say "Human review doesn't."
  - Say "PR inbox", never "merge inbox".
  - On screen, use the current launch names even when the voice uses older ones. Straps read "Explain" and "Secure", with "CodeRabbit" after the body on the details bar (he asked to keep it). Kickers read "CodeRabbit Explain" and "CodeRabbit Secure". Keep straps, kickers, chips and the close consistent.
- **A chip never sits on a line of code.** Give it its own row, like a review comment.
- **Nothing beside a decode moves.** Decode each word in a slot the width of its final text.
- **Small motions:** a PR that drifts onto the pile eases out sideways while it falls; its landing flash draws under it, on the pile's top edge, not through its label.
- **2D transforms only for anything that moves.** Parallel renders dropped 3D-transformed layers in 40–88% of frames. `graphics.tsx`'s `ProductWindow` (V1 era) is still 3D: flatten it before reusing it.

## The worked example's files

All paths are under `studio/src/walktalk-final/` unless noted.

| File | What to take from it |
| --- | --- |
| `cues.ts` | The `Version` type: `v3`, `names`, `media.runOn`, `queue.crew`, `shipped.graph` and `v3.close.beats`. The V3–V5 entries, `crewDrops`, `agentBeats`. |
| `index.tsx` | One `<Composition>` per version. |
| `WalkTalkFinal.tsx` | Draw order: A-roll, wipes, inserts, plates and straps, name intro, then the outro with the closing wipe. Also the run-on. |
| `graphics.tsx` | `ui` tokens, `Stage`, `Plate`, `Kicker`, `Headline`, `Body`, `ListItem`, `Badge`. |
| `secure.tsx` | The attack surface map, `Agent`, `CornerFrame`, `Lock`, `Ping`, `Trace`, and the gutter `route`. |
| `v3.tsx` | `RevealStackWipe`; `TriageV3` (card to dot field); `StackV3` (the app, the camera and the lens mask); `CloseV3` with its minis (`MiniCodeReview`, `MiniTriage`, `MiniBlast`, `MiniChain`); `Sting`. |
| `inserts.tsx` | `ShippedGraph` (two data models and the private-data loader); `ReviewQueue` with its agent `Crew`. |
| `scenes.tsx` | `OutputChart`. |
| `kit.tsx` | The card kit for a mixed film; copy this one, not the Antigravity kit. Its `wipe` keeps card shadows, and it adds `CardHeader`, `Spinner`, `lightCardStyle` and `monoWidth`. |
| `scripts/render-walktalk-final.mjs` (repo root) | The flags above, the mix graph, and the effect cue list. |

## References

- `references/vocabulary.md`: each launch-look component — what it shows, when to use it, its parameters, the pitfalls the code records, and what is not built yet.
- `references/combining.md`:
  - tokens and their conflicts;
  - which kit to copy;
  - type scales and casing;
  - corners, wipes and timing;
  - component durations;
  - hand-offs;
  - layout against a moving presenter;
  - draw order and clocks;
  - fitting a music bed to the cut.
- `references/review-and-delivery.md`:
  - reading Cutroom notes;
  - review briefs, and lenses with skeptics;
  - technical checks;
  - render and mix pitfalls, and chunked renders;
  - delivery.
- `references/leon-assets.md`: what Leon's studio handed over, where it lives, what each piece fed, and where the unbuilt pieces appear in his films.
- `scripts/` (each script's docstring gives its usage):
  - `onsets.py`: measured voice onsets for cues.
  - `note_frames.py`: draws each note's strokes on its frame.
  - `seqcrop.py`, `tile.py`, `review_frames.py`: frame sequences and contact sheets.
  - `glitch_runs.py`: scans for 1–3-frame glitches. It loads the clip into memory, about 3 GB for a three-minute film.
  - `sync12.py`: voice sync check.
  - `verify_section.py`: frames, tags, loudness and sync of a section render.
  - `make_srt.py`: SRT captions from the word list.
  - `music_grid.py`, `bed_check.py`: a music track's beat grid and sections, and a check of the fitted bed in the mix.
  - `daily_prs.py`, `make_graph_data.py`: real merge counts for a commit graph.
