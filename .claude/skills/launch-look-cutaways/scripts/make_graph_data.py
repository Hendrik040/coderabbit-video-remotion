"""Turn daily_prs.py's counts into the graph's data file. Write it into the render's gitignored media folder: counts
from a private repository must never enter Git.

Usage: python3 -I make_graph_data.py <daily.json> <out.json> "<source note>" [<level 2>,<level 3>,<level 4>]
The scene reads {firstDay, lastDay, daily, levels, source}; the first day must be a Sunday. levels are the fewest PRs a
day for the three brighter levels (any day with a merge is level 1). By default they are log-spaced from the busiest
day, at 1/48, 1/8 and 1/2 of it, to two significant figures.
"""
import datetime as dt, json, sys
counts = json.load(open(sys.argv[1]))
days = sorted(counts)
first = dt.date.fromisoformat(days[0])
assert first.weekday() == 6, 'the graph starts on a Sunday'
daily = [counts[(first + dt.timedelta(days=i)).isoformat()] for i in range((dt.date.fromisoformat(days[-1]) - first).days + 1)]
weeks = [sum(daily[i:i + 7]) for i in range(0, len(daily) // 7 * 7, 7)]
levels = [int(n) for n in sys.argv[4].split(',')] if len(sys.argv) > 4 else [int(float(f'{max(daily) / k:.2g}')) for k in (48, 8, 2)]
json.dump({'firstDay': days[0], 'lastDay': days[-1], 'daily': daily, 'levels': levels, 'source': sys.argv[3]}, open(sys.argv[2], 'w'))
print(len(daily), 'days,', sum(daily), 'PRs; busiest full week', max(weeks), '; levels', levels)
