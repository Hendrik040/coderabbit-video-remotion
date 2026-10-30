"""Measured voice onsets. Whisper's word times can be off by 0.4-0.7 s either way, so cue beats on the onset in the
dialogue master instead. For each word this lists every rise in level (a 10 ms window crossing a threshold 12 dB
under the loudest window of the surrounding 3 s, after a dip below it) within 0.7 s of its Whisper start, and picks
the one after the longest dip (the pause before the word), then the closest. It is most reliable for a word after a
pause, which is where most beats sit.

Usage: python3 -I onsets.py <dialogue.wav> <words.json> [first index] [last index]
Prints: index, word, Whisper start, measured onset, difference. Check doubtful words by ear or on a spectrogram, and
feed the corrections to the cue sheet (and to make_srt.py's fixes.json).
"""
import json, subprocess, sys
import numpy as np

SR, HOP = 48000, 480
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', sys.argv[1], '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.float32)
rms = np.sqrt(np.mean(x[: len(x) // HOP * HOP].reshape(-1, HOP) ** 2, axis=1)) + 1e-9
db = 20 * np.log10(rms)
words = json.load(open(sys.argv[2]))
first = int(sys.argv[3]) if len(sys.argv) > 3 else 0
last = int(sys.argv[4]) if len(sys.argv) > 4 else len(words) - 1
frame = lambda t: max(0, min(len(db) - 1, int(round(t * SR / HOP))))
for i in range(first, last + 1):
    word, start = words[i][0], words[i][1]
    lo, hi = frame(start - 0.7), frame(start + 0.7)
    threshold = db[frame(start - 1.5):frame(start + 1.5) + 1].max() - 12
    def dip(k):  # frames below the threshold just before a rise
        n = 0
        while k - n - 1 >= 0 and db[k - n - 1] < threshold and n < 100: n += 1
        return n
    rises = [k for k in range(max(1, lo), hi + 1) if db[k] >= threshold and db[k - 1] < threshold]
    best = max(rises, key=lambda k: (dip(k), -abs(k * HOP / SR - start))) if rises else None
    onset = best * HOP / SR if best is not None else None
    shown = f'{onset:8.3f}  {onset - start:+.3f}' if onset is not None else '     n/a'
    print(f'{i:4d}  {word[:18]:18}  {start:8.3f}  {shown}')
