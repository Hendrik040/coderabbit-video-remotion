"""PRs merged per UTC day into a repository's branch, counted with GitHub's search API (30 searches a minute, so a
year takes about 13 minutes). Needs `gh` signed in to an account that can read the repository. Resumes from an
existing output file.

Usage: python3 -I daily_prs.py <owner/repo> <branch> <out.json> <first YYYY-MM-DD> <last YYYY-MM-DD>
Start on a Sunday, so each run of seven days is one column of a contribution graph.
"""
import datetime as dt, json, os, subprocess, sys, time
repo, branch, out = sys.argv[1:4]
first, last = dt.date.fromisoformat(sys.argv[4]), dt.date.fromisoformat(sys.argv[5])
counts = json.load(open(out)) if os.path.exists(out) else {}
day = first
while day <= last:
    key = day.isoformat()
    if key not in counts:
        for attempt in range(5):
            r = subprocess.run(['gh', 'api', '-X', 'GET', 'search/issues', '-f', f'q=repo:{repo} is:pr is:merged base:{branch} merged:{key}',
                                '--jq', '.total_count'], capture_output=True, text=True)
            if r.returncode == 0 and r.stdout.strip().isdigit():
                counts[key] = int(r.stdout.strip()); break
            time.sleep(20 * (attempt + 1))
        json.dump(counts, open(out, 'w'), indent=0)
        time.sleep(2.2)
    day += dt.timedelta(days=1)
print('days', len(counts), 'total', sum(counts.values()))
