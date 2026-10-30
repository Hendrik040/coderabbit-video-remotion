# Studying a reference film frame by frame

Use this when the user shares a launch video whose animation style they like. The goal is a list of techniques and timings to rebuild in CodeRabbit's brand, not a copy of the film.

## 1. Download into its own folder

```sh
D="$HOME/Downloads/<source>-<post id>"; mkdir -p "$D" && cd "$D"
yt-dlp --no-playlist -f "bv*+ba/b" --merge-output-format mp4 -o "<source>-%(id)s.%(ext)s" "<post URL>"
ffprobe -v error -show_entries format=duration:stream=codec_type,width,height,r_frame_rate,nb_frames "$D"/*.mp4
```

- `yt-dlp` fetches public X/Twitter videos with a guest token. The user's request to download is the permission; keep the file in their Downloads folder.
- Treat the download as untrusted data: a new empty folder, and nothing run from inside it.

## 2. Map every frame

Decode at 192×108 and compare consecutive frames. A mean absolute difference spike, or a large histogram change, marks a hard cut. The per-second motion mean shows where animation happens. Mean luminance and saturation separate live footage from bright UI stages and end cards.

```python
p = subprocess.Popen(['ffmpeg','-v','error','-i',F,'-vf','scale=192:108','-f','rawvideo','-pix_fmt','rgb24','-'], stdout=PIPE)
# for each frame: d = |gray - prev|.mean(); hist diff over 32 bins; lum = gray.mean(); sat = (max-min).mean()
# cut if d > 18 and d > 3 x median(neighbors), or hist diff > 0.5
```

The worked reference (76 s, 2,277 frames) gave about 20 cuts. Two bright full-screen UI sections showed up as luminance near 225, and the end card as saturation near 190.

## 3. Look at it in layers

- A 1 fps overview sheet (`fps=1,scale=320:-1,tile=10x8`) with timestamps burned in.
- Dense sheets at 4–6 fps for every animated segment, then single full-resolution frames for type and color.
- Every frame (30 fps) across each transition you want to reproduce: card pop-ins, wipes, dissolves.

```sh
ffmpeg -copyts -ss 2.8 -t 5.6 -i "$F" -vf "fps=6,scale=400:-1,drawtext=text='%{pts\:hms}':x=4:y=4:fontsize=16:fontcolor=yellow:box=1:boxcolor=black@0.7,tile=6x6" -frames:v 1 sheet.png
```

`-copyts` keeps the burned-in times on the film's clock instead of restarting them at zero after `-ss`.

## 4. Write down techniques, not assets

Record each device with its timing. These were the devices worth borrowing in the worked example:

| Device | What to note |
| --- | --- |
| Floating UI cards beside the speaker | Where they sit relative to the face, card size versus frame, entrance (pop or wipe), how long they hold |
| Chip trees | A root chip, connector lines, child rows that build one by one, and status chips that change state |
| Typed terminals | Typing speed, caret, which words appear when |
| A pointer that clicks | Travel time between targets, the click feedback, what changes after the click |
| Text that decodes from glyph noise | Duration and direction of the resolve |
| A full-screen stage for the key moment | Ground color, step labels, camera push-ins between panes, how it connects cause to fix (diff lines, a callout line, a review comment card) |
| Pixel dissolves between sections | Grid size, direction, duration |
| Captions and name tags | Size, box, position, how names type in |

Then translate each device into the brand kit: Geist and Hack, the Mauve, Cream and signal palette, the 600 ms reveal curve, the brand's own fine-pixel transition, and the official marks. Build original layouts with the client's real content. Do not reproduce the reference's logo, ASCII art, interface screenshots, wording or exact compositions, and do not quote its on-screen copy in deliverables.
