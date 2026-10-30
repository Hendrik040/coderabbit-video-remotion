"""Build an SRT sidecar from the edit's word timings: cues of at most 76 characters and 6 s, broken at sentence ends,
commas and pauses, on two lines of about 42 characters at most.

Usage: python3 -I make_srt.py <words.json> <out.srt> [fixes.json]
- words.json: a list of [word, start, end] in edit seconds, the same list the cue sheet uses.
- fixes.json (optional): maps a word's index to [text, start or null, end or null], or to null to drop the word. Use it
  for spelling fixes ("merch" -> "merge", "Triage.") and measured onsets (scripts/onsets.py).
A word that starts with '-' joins the one before it ("zero" "-day" -> "zero-day").
"""
import json, sys

words = [list(w) for w in json.load(open(sys.argv[1]))]
fixes = {int(k): v for k, v in json.load(open(sys.argv[3])).items()} if len(sys.argv) > 3 else {}
out = []
for i, w in enumerate(words):
    if i in fixes:
        f = fixes[i]
        if f is None: continue
        text, s, e = f
        w = [text, s if s is not None else w[1], e if e is not None else w[2]]
    if out and w[0].startswith('-'):
        out[-1] = [out[-1][0] + w[0], out[-1][1], w[2]]
        continue
    out.append(w)

MAX = 76
cues, cur = [], []
def text(ws): return ' '.join(w[0] for w in ws)
def flush(ws):
    # Split at the last comma or full stop past 40% of the cue, if there is one.
    n = len(text(ws))
    for j in range(len(ws) - 1, 0, -1):
        if ws[j - 1][0].endswith((',', '.', '?', '!')) and len(text(ws[:j])) >= 0.4 * n:
            cues.append(ws[:j]); return ws[j:]
    cues.append(ws); return []
for w in out:
    if cur and (w[1] - cur[-1][2] >= 0.5):
        cues.append(cur); cur = []
    if cur and (len(text(cur + [w])) > MAX or w[2] - cur[0][1] > 6.0):
        cur = flush(cur)
    cur.append(w)
    if w[0].endswith(('.', '?', '!')) and len(text(cur)) >= 18:
        cues.append(cur); cur = []
if cur: cues.append(cur)
# A cue that opens with the last word or two of the previous sentence gives them back.
k = 1
while k < len(cues):
    c = cues[k]
    j = next((i for i, w in enumerate(c[:2]) if w[0].endswith((',', '.', '?', '!'))), None)
    if j is not None and len(text(cues[k - 1] + c[:j + 1])) <= 88 and c[0][1] - cues[k - 1][-1][2] < 0.5:
        cues[k - 1] = cues[k - 1] + c[:j + 1]
        cues[k] = c[j + 1:]
        if not cues[k]: del cues[k]; continue
    k += 1

def two_lines(s):
    if len(s) <= 42: return s
    splits = [(max(len(s[:k]), len(s[k + 1:])), s[:k], s[k + 1:]) for k in range(len(s)) if s[k] == ' ']
    _, a, b = min(splits)
    return f"{a}\n{b}"

def stamp(t):
    ms = round(t * 1000); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"

lines = []
for k, c in enumerate(cues):
    start, end = c[0][1], c[-1][2] + 0.2
    nxt = cues[k + 1][0][1] if k + 1 < len(cues) else None
    end = max(end, start + 1.0)
    if nxt is not None: end = min(end, nxt - 0.04)
    lines += [str(k + 1), f"{stamp(start)} --> {stamp(end)}", two_lines(text(c)), '']
open(sys.argv[2], 'w').write('\n'.join(lines))
print(len(cues), 'cues; longest line', max(len(l) for l in lines))
