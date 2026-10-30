"""Check a music bed in a finished mix: how far it sits under the voice, its level at chosen moments, and whether its
beats stay on the grid across each join.

Usage: python3 -I bed_check.py <mix.wav> <dialogue.wav> <bpm> <grid point> [<moment>,...] [--joins=<t>,<t>...]
The bed is the mix minus the dialogue (the mix sums the dialogue at unity, sample-aligned). The grid point is any video
second where a bed downbeat lands (the drop). Prints:
- the voice's lead over the bed while he speaks: the median and 10-90% range of short-term (3 s) loudness differences;
- the bed's short-term loudness at each moment;
- at each join, the bed's kick onsets within 4 s, as their offset from the nearest beat of the grid.
A clean join keeps the offsets within about 30 ms on both sides. Needs only numpy and ffmpeg.
"""
import subprocess, sys
import numpy as np

SR = 22050
args = [a for a in sys.argv[1:] if not a.startswith('--')]
mix_path, dia_path, bpm, grid = args[0], args[1], float(args[2]), float(args[3])
moments = [float(t) for t in args[4].split(',')] if len(args) > 4 else []
joins = next(([float(t) for t in a.split('=')[1].split(',')] for a in sys.argv if a.startswith('--joins=')), [])

def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()
mix, dia = load(mix_path), load(dia_path)
n = min(len(mix), len(dia))
dia_full = np.zeros(len(mix), dtype=np.float32); dia_full[:n] = dia[:n]
bed = mix - dia_full

# Band filters by FFT overlap-add: Hann blocks at 50% overlap sum to one, so the band passes unchanged.
def band(x, keep):
    nfft = 1 << 16; out = np.zeros_like(x); mask = keep(np.fft.rfftfreq(nfft, 1 / SR)).astype(np.float32)
    for i in range(0, len(x), nfft // 2):
        seg = x[i:i + nfft]
        if len(seg) < nfft: seg = np.pad(seg, (0, nfft - len(seg)))
        y = np.fft.irfft(np.fft.rfft(seg * np.hanning(nfft)) * mask, nfft); out[i:i + nfft] += y[:min(nfft, len(x) - i)]
    return out
# Short-term loudness proxy: 3 s RMS in dB above 100 Hz (a rough K-weighting), every 0.1 s.
def highpass(x): return band(x, lambda f: f > 100)
def short_term(x):
    hop, win = int(0.1 * SR), int(3 * SR)
    p = np.convolve(highpass(x) ** 2, np.ones(hop) / hop, mode='same')[::hop]
    k = win // hop
    return 10 * np.log10(np.convolve(p, np.ones(k) / k, mode='same') + 1e-12)
S_bed, S_dia = short_term(bed), short_term(dia_full)
t = np.arange(len(S_bed)) * 0.1
speech = S_dia > S_dia.max() - 18
lead = S_dia[speech] - S_bed[speech]
print(f'{mix_path}\n  voice over bed while he speaks: median {np.median(lead):.1f} dB, 10-90% {np.percentile(lead, 10):.1f} to {np.percentile(lead, 90):.1f} dB')
for m in moments:
    i = int(round(m / 0.1)); print(f'  bed at {m:7.2f} s: {S_bed[i]:6.1f} dB (voice {S_dia[i]:6.1f})')

if joins:
    # Kick onsets of the bed: rises of its 5 ms low-band envelope.
    low = band(bed, lambda f: f < 140)
    env = np.sqrt(np.convolve(low ** 2, np.ones(110) / 110, mode='same')); d = np.diff(env, prepend=env[0]); d[d < 0] = 0
    beat = 60 / bpm
    for jt in joins:
        s, e = int((jt - 4) * SR), int((jt + 4) * SR); seg = d[s:e]; thr = 0.35 * seg.max(); picks = []
        for i in np.argsort(seg)[::-1]:
            if seg[i] < thr: break
            if all(abs(i - j) > 0.12 * SR for j in picks): picks.append(i)
        on = np.sort(np.array(picks) + s) / SR
        off = (on - grid + beat / 2) % beat - beat / 2
        before, after = off[on < jt], off[on >= jt]
        fmt = lambda a: ' '.join(f'{1000 * v:+.0f}' for v in a)
        print(f'  join {jt:7.2f} s: offsets ms before [{fmt(before)}] after [{fmt(after)}]')
