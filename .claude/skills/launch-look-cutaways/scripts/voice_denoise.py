"""Reduce a dialogue master's background noise clip by clip, without shifting it in time.

What sounded natural on the walk-and-talk: an even reduction, the same floor_db per clip and no speech-aware limits.
The speech-aware options below (hf/mid limits, a deep pause gain) were rejected by ear: silent pauses with noise under
the words sound worse than the raw recording. Check the voice's top end band by band; a dull top sounds "numb".

Usage: python3 -I voice_denoise.py <in.wav> <out.wav> <clips.json> [<hf dB> <mid dB> <release s> <gate|wiener> <pause xi dB>]
clips.json: [{"start": s, "end": s, "floor_db": -20, "over": 1.0}, ...] in the master's seconds, covering it in order. Each clip
gets its own noise profile (its quietest 12% of frames) and its own reduction limit (floor_db), so clips with louder
ambience get more reduction and every clip ends near the same residual floor. Profiles and limits blend over 0.15 s at
each clip boundary. over (default 1) scales a clip's profile in pauses, for noise that wanders more than its quietest frames show;
over_speech (default over) is the scale while he speaks, and mid_db (default MID_DB) the most it takes off below 3 kHz
then: a low limit removes more of the noise under the voice but makes the background breathe after phrases.

Method: a Wiener gain on a decision-directed a-priori SNR (alpha 0.99, at least -20 dB), which keeps speech and suppresses the
"musical noise" of plain spectral subtraction, smoothed over neighbouring bins and frames. The STFT runs offline with a
sqrt-Hann window at 75% overlap, which reconstructs exactly where the gain is 1, so the output stays sample-aligned
with the input. Rumble under 70 Hz always gets the clip's full reduction. Needs only numpy and ffmpeg.
"""
import json, subprocess, sys
import numpy as np

SR, N, HOP, ALPHA = 48000, 1024, 256, 0.99
HF_DB, MID_DB = float(sys.argv[4]) if len(sys.argv) > 4 else -1.0, float(sys.argv[5]) if len(sys.argv) > 5 else -6.0
RELEASE = float(sys.argv[6]) if len(sys.argv) > 6 else 0.4
# gate: in pauses, apply the clip's full reduction to everything. Tried on V5 and rejected: in continuous speech the
# pauses are short, and the result was louder pauses than the Wiener gain.
GATE = (sys.argv[7] if len(sys.argv) > 7 else 'wiener') == 'gate'
PAUSE_XI_DB = float(sys.argv[8]) if len(sys.argv) > 8 else -20.0
src, dst, clips = sys.argv[1], sys.argv[2], json.load(open(sys.argv[3]))
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
stereo = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2)
dual_mono = np.array_equal(stereo[:, 0], stereo[:, 1])
x = stereo[:, 0].astype(np.float64) if dual_mono else stereo.mean(axis=1).astype(np.float64)

