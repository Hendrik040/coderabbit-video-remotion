# Render and verify

Commands for the Rendering section of SKILL.md. `<project>` is the new film's folder name and `<Id>` a composition id. The worked example is `antigravity`.

## Render script

Copy `scripts/render-antigravity.mjs` to `scripts/render-<project>.mjs` and change three things:

- `entryPoint`: `src/<project>/index.tsx`.
- `shots`: one `{id, file, alpha, stills}` entry per insert. `alpha: true` renders a 4444 overlay and `false` an HQ stage. Pick one still per beat: after each word lands, with a chip settled, mid-exit.
- The default output folder: `out/<project>`, or pass `--out=<dir>`.

Run it with `--stills` first, then without. Each insert logs `stills <file>`, and each master `rendered <file>.mov (<n> frames)`. An `--only` id that isn't in `shots` throws.

## CLI fallback

```sh
# Overlay with alpha
npx remotion render src/<project>/index.tsx <Id> out/<project>/<file>.mov \
  --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png --muted

# Full-frame stage
npx remotion render src/<project>/index.tsx <Id> out/<project>/<file>.mov \
  --codec=prores --prores-profile=hq --pixel-format=yuv422p10le --image-format=jpeg --jpeg-quality=95 --muted

# Review still: the .png extension sets the format
npx remotion still src/<project>/index.tsx <Id> out/<project>/frames/<file>-048.png --frame=48
```

- `remotion.config.ts` sets JPEG frames for video. With `--pixel-format=yuva444p10le` and no `--image-format=png`, Remotion stops with "the image format is not PNG".
- Without `--pixel-format`, Remotion sends its default `yuv420p`. The file can be tagged 4444 yet carry no alpha.

## Verify a master

```sh
ffprobe -v error -select_streams v:0 \
  -show_entries stream=codec_tag_string,profile,pix_fmt,r_frame_rate,nb_frames \
  -of default=nw=1 out/<project>/<file>.mov
```

| Field | Overlay | Stage |
| --- | --- | --- |
| `codec_tag_string` | `ap4h` | `apch` |
| `profile` | `4444` | `HQ` |
| `pix_fmt` | `yuva444p12le` | `yuv422p10le` |
| `r_frame_rate` | `30000/1001` | `30000/1001` |
| `nb_frames` | the placement's frame count | the placement's frame count |

FFmpeg decodes ProRes 4444 at 12 bit, so a good overlay reads `yuva444p12le`, not the `yuva444p10le` it was rendered with. A `yuv…` format without the `a` has no alpha. The v7 masters read these values: `08-cli-install.mov` is `ap4h`, `yuva444p12le`, 192 frames.

A 4444 tag alone does not prove alpha, so check it on a frame where the card is open:

```sh
ffmpeg -v error -i out/<project>/<file>.mov -vf "select=eq(n\,110),alphaextract" -frames:v 1 \
  -f rawvideo -pix_fmt gray - | python3 -c "import sys; d = sys.stdin.buffer.read(); print(min(d), max(d))"
```

An open frame prints `0 255`. Frame 0, before any entrance, prints `0 0`.

## Check a still in context

Composite on the edit's presenter picture without inserts, not on the finished master. In the worked example that is the version folder's `render/presenter-picture.mov`, the picture `render_final.py` composites onto.

- Timeline frame = placement start + composition frame.
- Seek seconds = timeline frame × 1001 / 30000.
- Use the placement start of the edit you are checking. `PLACEMENTS` in `scenes.tsx` holds the v6 starts. The v7 cut places the same compositions earlier, for example D3 at 1840 instead of 1883.

For D3 frame 110 in v7: 1840 + 110 = 1950, so seek 65.065 s.

```sh
ffmpeg -v error -ss 65.065 -i <version>/render/presenter-picture.mov -i out/antigravity/frames/d3-review-run-110.png \
  -filter_complex "[0:v][1:v]overlay=0:0" -frames:v 1 check-110.png
ffmpeg -v error -i check-110.png -vf "crop=760:420:60:260,scale=iw*2:-1:flags=neighbor" check-110-2x.png
```

Set the crop (`w:h:x:y`) around the chips and arrows you are checking. Measure the shot's face box on the same composite. The face-zone numbers in SKILL.md belong to the Antigravity shoot.
