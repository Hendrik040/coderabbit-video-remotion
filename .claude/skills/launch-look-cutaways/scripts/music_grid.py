"""Find a music track's beat grid and sections, to fit it to a cut: its tempo, its bar lines, and each bar's loudness.

Usage: python3 -I music_grid.py <track> [<bpm min>-<bpm max>] [--bars]
Prints the tempo, the first downbeat, the bar length, and with --bars one line per bar: its start in seconds, its
loudness in dB, the change from the bar before, and its low-end (kick) level. A jump of 4 dB or more marks a new section;
the biggest early jump is usually the drop. Needs only numpy and ffmpeg.

The downbeat is the beat on which the track's section changes land (the biggest rises in loudness), which suits 4/4
pop and electronic tracks, where every beat can carry the same kick. Check it on a section start, where a crash or a
kick should land.
"""
import subprocess, sys
import numpy as np

SR, HOP, N = 22050, 256, 2048
path = sys.argv[1]
lo, hi = (float(x) for x in (sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith('--') else '80-160').split('-'))
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-map', '0:a:0', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                     capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.float32)
frames = 1 + (len(x) - N) // HOP
window = np.hanning(N).astype(np.float32)
spec = np.empty((frames, N // 2 + 1), dtype=np.float32)
for i in range(0, frames, 4096):
    idx = np.arange(i, min(frames, i + 4096))[:, None] * HOP + np.arange(N)[None, :]
    spec[i:i + len(idx)] = np.abs(np.fft.rfft(x[idx] * window, axis=1))
freqs = np.fft.rfftfreq(N, 1 / SR)
logspec = np.log1p(spec)
# Onset strength: positive spectral flux, then a local mean removed, so steady pads don't count as onsets.
flux = np.maximum(0, np.diff(logspec, axis=0)).sum(axis=1)
flux = np.concatenate([[0], flux])
k = int(0.4 * SR / HOP)
flux = np.maximum(0, flux - np.convolve(flux, np.ones(k) / k, mode='same'))
low = spec[:, freqs < 150].sum(axis=1)
fps = SR / HOP
# Each frame is stamped at its window's centre: a frame's onset energy peaks as the onset reaches the middle of the
# window, so stamping frames at their start puts every beat about 46 ms early.
centre = N / 2 / SR

# Tempo: the autocorrelation peak of the onset envelope within the range, refined to a fraction of a hop.
env = flux - flux.mean()
ac = np.correlate(env, env, mode='full')[len(env) - 1:]
lags = np.arange(len(ac))
valid = (lags >= fps * 60 / hi) & (lags <= fps * 60 / lo)
lag = int(lags[valid][np.argmax(ac[valid])])
a, b, c = ac[lag - 1], ac[lag], ac[lag + 1]
lag += 0.5 * (a - c) / (a - 2 * b + c)
period = lag / fps
# Refine the period over the whole track: the phase-aligned comb score peaks at the true beat length.
def score(p, phase):
    t = phase + np.arange(0, len(x) / SR - phase, p)
    return flux[np.clip(np.round((t - centre) * fps).astype(int), 0, len(flux) - 1)].sum()
best = (0, period, 0)
for p in np.linspace(period * 0.995, period * 1.005, 81):
    for ph in np.linspace(0, p, 48, endpoint=False):
        s = score(p, ph)
        if s > best[0]: best = (s, p, ph)
_, period, phase = best
bpm = 60 / period
beats = phase + np.arange(0, len(x) / SR - phase, period)
# Downbeat: sections start on bar lines, so pick the beat of four that carries the biggest rises in loudness from one
# beat to the next (the eight biggest on each, so one fill can't decide it).
rmsAt = np.array([np.sqrt(np.mean(x[int(t * SR):int((t + period) * SR)] ** 2) + 1e-12) for t in beats])
rise = np.maximum(0, np.diff(20 * np.log10(rmsAt), prepend=20 * np.log10(rmsAt[0])))
down = int(np.argmax([np.sort(rise[i::4])[-8:].sum() for i in range(4)]))
bar = 4 * period
first = beats[down]
print(f'{path}\n  tempo {bpm:.3f} BPM, beat {period:.4f} s, bar {bar:.4f} s, first downbeat {first:.3f} s, '
      f'length {len(x) / SR:.2f} s, {int((len(x) / SR - first) // bar)} whole bars')
if '--bars' in sys.argv:
    rms = np.sqrt(np.convolve(x ** 2, np.ones(HOP) / HOP, mode='same')[::HOP] + 1e-12)
    prev = None
    for i, t in enumerate(np.arange(first, len(x) / SR - bar * 0.5, bar)):
        s, e = int(t * fps), int((t + bar) * fps)
        db = 20 * np.log10(rms[s:e].mean() + 1e-9)
        kick = 20 * np.log10(low[s:e].mean() + 1e-9)
        jump = '' if prev is None else f'{db - prev:+5.1f}'
        mark = '  <-- section' if prev is not None and abs(db - prev) >= 4 else ''
        print(f'  bar {i:3d}  {t:7.3f} s  {db:6.1f} dB  {jump:>6}  low {kick:5.1f}{mark}')
        prev = db
