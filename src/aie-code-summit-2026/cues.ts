// Every content cue, explainer and rabbit-line detail, with its time in SEQUENCE seconds
// (program timeline incl. the 72-frame intro). Generated verbatim from the v4 engine's
// source/engine/cues.py; edit the text or times here and re-render.
// Every card restates what Erik says on stage or the exact slide text. Nothing is invented.
import type {Cue, Feature} from './engine/types';

export const O = 'orange', G = 'green', P = 'purple', B = 'blue', W = 'ink';

export const CUES: Cue[] = [
  {id: 'c01', t0: 9.4, t1: 21.5, v: 'LF', kind: 'statement', tab: 'THIS TALK', head: [['A fully autonomous ', W], ['presentation', O]], sub: 'One last change was requested ~3 min before the talk'},
  {id: 'c02', t0: 42.3, t1: 84.5, v: 'LF', kind: 'list', tab: 'ABOUT ERIK', mode: 'check', rows: [['14–15 years in ML & AI', 42.3], ['Coding since 11 · paid for it since 13', 68.4], ['~8 years leading technical teams', 72.7]]},
  {id: 'c03', t0: 87.8, t1: 135.0, v: 'LF', kind: 'pills', tab: 'TODAY', title: 'What Erik will cover', agenda: true, pills: [['Proof', O, 87.8], ['Principles', O, 101.2], ['What life do you want?', O, 110.0], ['Patterns', O, 119.2], ['Techniques', O, 132.6]]},
  {id: 'c04', t0: 137.9, t1: 151.5, v: 'F', kind: 'stat', tab: 'PROOF', value: 1468, fmt: '{:,}', unit: 'PRs', sub: 'merged or closed in the last 5 days  ·  ≈294 per day', color: G},
  {id: 'c05', t0: 163.0, t1: 170.5, v: 'F', kind: 'status', tab: 'RIGHT NOW', states: [['PRs are merging during this talk', G, 163.0]]},
  {id: 'c06', t0: 189.2, t1: 200.5, v: 'F', kind: 'statement', tab: 'ONE ENGINEER', head: [['Nearly 7,000 PRs', O], [' a month', W]], sub: '…from one engineer, who happens to be the CEO'},
  {id: 'c07', t0: 206.4, t1: 214.5, v: 'F', kind: 'status', tab: 'ON STAGE', states: [['Agents still cooking', O, 206.4], ['Agents stopped mid-talk', W, 210.7]]},
  {id: 'c08', t0: 216.2, t1: 266.0, v: 'LF', kind: 'pills', tab: 'HANDLED BY AGENTS', title: 'Delegated, start to finish', pills: [['AIE booth presence', O, 216.2], ['Vendors', G, 217.4], ['Contracts', P, 218.3], ['Booth cupcakes', O, 220.6], ['Clothes & shoes', B, 244.0]]},
  {id: 'c09', t0: 292.9, t1: 316.0, v: 'F', kind: 'seat', tab: 'TRAVEL', head: [['Found an ', W], ['empty middle row', O]], sub: '…and watched it until boarding'},
  {id: 'c10', t0: 330.0, t1: 348.5, v: 'LF', kind: 'stat', tab: 'AGENT-RUN BUSINESS', value: 2000, fmt: '${:,}', unit: 'Stripe payout', sub: "from a business an agent spun up — he wasn't watching", color: G},
  {id: 'c11', t0: 459.8, t1: 472.0, v: 'LF', kind: 'pills', tab: 'WHAT WE WANT SOLVED', title: 'Two kinds of solutions', pills: [['Painkillers · acute pain', O, 459.8], ['Vitamins · quality of life', G, 462.4]]},
  {id: 'c12', t0: 490.9, t1: 506.0, v: 'F', kind: 'statement', tab: "A FIRST MANAGER'S ADVICE", head: [['Delegate it, or ', W], ['solve it', O]], sub: '…so you can move on to higher-order problems'},
  {id: 'c13', t0: 520.6, t1: 537.5, v: 'L', kind: 'list', tab: 'THE LOOP', mode: 'approve', rows: [['Approve', 523.2], ['Approve', 525.0], ['Approve', 527.0], ['…or a fuller human life?', 530.8]]},
  {id: 'c14', t0: 566.4, t1: 600.5, v: 'F', kind: 'steps', tab: 'IMPERATIVE VS DECLARATIVE', rows: [['Imperative', [['do this', 566.4], ['then this', 568.4], ['then this', 570.7]]], ['Declarative', [['this is the end result', 583.1]]]]},
  {id: 'c15', t0: 640.4, t1: 666.0, v: 'F', kind: 'slider', tab: 'AUTONOMY COMFORT', head: [["Everyone's level is ", W], ['different', O]], sub: 'Constraints: workplace policy · token budgets', move: 656.2},
  {id: 'c16', t0: 688.5, t1: 700.0, v: 'L', kind: 'bar', tab: 'SKILLS, TRIMMED', value: '−99.6%', sub: "tokens across a repo's skills, trimmed from agent traces", at: 690.2},
  {id: 'c17', t0: 760.0, t1: 773.5, v: 'F', kind: 'statement', tab: 'THE BITTER LESSON', head: [['Rethink every ', W], ['4–6 months', O]], sub: 'how you think about agents and design architectures'},
  {id: 'c18', t0: 803.4, t1: 830.0, v: 'F', kind: 'never', tab: 'ABSOLUTES', head: 'Never push straight to prod?', flip: 818.0, alt: 'SEV-1? Push the fix.'},
  {id: 'c19', t0: 839.7, t1: 850.5, v: 'LF', kind: 'statement', tab: 'EXPERIENCED ENGINEERS', head: [['Probabilities', O], [' > absolutes', W]], sub: 'Seasoned engineers speak in probabilities, not absolutes'},
  {id: 'c20', t0: 859.9, t1: 871.0, v: 'F', kind: 'list', tab: 'MODEL EMPATHY', mode: 'check', rows: [['What are the failure modes?', 863.3], ['Why did it get blocked?', 865.2], ["Why didn't it do the thing?", 866.1], ["Don't shame them", 869.3]]},
  {id: 'c21', t0: 880.0, t1: 904.0, v: 'F', kind: 'pills', tab: 'SKIP MOST MCPs', title: "Prompts you don't control", pills: [['Uninstall it', O, 884.3], ['Write your own', G, 885.0], ['Use computer & browser use', B, 893.7]]},
  {id: 'c22', t0: 930.0, t1: 950.5, v: 'F', kind: 'venn', tab: 'RE-ARCHITECT FOR AGENTS', reveal: 936.7},
  {id: 's0', t0: 1024.6, t1: 1048.2, v: 'LF', kind: 'slide', head: 'Security sweeps, all the time', sub: 'scan · red-team · repeat'},
  {id: 's1', t0: 1049.0, t1: 1059.5, v: 'LF', kind: 'slide', head: 'Skip skills', sub: 'if you must: thinnest possible'},
  {id: 's2', t0: 1060.3, t1: 1074.0, v: 'LF', kind: 'slide', head: 'Skip .md files', sub: null},
  {id: 's3', t0: 1074.9, t1: 1091.7, v: 'LF', kind: 'slide', head: 'Versioning', sub: null},
  {id: 's4', t0: 1092.5, t1: 1101.7, v: 'LF', kind: 'slide', head: 'Scaffolding · ops', sub: null},
  {id: 's5', t0: 1102.5, t1: 1150.7, v: 'L', kind: 'slide', head: 'Close the loose ends', sub: null},
  {id: 's5f', t0: 1102.5, t1: 1150.7, v: 'F', kind: 'loose', head: 'Close the loose ends', bubble: 1108.6, hook: 1127.1},
  {id: 's7', t0: 1152.3, t1: 1167.0, v: 'LF', kind: 'slide', head: 'Just try', sub: "don't model-shame"},
  {id: 's8', t0: 1167.7, t1: 1202.6, v: 'LF', kind: 'slide', head: 'It takes real, patient work', sub: null},
  {id: 's9', t0: 1203.4, t1: 1215.2, v: 'LF', kind: 'slide', head: 'A meat proxy or a fuller human?', sub: null},
  {id: 'q1', t0: 1302.6, t1: 1318.5, v: 'LF', kind: 'question', n: 1, head: "What's good for humans but not for agents?"},
  {id: 'q1a', t0: 1320.0, t1: 1360.0, v: 'LF', kind: 'pills', tab: 'GOOD FOR BOTH', title: 'Accessibility', pills: [['Accessibility tree', G, 1320.8], ['Great for SEO too', B, 1347.4], ['Most efficient way for agents to browse', O, 1349.6]]},
  {id: 'q1b', t0: 1362.6, t1: 1415.0, v: 'LF', kind: 'pills', tab: "AGENTS DON'T MIND", title: 'Build tools for team process', pills: [['Team practices → tools', G, 1374.0], ['Looping on a PR 30×', O, 1393.1], ['Start over on a new path', P, 1406.0]]},
  {id: 'q1c', t0: 1420.4, t1: 1456.0, v: 'F', kind: 'pills', tab: 'WATCH OUT', title: 'Docs and long files', pills: [['Good docs: great for both', G, 1420.4], ['Huge files: agents may grep only parts', O, 1442.8]]},
  {id: 'q1d', t0: 1460.3, t1: 1494.0, v: 'F', kind: 'pills', tab: 'GOOD FOR AGENTS', title: 'Power tools', pills: [['Advanced git commands', G, 1461.9], ['Linters: go ham', O, 1486.6]]},
  {id: 'q2', t0: 1516.0, t1: 1534.8, v: 'LF', kind: 'question', n: 2, head: 'What bug-rate trends do you see, models vs humans?'},
  {id: 'q2a', t0: 1535.6, t1: 1572.0, v: 'L', kind: 'list', tab: 'AS STATED BY ERIK', mode: 'check', rows: [['Last December: ~1.7× human bug rate per change', 1539.6], ['Late spring: ~1.3×, then a plateau', 1546.0], ['In aggregate: ~20× more PRs per engineer', 1562.3]]},
]

export const FEATURES: Feature[] = [   // Full only
  {id: 'FA', t0: 519.8, t1: 538.0, kind: 'meat_proxy', clicks: [523.2, 524.4, 525.6, 527.0], flip: 530.8},
  {id: 'FB', t0: 674.0, t1: 700.0, kind: 'token_trim', at: 690.2},
  {id: 'FC', t0: 954.0, t1: 969.5, kind: 'forward_motion', at: 954.6},
  {id: 'FD', t0: 978.7, t1: 1012.5, kind: 'invert_review', at: 994.2},
  {id: 'FE', t0: 1535.0, t1: 1574.0, kind: 'bug_rates', marks: [1539.6, 1546.0, 1562.3]},
]

export const QUESTIONS: [number, number, string][] = [
  [1302.6, 1, "What's good for humans but not for agents?"],
  [1516.0, 2, 'What bug-rate trends do you see, models vs humans?'],
]

export const RABBIT_DETAILS = [300.0, 620.0, 905.0, 1240.0, 1440.0];   // Light/Full: subtle line under the logo