win = np.sqrt(np.hanning(N + 1)[:-1])
xp = np.pad(x, (N, 2 * N))
frames = 1 + (len(xp) - N) // HOP
X = np.empty((frames, N // 2 + 1), dtype=np.complex128)
for i in range(0, frames, 4096):
    idx = np.arange(i, min(frames, i + 4096))[:, None] * HOP + np.arange(N)[None, :]
    X[i:i + len(idx)] = np.fft.rfft(xp[idx] * win, axis=1)
P = np.abs(X) ** 2
centre = (np.arange(frames) * HOP + N / 2 - N) / SR
freqs = np.fft.rfftfreq(N, 1 / SR)

# Each clip's noise profile: the mean power of its quietest 12% of frames, smoothed over five bins.
profiles = []
for c in clips:
    inside = (centre >= c['start'] + 0.1) & (centre <= c['end'] - 0.1)
    e = P[inside].sum(axis=1)
    quiet = P[inside][e <= np.percentile(e, 12)]
    profiles.append(c.get('over', 1.0) * np.convolve(quiet.mean(axis=0), np.ones(5) / 5, mode='same') + 1e-20)
# Per frame: the profile and the reduction limit of its clip, blended across the 0.15 s around each boundary.
lam = np.empty_like(P); gmin = np.empty(frames); over = np.empty(frames); over_speech = np.empty(frames); mid_db = np.empty(frames); detect = np.empty(frames)
for k, c in enumerate(clips):
    sel = (centre >= c['start']) & (centre < c['end']) if k < len(clips) - 1 else centre >= c['start']
    if k == 0: sel |= centre < c['start']
    lam[sel] = profiles[k]; gmin[sel] = c['floor_db']; over[sel] = c.get('over', 1.0); over_speech[sel] = c.get('over_speech', c.get('over', 1.0)); mid_db[sel] = c.get('mid_db', MID_DB); detect[sel] = c.get('detect_db', 4.0)
for k in range(1, len(clips)):
    b = clips[k]['start']; sel = np.abs(centre - b) < 0.15
    w = ((centre[sel] - (b - 0.15)) / 0.3)[:, None]
    lam[sel] = (1 - w) * profiles[k - 1] + w * profiles[k]
    gmin[sel] = (1 - w[:, 0]) * clips[k - 1]['floor_db'] + w[:, 0] * clips[k]['floor_db']
    over[sel] = (1 - w[:, 0]) * clips[k - 1].get('over', 1.0) + w[:, 0] * clips[k].get('over', 1.0)
    os0, os1 = (c.get('over_speech', c.get('over', 1.0)) for c in (clips[k - 1], clips[k]))
    over_speech[sel] = (1 - w[:, 0]) * os0 + w[:, 0] * os1
    mid_db[sel] = (1 - w[:, 0]) * clips[k - 1].get('mid_db', MID_DB) + w[:, 0] * clips[k].get('mid_db', MID_DB)
    detect[sel] = (1 - w[:, 0]) * clips[k - 1].get('detect_db', 4.0) + w[:, 0] * clips[k].get('detect_db', 4.0)
gmin_lin = 10 ** (gmin / 20)

# While he speaks, the voice masks the noise, so the gain backs off: at most HF_DB above 3 kHz (the air and consonants
# that a plain Wiener gain dulls) and at most MID_DB below. Presence is the frame's speech-band SNR against the measured
# noise, held for 60 ms and released over RELEASE (0.4 s), so the background fades out after a phrase instead of
# dropping away. In pauses the clip's full reduction applies.
band = (freqs >= 300) & (freqs < 4000)
snr = 10 * np.log10(P[:, band].sum(1) * over / lam[:, band].sum(1) + 1e-12)
# detect_db (default 4): how far above the noise profile a frame must be to count as speech; louder, burstier noise
# needs more, or its bursts are protected like words.
raw_p = np.clip((snr - detect) / 6, 0, 1)
pres = np.empty(frames); level = 0.0; hold = 0
for t in range(frames):
    if raw_p[t] >= level: level, hold = raw_p[t], int(0.06 * SR / HOP)
    elif hold > 0: hold -= 1
    else: level = max(raw_p[t], level - HOP / SR / RELEASE)
    pres[t] = level

def wiener(noise, xi_min_db=-20):
    """A Wiener gain on a decision-directed a-priori SNR against the given noise power, smoothed over five bins and three
    frames (5 ms either side), which takes the flicker out of the residual noise without smearing speech."""
    G = np.empty_like(P)
    g_prev, p_prev = np.ones(P.shape[1]), P[0]
    for t in range(frames):
        gamma = P[t] / noise[t]
        xi = np.maximum(ALPHA * g_prev ** 2 * p_prev / noise[t] + (1 - ALPHA) * np.maximum(gamma - 1, 0), 10 ** (xi_min_db / 10))
        g = np.maximum(xi / (1 + xi), gmin_lin[t])
        G[t] = g; g_prev, p_prev = g, P[t]
    G = np.apply_along_axis(lambda r: np.convolve(r, np.array([1, 2, 3, 2, 1]) / 9, mode='same'), 1, G)
    return np.vstack([G[:1], 0.25 * G[:-2] + 0.5 * G[1:-1] + 0.25 * G[2:], G[-1:]])
# Two noise estimates: the clip's `over` in pauses, so bursts above the profile count as noise, and its gentler
# `over_speech` while he speaks, so the voice is never thinned between its harmonics. Presence blends the two.
# The a-priori SNR floor caps a Wiener gain at about xi_min - 20 dB, so the pause gain gets a lower one (PAUSE_XI_DB)
# to reach the clip's floor; the speech gain keeps -20 dB, which keeps musical noise out of the voice.
pause_gain = wiener(lam, PAUSE_XI_DB) if not GATE else gmin_lin[:, None] * np.ones_like(P)
G = pres[:, None] * wiener(lam / over[:, None] * over_speech[:, None]) + (1 - pres[:, None]) * pause_gain
G[:, freqs < 70] = gmin_lin[:, None]
G = np.maximum(G, gmin_lin[:, None])
def floor_db(db): return 10 ** ((gmin[:, None] * (1 - pres[:, None]) + np.broadcast_to(db, (frames,))[:, None] * pres[:, None]) / 20)
hf = freqs >= 3000
G[:, hf] = np.maximum(G[:, hf], floor_db(HF_DB)); G[:, ~hf] = np.maximum(G[:, ~hf], floor_db(mid_db))

Y = X * G
out = np.zeros(len(xp)); norm = np.zeros(len(xp))
for i in range(0, frames, 4096):
    idx = np.arange(i, min(frames, i + 4096))
    seg = np.fft.irfft(Y[idx], n=N, axis=1) * win
    for j, f in enumerate(idx):
        out[f * HOP:f * HOP + N] += seg[j]; norm[f * HOP:f * HOP + N] += win ** 2
y = (out / np.maximum(norm, 1e-9))[N:N + len(x)]
y = np.repeat(y.astype(np.float32)[:, None], 2, axis=1)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s24le', dst], input=y.tobytes(), check=True)
print(f'{dst}: {len(x) / SR:.3f} s, {"dual mono" if dual_mono else "stereo folded to mono"}, peak {20 * np.log10(np.abs(y).max()):.2f} dBFS')
