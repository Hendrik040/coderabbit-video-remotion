# Triage product asset

PR-02 renders the **existing `TriageScreen` and `ResourceBoard` React mock from
`coderabbitai/website`**, pinned to `f2fcb300a03e26ed81d14712b214a4698e79b864`.
It is not a recreation of the product. The original cards, Focus assignment,
view membership, reviewer suggestions, CSS, labels, icons, and avatars are retained.

Source locations:

- `apps/front/app/components/Common/Heroes/Triage/TriageScreen.tsx`
- `apps/front/app/components/Temp/ResourceBoard/`
- `apps/front/app/components/Common/Heroes/Home/ReviewChangeStackPill.*`
- `apps/front/messages/en.json` (`Triage.board`, `Triage.card`, `Triage.reviewer`)

`upstream.json` records original file hashes and the pinned source revision.
The small Carrot controls are imported from `coderabbitai/carrot-ui` v0.25.0,
using Base UI 1.3.0. Unrelated Carrot components and dependencies are excluded.
Shared Carrot tokens and the native pressable come from the Change Stack import.

## Studio adaptations

- `Triage.tsx` wraps the original screen with a deterministic Remotion clock.
  Cards read their own frame-derived opacity/transform. The board's expensive
  filtering and markup are memoized and do not rerender for each frame.
- The original CSS entrance and transitions are disabled. No timers or
  intersection observers control the showcase. Reduced motion skips entrances.
- Six cards per column cover the clipped board/list artwork. All **1,049 PRs**
  remain available to the source's counting, membership, and Focus-capacity logic.
- `build-product-styles.mjs` strips unused backend fields from the original
  fixture (1.25 MB to 744 KB) and generates scoped Tailwind/Carrot CSS. The original
  payload remains alongside the generated `.motion.json` for provenance.
- `TriageEditor` stores native controls and plain-text card edits in the host
  preset. Board/list layout, per-view grouping, collapsed columns, reviewer panels
  and search, and local subscription-preview settings survive save/export.
- Next Image becomes Remotion `Img` with local assets. Next Intl becomes a small
  interpolator over the website's unchanged English labels.
- Carrot portals stay inside the composition, preserving styling and export
  boundaries. The follow panel uses a fixed sample clock advanced by frames.
- The two-column Focus view uses the source's sizing variable to fill the video
  frame; the priority view keeps the website's three-column framing.

`triage-board` is intentionally separate from the earlier broadcast `triage`
graphic, so existing projects remain compatible. The default 16-second walkthrough
visits Requires Action, All PRs, Delivery Guard, and Safe to close. Scene and Still
modes hold the selected view. The thumbnail is a still of this actual component.

The original mock's disabled filters, reviewer assignment/messaging actions, and
local Slack subscription preview retain their original behavior; no service calls
are made. See the original ResourceBoard README upstream for fixture semantics.
