"""Find short runs (1-3 frames) that differ from the frames around them while those frames match each other.

Usage: python3 -I glitch_runs.py <clip.mp4> [threshold]   (prints frame numbers)
"""
import subprocess
import sys

import numpy as np

clip = sys.argv[1]
threshold = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
w, h = 320, 180
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', clip, '-vf', f'scale={w}:{h},format=gray', '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
f = np.frombuffer(raw, dtype=np.uint8).reshape(-1, h, w).astype(np.float32)
d = lambda i, j: np.abs(f[i] - f[j]).mean()
bad = set()
n = len(f)
for i in range(1, n - 1):
    for k in (1, 2, 3):
        j = i + k  # first good frame after a run of k frames starting at i
        if j >= n:
            break
        before, after, across = d(i, i - 1), d(j, j - 1), d(i - 1, j)
        if before > threshold and after > threshold and across < 0.3 * min(before, after):
            bad.update(range(i, j))
            break
print(n, 'frames;', len(bad), 'bad:', ' '.join(map(str, sorted(bad))))
