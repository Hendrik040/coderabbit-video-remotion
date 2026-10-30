"""Voice sync of a delivery against its dialogue master: the lag of the best band-limited (300-3400 Hz)
cross-correlation in 4 s windows at 12 points spread over the film. Every point should read 0 samples.

Usage: python3 -I sync12.py <delivery.mp4> <dialogue.wav>
"""
import subprocess, sys, numpy as np
SR = 48000
def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32)
def band(x):
    f = np.fft.rfft(x); fr = np.fft.rfftfreq(len(x), 1 / SR); f[(fr < 300) | (fr > 3400)] = 0
    return np.fft.irfft(f, len(x))
mix, dlg = load(sys.argv[1]), load(sys.argv[2])
end = min(len(mix), len(dlg)) / SR - 3
for t in np.linspace(5, end, 12):
    a, b = int((t - 2) * SR), int((t + 2) * SR)
    r, s = band(dlg[a:b]), band(mix[a:b])
    n = len(r); c = np.fft.irfft(np.fft.rfft(r, 2 * n) * np.conj(np.fft.rfft(s, 2 * n)))
    lags = np.r_[np.arange(0, 2400), np.arange(-2400, 0)]; vals = np.r_[c[:2400], c[-2400:]]
    k = int(np.argmax(vals))
    corr = vals[k] / (np.linalg.norm(r) * np.linalg.norm(s) + 1e-12)
    print(f'{t:6.1f}s  lag {int(lags[k]):+5d} samples  corr {corr:.3f}')
