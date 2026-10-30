import React, {type CSSProperties, type ReactNode} from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {
  C, MONO, SANS, Caret, Check, Chip, Connector, Cursor, Decode, Logomark, PixelCorners, PixelField,
  abs, appear, clamp01, envelope, reveal, travel, typedCount, useBrandFonts, useClock, wipe,
} from './kit';

/* Timeline placements (29.97 fps frames). Cues inside each scene are composition seconds,
 * taken from the ASR word timings of the v4 edit, so every beat lands on the spoken word. */
export const PLACEMENTS = {
  cli: {start: 143, frames: 192},
  prompt: {start: 689, frames: 457},
  login: {start: 1146, frames: 211},
  questions: {start: 1714, frames: 169},
  review: {start: 1883, frames: 138},
  finding: {start: 2021, frames: 307},
  changes: {start: 2515, frames: 85},
  end: {start: 2927, frames: 85},
};

const card = (dark: boolean): CSSProperties => ({
  position: 'absolute', borderRadius: 14, overflow: 'hidden',
  background: dark ? C.panel : C.cream, border: `1.5px solid ${dark ? C.rule : C.cream3}`,
  boxShadow: '0 22px 60px rgba(18,16,20,0.42), 0 2px 6px rgba(18,16,20,0.25)',
});

// Tags sit 14 px in from the card edge so they clear the top-left pixel bracket (Cutroom note on v7).
function Tag({children, bg = C.cobalt, fg = C.ink, style}: {children: ReactNode; bg?: string; fg?: string; style?: CSSProperties}) {
  return <Chip bg={bg} fg={fg} size={21} style={style}>{children}</Chip>;
}

/* 08 · Install: the exact command, typed on the spoken words. No terminal output is shown. */
export function CliInstall() {
  useBrandFonts();
  const {t} = useClock(PLACEMENTS.cli.start);
  const IN = 1.72, OUT = 5.96;
  const cmd = 'agy plugin install coderabbit';
  const b = cmd.indexOf('coderabbit'), e = b + 'coderabbit'.length; // brand word, eased to orange once typed
  const n = typedCount(t, [[2.99, 0], [3.10, 3], [4.02, 3], [4.03, 4], [4.24, 10], [4.58, 10], [4.59, 11], [4.84, 18], [5.16, 18], [5.17, 19], [5.52, 29]]);
  const shown = cmd.slice(0, n);
  const brand = t > 5.6 ? reveal((t - 5.6) / 0.3) : 0;
  const x = 96, y = 340, w = 800, h = 132;
  return <AbsoluteFill>
    <PixelCorners x={x} y={y} w={w} h={h} t={t} start={IN - 0.12} end={OUT}/>
    <div style={{...abs(x + 14, y - 46), ...wipe(t, IN, OUT)}}><Tag>Terminal</Tag></div>
    <div style={{...card(true), left: x, top: y, width: w, height: h, ...wipe(t, IN + 0.06, OUT)}}>
      <div style={{position: 'absolute', left: 34, top: 0, bottom: 0, display: 'flex', alignItems: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 38, color: C.text, whiteSpace: 'pre'}}>
        <span style={{color: C.orange}}>$ </span>
        <span>{shown.slice(0, b)}</span>
        <span style={{color: `color-mix(in srgb, ${C.orangeSoft} ${brand * 100}%, ${C.text})`}}>{shown.slice(b, e)}</span>
        <span>{shown.slice(e)}</span>
        <Caret t={t} h={36} w={16} blinkFrom={5.55}/>
      </div>
    </div>
  </AbsoluteFill>;
}

/* D1 + 03 · The prompt, read phrase by phrase, then the review loop it asks for. */
type Seg = {text: string; hl?: string; at?: number};
const PROMPT: Seg[] = [
  {text: 'Build a login flow with '},
  {text: 'rate limiting', hl: C.orange, at: 3.94},
  {text: ', '},
  {text: 'session handling', hl: C.mint, at: 4.88},
  {text: ', and '},
  {text: 'password resets', hl: C.cobalt, at: 6.24},
  {text: '. Then '},
  {text: 'review the changes with CodeRabbit', hl: C.orange, at: 8.6},
  {text: ', '},
  {text: 'fix critical and major findings', hl: C.cobalt, at: 10.7},
  {text: ', and '},
  {text: 'review again', hl: C.orange, at: 12.82},
  {text: '. '},
  {text: 'Report anything unresolved', hl: C.mint, at: 13.38},
  {text: '.'},
];

function TreeChip({t, at, end, x, y, bg, children, from, fg = C.ink, connector = C.dim}: {
  t: number; at: number; end: number; x: number; y: number; bg: string; children: ReactNode; from: [number, number]; fg?: string; connector?: string;
}) {
  const leave = envelope(t, at, end, 0.35, 0.3).b;
  return <>
    <div style={{opacity: 1 - leave}}>
      <Connector points={[from, [from[0], y + 22], [x - 8, y + 22]]} progress={reveal((t - at + 0.18) / 0.3)} color={connector}/>
    </div>
    <div style={{...abs(x, y), ...wipe(t, at, end)}}><Chip bg={bg} fg={fg} size={22}>{children}</Chip></div>
  </>;
}

export function PromptLoop() {
  useBrandFonts();
  const {t} = useClock(PLACEMENTS.prompt.start);
  const IN = 0.25, OUT = 14.85;
  const total = PROMPT.reduce((s, p) => s + p.text.length, 0);
  let budget = Math.round(total * clamp01((t - 0.55) / 1.55));
  const x = 96, y = 140, w = 710, h = 300;
  const rootX = 128, rootY = y + h;
  const phase2 = 7.55;
  return <AbsoluteFill>
    <PixelCorners x={x} y={y} w={w} h={h} t={t} start={IN - 0.12} end={OUT}/>
    <div style={{...abs(x + 14, y - 46), ...wipe(t, IN, OUT)}}><Tag>Antigravity</Tag></div>
    <div style={{...card(true), left: x, top: y, width: w, height: h, ...wipe(t, IN + 0.06, OUT, 0.55)}}>
      <div style={{position: 'absolute', left: 30, top: 24, fontFamily: MONO, fontSize: 18, color: C.muted}}>prompt</div>
      <div style={{position: 'absolute', left: 30, right: 30, top: 58, fontFamily: SANS, fontSize: 26, lineHeight: '38px', color: C.text}}>
        {PROMPT.map((s, i) => {
          const visible = s.text.slice(0, Math.max(0, budget));
          budget -= s.text.length;
          if (!s.hl || s.at === undefined) return <span key={i}>{visible}</span>;
          const p = reveal((t - s.at) / 0.45);
          const fade = s.at < phase2 ? 1 - 0.55 * reveal((t - phase2) / 0.4) : 1;
          return <span key={i} style={{
            backgroundImage: `linear-gradient(${s.hl}, ${s.hl})`, backgroundRepeat: 'no-repeat',
            backgroundSize: `${p * 100}% 100%`, backgroundPosition: '0 0', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone',
            color: p > 0.5 ? C.ink : C.text, borderRadius: 3, padding: '1px 2px', opacity: fade,
          }}>{visible}</span>;
        })}
        <div style={{color: C.muted, marginTop: 6, opacity: clamp01((t - 2.0) / 0.3)}}>Use Node.js with a dark UI, orange accents, synthetic users…</div>
      </div>
    </div>
    {/* Phase 1: the three requirements branch out of the prompt. */}
    <TreeChip t={t} at={3.94} end={phase2} x={168} y={rootY + 40} bg={C.orange} from={[rootX, rootY]}>rate limiting</TreeChip>
    <TreeChip t={t} at={4.88} end={phase2 + 0.05} x={168} y={rootY + 100} bg={C.mint} from={[rootX, rootY]}>session handling</TreeChip>
    <TreeChip t={t} at={6.24} end={phase2 + 0.1} x={168} y={rootY + 160} bg={C.cobalt} from={[rootX, rootY]}>password resets</TreeChip>
    {/* Phase 2: the review loop the prompt asks Antigravity to run. */}
    <TreeChip t={t} at={8.6} end={OUT} x={168} y={rootY + 40} bg={C.orange} from={[rootX, rootY]}><Logomark size={24} onColor/>review the changes</TreeChip>
    <TreeChip t={t} at={10.7} end={OUT} x={168} y={rootY + 100} bg={C.cobalt} from={[rootX, rootY]}>fix critical + major</TreeChip>
    <TreeChip t={t} at={12.82} end={OUT} x={168} y={rootY + 160} bg={C.orange} from={[rootX, rootY]}><Logomark size={24} onColor/>review again</TreeChip>
    <TreeChip t={t} at={13.38} end={OUT} x={168} y={rootY + 220} bg={C.mint} from={[rootX, rootY]}>report anything unresolved</TreeChip>
    <div style={{opacity: 1 - envelope(t, 12.95, OUT, 0.3, 0.3).b}}>
      {/* Chip right edges: "review again" ends near x 388, "review the changes" near x 468 (Hack 22 px advance). */}
      <Connector points={[[398, rootY + 182], [528, rootY + 182], [528, rootY + 62], [488, rootY + 62]]} progress={reveal((t - 12.95) / 0.5)} color={C.orange} width={2.5} node={false}/>
    </div>
    <svg style={{position: 'absolute', left: 472, top: rootY + 53, opacity: clamp01((t - 13.4) / 0.12) * (1 - envelope(t, 12.95, OUT, 0.3, 0.3).b)}} width={18} height={18} viewBox="0 0 18 18">
      <path d="M16 1 L4 9 L16 17 Z" fill={C.orange}/>
    </svg>
  </AbsoluteFill>;
}

/* D2 · The login demo Antigravity built: test accounts, sign in, signed in, reset. */
function Field({label, value, caret, y}: {label: string; value: string; caret?: boolean; y: number}) {
  return <div style={{position: 'absolute', left: 36, right: 36, top: y}}>
    <div style={{fontFamily: SANS, fontSize: 18, color: C.cream4, marginBottom: 8}}>{label}</div>
    <div style={{height: 52, borderRadius: 10, background: C.paper, border: `1.5px solid ${C.cream3}`, display: 'flex', alignItems: 'center', padding: '0 16px',
      fontFamily: SANS, fontSize: 21, color: C.ink}}>{value}{caret ? <span style={{width: 2, height: 24, background: C.orange, marginLeft: 2}}/> : null}</div>
  </div>;
}

function AppButton({label, y, pressed = 0}: {label: string; y: number; pressed?: number}) {
  return <div style={{position: 'absolute', left: 36, right: 36, top: y, height: 56, borderRadius: 10, background: C.orange,
    filter: `brightness(${1 - 0.18 * pressed})`, transform: `scale(${1 - 0.015 * pressed})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 600, fontSize: 22, color: C.paper}}>{label}</div>;
}

export function LoginDemo() {
  useBrandFonts();
  const {t} = useClock(PLACEMENTS.login.start);
  const IN = 0.2, OUT = 6.66;
  const x = 96, y = 150, w = 760, h = 620;
  const signIn = 4.85, reset = 5.91;
  const email = 'alex@example.com';
  const emailN = Math.round(email.length * clamp01((t - 4.2) / 0.3));
  const pwN = Math.round(12 * clamp01((t - 4.42) / 0.2));
  const stateA = 1 - reveal((t - signIn) / 0.25);
  const stateB = reveal((t - signIn) / 0.25) * (1 - reveal((t - reset) / 0.25));
  const stateC = reveal((t - reset) / 0.25);
  const press = (at: number) => clamp01(1 - Math.abs(t - at - 0.06) / 0.12);
  return <AbsoluteFill>
    <PixelCorners x={x} y={y} w={w} h={h} t={t} start={IN - 0.12} end={OUT} color={C.mint}/>
    <div style={{...abs(x + 14, y - 46), ...wipe(t, IN, OUT)}}><Tag bg={C.ink} fg={C.cream}>localhost:4317</Tag></div>
    <div style={{...card(false), left: x, top: y, width: w, height: h, ...wipe(t, IN + 0.06, OUT, 0.55)}}>
      {/* App header */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 70, borderBottom: `1.5px solid ${C.cream3}`, display: 'flex', alignItems: 'center', padding: '0 32px', gap: 12}}>
        <div style={{width: 30, height: 30, borderRadius: 8, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <svg width={16} height={18} viewBox="0 0 16 18"><path d="M9.5 0L1 10.5h5.5L5.5 18 15 6.8H9.2z" fill={C.paper}/></svg>
        </div>
        <span style={{fontFamily: SANS, fontWeight: 600, fontSize: 24, color: C.ink}}>NexusAuth</span>
        <span style={{flex: 1}}/>
        <Chip bg={C.cream2} fg={C.brown} size={17} weight={400}>port 4317</Chip>
      </div>
      {/* The prompt's three requirements, now part of the app. */}
      <div style={{position: 'absolute', left: 32, top: 90, display: 'flex', gap: 10}}>
        <div style={wipe(t, 1.0, Infinity)}><Chip bg={C.orange} size={17}>rate limiting</Chip></div>
        <div style={wipe(t, 1.35, Infinity)}><Chip bg={C.mint} size={17}>session handling</Chip></div>
        <div style={wipe(t, 1.7, Infinity)}><Chip bg={C.cobalt} size={17}>password resets</Chip></div>
      </div>
      {/* A: sign in, with the demo's synthetic test accounts */}
      <div style={{position: 'absolute', inset: 0, opacity: stateA}}>
        <div style={{position: 'absolute', left: 36, top: 152, fontFamily: SANS, fontSize: 18, color: C.cream4}}>Test accounts</div>
        <div style={{position: 'absolute', left: 36, top: 182, display: 'flex', gap: 10}}>
          {['Alex Morgan', 'Sam Rivera', 'Taylor Chen'].map((name, i) => <div key={name} style={{
            ...appear(t, 4.03 + i * 0.06, Infinity, 0.45), padding: '10px 16px', borderRadius: 10, fontFamily: SANS, fontSize: 19, fontWeight: 600,
            background: i === 0 && t > 4.0 ? C.orangeTint : C.cream2, color: C.ink, border: `1.5px solid ${i === 0 && t > 4.0 ? C.orange : C.cream3}`,
          }}>{name}</div>)}
        </div>
        <div style={{position: 'absolute', left: 36, top: 262, fontFamily: SANS, fontWeight: 600, fontSize: 34, color: C.ink}}>Welcome back</div>
        <Field label="Email" value={email.slice(0, emailN)} caret={t > 4.15 && t < 4.42} y={322}/>
        <Field label="Password" value={'•'.repeat(pwN)} y={420}/>
        <AppButton label="Sign in" y={540} pressed={press(signIn)}/>
      </div>
      {/* B: signed in */}
      <div style={{position: 'absolute', inset: 0, opacity: stateB, transform: `translateY(${(1 - reveal((t - signIn) / 0.4)) * 14}px)`}}>
        <div style={{position: 'absolute', left: 36, right: 36, top: 152, height: 56, borderRadius: 10, background: C.mintTint, display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px',
          fontFamily: SANS, fontWeight: 600, fontSize: 21, color: C.mintDark}}><Check color={C.mintDark}/>Signed in</div>
        <div style={{position: 'absolute', left: 36, top: 240, display: 'flex', alignItems: 'center', gap: 16}}>
          <div style={{width: 64, height: 64, borderRadius: 32, background: C.orange, color: C.paper, fontFamily: SANS, fontWeight: 600, fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>AM</div>
          <div><div style={{fontFamily: SANS, fontWeight: 600, fontSize: 28, color: C.ink}}>Alex Morgan</div>
            <div style={{fontFamily: SANS, fontSize: 19, color: C.cream4, marginTop: 4}}>alex@example.com</div></div>
        </div>
        <div style={{position: 'absolute', left: 36, top: 344, display: 'flex', gap: 10}}>
          <Chip bg={C.mint} size={17}>session active</Chip>
          <Chip bg={C.cream2} fg={C.brown} size={17} weight={400}>HttpOnly cookie</Chip>
        </div>
        <div style={{position: 'absolute', left: 36, top: 400, display: 'flex', gap: 10}}>
          <Chip bg={C.cream2} fg={C.brown} size={17} weight={400}>5 login attempts / 15 min</Chip>
        </div>
      </div>
      {/* C: reset password */}
      <div style={{position: 'absolute', inset: 0, opacity: stateC, transform: `translateY(${(1 - reveal((t - reset) / 0.4)) * 14}px)`}}>
        <div style={{position: 'absolute', left: 36, top: 160, fontFamily: SANS, fontWeight: 600, fontSize: 34, color: C.ink}}>Reset password</div>
        <div style={{position: 'absolute', left: 36, right: 36, top: 214, fontFamily: SANS, fontSize: 20, lineHeight: '28px', color: C.brown}}>Enter your email and we'll generate a secure single-use reset token.</div>
        <Field label="Account email" value={email} y={300}/>
        <AppButton label="Request reset link" y={420} pressed={press(6.42)}/>
      </div>
    </div>
    <Cursor t={t} show={[3.35, OUT]} keys={[
      {t: 3.35, x: 760, y: 900}, {t: 4.03, x: 205, y: 356, click: true}, {t: 4.62, x: 470, y: 716},
      {t: 4.85, x: 470, y: 716, click: true}, {t: 5.95, x: 480, y: 580}, {t: 6.42, x: 480, y: 598, click: true},
    ]}/>
  </AbsoluteFill>;
}

/* 04 · The two questions a review of this login flow has to answer. */
export function Questions() {
  useBrandFonts();
  const {t, frame} = useClock(PLACEMENTS.questions.start);
  const OUT = 5.22;
  const rows = [
    {at: 0.17, y: 420, text: 'Can a password reset token be reused?'},
    {at: 2.85, y: 512, text: 'Does rate limiting handle repeated attempts correctly?'},
  ];
  return <AbsoluteFill>
    <div style={{...abs(96, 330), ...wipe(t, 0.0, OUT)}}><Chip bg={C.cream} fg={C.ink} size={23}><Logomark size={26}/>login flow</Chip></div>
    {rows.map(r => <React.Fragment key={r.text}>
      <div style={{opacity: 1 - envelope(t, r.at, OUT, 0.3, 0.3).b}}>
        <Connector points={[[128, 376], [128, r.y + 33], [148, r.y + 33]]} progress={reveal((t - r.at + 0.15) / 0.3)} color={C.text}/>
      </div>
      <div style={{...abs(156, r.y), ...wipe(t, r.at, OUT, 0.5)}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16, background: C.cream, borderRadius: 10, padding: '12px 22px 12px 12px',
          boxShadow: '0 16px 40px rgba(18,16,20,.35)'}}>
          <Chip bg={C.orange} size={24} pad="8px 13px">?</Chip>
          <span style={{fontFamily: SANS, fontWeight: 600, fontSize: 28, color: C.ink, whiteSpace: 'nowrap'}}>
            <Decode text={r.text} t={t} start={r.at + 0.1} duration={0.55} frame={frame}/>
          </span>
        </div>
      </div>
    </React.Fragment>)}
  </AbsoluteFill>;
}

/* D3 · The plugin guides Antigravity into a CodeRabbit CLI review. */
function Spinner({t, color}: {t: number; color: string}) {
  return <div style={{position: 'relative', width: 20, height: 20}}>{Array.from({length: 8}, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    const phase = ((t * 1.6 - i / 8) % 1 + 1) % 1;
    return <div key={i} style={{position: 'absolute', left: 8 + Math.cos(a) * 8, top: 8 + Math.sin(a) * 8, width: 4, height: 4, background: color, opacity: 0.25 + 0.75 * (1 - phase)}}/>;
  })}</div>;
}

export function ReviewRun() {
  useBrandFonts();
  const {t} = useClock(PLACEMENTS.review.start);
  const OUT = 4.18;
  const cmd = 'coderabbit review --agent --include-untracked';
  const n = Math.round(cmd.length * clamp01((t - 2.3) / 0.95));
  return <AbsoluteFill>
    <div style={{...abs(96, 286), ...wipe(t, 0.12, OUT)}}><Chip bg={C.orange} size={23}><Logomark size={25} onColor/>CodeRabbit plugin</Chip></div>
    <div style={{opacity: 1 - envelope(t, 0.5, OUT, 0.3, 0.3).b}}>
      <Connector points={[[128, 332], [128, 398], [148, 398]]} progress={reveal((t - 0.55) / 0.35)} color={C.text}/>
    </div>
    <div style={{...abs(156, 376), ...wipe(t, 0.85, OUT)}}><Chip bg={C.cobalt} size={22}>Antigravity</Chip></div>
    <div style={{opacity: 1 - envelope(t, 2.0, OUT, 0.3, 0.3).b}}>
      <Connector points={[[188, 422], [188, 476]]} progress={reveal((t - 2.0) / 0.3)} color={C.text}/>
    </div>
    <div style={{...card(true), left: 156, top: 476, width: 660, height: 104, ...wipe(t, 2.15, OUT)}}>
      <div style={{position: 'absolute', left: 26, top: 0, bottom: 0, display: 'flex', alignItems: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 21, color: C.text, whiteSpace: 'pre'}}>
        <span style={{color: C.orange}}>$ </span>{cmd.slice(0, n)}<Caret t={t} h={22} w={10} until={3.35}/>
      </div>
    </div>
    <div style={{...abs(156, 604), ...wipe(t, 3.3, OUT)}}>
      <Chip bg={C.mintDeep} fg={C.mint} size={19} weight={700}><Spinner t={t} color={C.mint}/>review running</Chip>
    </div>
  </AbsoluteFill>;
}

/* 05 · The returned finding: analyzed in context, explained, with a suggested fix. */
const STEPS = [{label: '1  Analyze', at: 0.1}, {label: '2  Finding', at: 5.09}, {label: '3  Suggested fix', at: 8.5}];

export function Finding() {
  useBrandFonts();
  const {t, frame} = useClock(PLACEMENTS.finding.start);
  const codeX = 120, codeY = 236, codeW = 840, codeH = 560;
  const rowH = 52, firstRow = codeY + 92, keyRow = 4;
  const keyY = firstRow + keyRow * rowH;
  const charW = 32 * 0.6021;
  const opX = codeX + 40 + 16 * charW;
  const bars = [520, 380, 0, 610, -1, 560, 0, 440, 300];
  const scan = travel((t - 0.9) / 1.1);
  const keyFocus = reveal((t - 1.95) / 0.4);
  const mark = reveal((t - 6.63) / 0.3);
  const fx = 1030, fy = 404, fw = 770;
  const explanation = 'With maxAttempts at 5, the <= check allows a sixth attempt.';
  const exN = Math.round(explanation.length * clamp01((t - 6.65) / 0.75));
  return <AbsoluteFill style={{background: C.cream}}>
    <PixelField/>
    <Img src={staticFile('brand/orange-typemark.svg')} style={{...abs(120, 84), height: 34, ...appear(t, 0)}}/>
    <div style={{...abs(120, 150), display: 'flex', gap: 10}}>
      {STEPS.map((s, i) => {
        const active = t >= s.at && (i === STEPS.length - 1 || t < STEPS[i + 1].at);
        const done = i < STEPS.length - 1 && t >= STEPS[i + 1].at;
        return <div key={s.label} style={appear(t, i * 0.06)}>
          <Chip bg={active ? C.orange : done ? C.cream3 : 'transparent'} fg={active ? C.ink : done ? C.brown : C.cream4} size={19}
            style={{border: `1.5px solid ${active ? C.orange : C.cream3}`}}>{done ? <Check size={15} color={C.brown}/> : null}{s.label}</Chip>
        </div>;
      })}
    </div>
    {/* Code under review */}
    <div style={{...card(true), left: codeX, top: codeY, width: codeW, height: codeH, ...appear(t, 0.08)}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 62, borderBottom: `1.5px solid ${C.rule}`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 28px',
        fontFamily: MONO, fontSize: 21, color: C.dim}}><span style={{width: 10, height: 10, background: C.orange}}/>src/ratelimit.js</div>
    </div>
    <div style={{position: 'absolute', left: codeX, top: codeY, width: codeW, height: codeH, overflow: 'hidden', ...appear(t, 0.08)}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: firstRow - codeY + scan * (bars.length - 1) * rowH, height: rowH, background: C.mint, opacity: 0.12 * (1 - keyFocus) * (scan > 0 && scan < 1 ? 1 : 0)}}/>
      <div style={{position: 'absolute', left: 0, right: 0, top: keyY - codeY, height: rowH, background: C.raised, opacity: keyFocus}}/>
      <div style={{position: 'absolute', left: 0, width: 5, top: keyY - codeY, height: rowH, background: C.orange, opacity: keyFocus}}/>
      {bars.map((bw, i) => bw > 0 ? <div key={i} style={{position: 'absolute', left: 40, top: firstRow - codeY + i * rowH + 21, width: bw, height: 10, borderRadius: 3,
        background: C.rule, opacity: 1 - 0.45 * keyFocus}}/> : null)}
    </div>
    <div style={{...abs(opX - 5, keyY + 7), width: 2 * charW + 10, height: rowH - 14, background: C.orange, borderRadius: 4, opacity: mark, transform: `scaleX(${0.6 + 0.4 * mark})`}}/>
    <div style={{...abs(codeX + 40, keyY), height: rowH, display: 'flex', alignItems: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 32, color: C.text, whiteSpace: 'pre', ...appear(t, 0.3)}}>
      <span>currentAttempts </span><span style={{color: mark > 0.5 ? C.ink : C.text}}>{'<='}</span><span> maxAttempts</span>
    </div>
    {/* Surrounding codebase used as context */}
    <Connector points={[[codeX + codeW, keyY + 26], [990, keyY + 26], [990, 272], [fx - 8, 272]]} progress={reveal((t - 2.2) / 0.4)} color={C.cream4}/>
    <Connector points={[[990, 330], [990, 342], [fx - 8, 342]]} progress={reveal((t - 2.7) / 0.3)} color={C.cream4}/>
    <div style={{...abs(fx, 248), ...wipe(t, 2.35)}}><Chip bg={C.paper} fg={C.ink} size={20} weight={400} style={{border: `1.5px solid ${C.cream3}`}}><b>config.js</b>MAX_ATTEMPTS: 5</Chip></div>
    <div style={{...abs(fx, 318), ...wipe(t, 2.85)}}><Chip bg={C.paper} fg={C.ink} size={20} weight={400} style={{border: `1.5px solid ${C.cream3}`}}><b>server.js</b>login route</Chip></div>
    {/* The finding CodeRabbit returns */}
    <div style={{...card(false), left: fx, top: fy, width: fw, height: 470, background: C.paper, boxShadow: '0 24px 60px rgba(49,28,21,.16)', ...appear(t, 5.09)}}>
      <div style={{position: 'absolute', left: 30, top: 26, display: 'flex', alignItems: 'center', gap: 14}}>
        <Logomark size={40}/><span style={{fontFamily: SANS, fontWeight: 600, fontSize: 25, color: C.ink}}>CodeRabbit</span>
        <Chip bg={C.orange} size={18} mono={false} weight={600}>Major</Chip>
      </div>
      <div style={{position: 'absolute', left: 30, right: 30, top: 92, fontFamily: SANS, fontWeight: 600, fontSize: 35, color: C.ink, letterSpacing: -0.6}}>
        <Decode text="The sixth attempt gets through." t={t} start={5.2} duration={0.55} frame={frame}/>
      </div>
      <div style={{position: 'absolute', left: 30, right: 30, top: 150, fontFamily: SANS, fontSize: 23, lineHeight: '32px', color: C.brown, minHeight: 64}}>{explanation.slice(0, exN)}</div>
      <div style={{position: 'absolute', left: 30, right: 30, top: 236, height: 58, borderRadius: 8, background: C.orangeTint, display: 'flex', alignItems: 'center', padding: '0 18px',
        fontFamily: MONO, fontWeight: 700, fontSize: 23, color: C.brown, whiteSpace: 'pre', ...wipe(t, 6.7)}}>
        <span style={{color: C.orange}}>−  </span>currentAttempts <span style={{color: C.orange}}>{'<='}</span> maxAttempts
      </div>
      <div style={{position: 'absolute', left: 30, right: 30, top: 306, height: 58, borderRadius: 8, background: C.mintTint, display: 'flex', alignItems: 'center', padding: '0 18px',
        fontFamily: MONO, fontWeight: 700, fontSize: 23, color: C.mintDark, whiteSpace: 'pre', ...wipe(t, 8.5)}}>
        <span>+  </span>currentAttempts <span style={{background: C.mint, color: C.ink, padding: '0 4px', borderRadius: 3}}>{'<'}</span> maxAttempts
      </div>
      <div style={{position: 'absolute', left: 30, top: 388, display: 'flex', alignItems: 'center', gap: 12, ...wipe(t, 8.65)}}>
        <Chip bg={C.mint} size={18}>Suggested fix</Chip>
      </div>
    </div>
    <Connector points={[[opX + charW, keyY + rowH - 6], [opX + charW, fy + 265], [fx - 8, fy + 265]]} progress={reveal((t - 6.7) / 0.45)} color={C.orange} width={2.5}/>
    {/* Antigravity takes the suggestion */}
    <Connector points={[[fx + fw - 40, fy + 470], [fx + fw - 40, fy + 520], [fx + 330, fy + 520]]} progress={reveal((t - 7.9) / 0.4)} color={C.cobalt} width={2.5} node={false}/>
    <div style={{...abs(fx + 30, fy + 497), ...wipe(t, 8.05)}}><Chip bg={C.cobalt} size={20}>Antigravity can use it</Chip></div>
  </AbsoluteFill>;
}

/* D4 · Inspect the change before it ships. */
const FILES = ['package.json', 'public/app.js', 'public/index.html', 'public/styles.css', 'src/config.js', 'src/password-reset.js',
  'src/ratelimit.js', 'src/server.js', 'src/session.js', 'src/users.js', 'test/verify.js'];

export function FilesChanged() {
  useBrandFonts();
  const {t} = useClock(PLACEMENTS.changes.start);
  const OUT = 2.42;
  const x = 96, y = 190, w = 680, h = 560;
  const clicked = t >= 0.95;
  return <AbsoluteFill>
    <PixelCorners x={x} y={y} w={w} h={h} t={t} start={-0.05} end={OUT} color={C.mint}/>
    <div style={{...abs(x + 14, y - 46), ...wipe(t, 0.0, OUT)}}><Tag bg={C.ink} fg={C.cream}>Antigravity</Tag></div>
    <div style={{...card(false), left: x, top: y, width: w, height: h, background: C.paper, ...wipe(t, 0.05, OUT, 0.45)}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 76, borderBottom: `1.5px solid ${C.cream3}`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 22px 0 30px'}}>
        <span style={{fontFamily: SANS, fontWeight: 600, fontSize: 27, color: C.ink}}>11 files changed</span>
        <span style={{fontFamily: MONO, fontWeight: 700, fontSize: 21, color: C.mintDark}}>+2794</span>
        <span style={{fontFamily: MONO, fontWeight: 700, fontSize: 21, color: C.cream4}}>−0</span>
        <span style={{flex: 1}}/>
        <div style={{padding: '11px 18px', borderRadius: 9, background: C.orange, color: C.paper, fontFamily: SANS, fontWeight: 600, fontSize: 21,
          filter: `brightness(${clicked && t < 1.12 ? 0.82 : 1})`}}>Review</div>
      </div>
      {FILES.map((f, i) => {
        const sweep = clamp01((t - 1.05 - i * 0.045) / 0.2);
        return <div key={f} style={{position: 'absolute', left: 0, right: 0, top: 90 + i * 40, height: 40, display: 'flex', alignItems: 'center', gap: 12, padding: '0 30px',
          background: `rgba(104,127,245,${0.13 * sweep})`, ...appear(t, 0.15 + i * 0.035, Infinity, 0.4)}}>
          <span style={{width: 18, height: 18, borderRadius: 4, background: C.mintTint, color: C.mintDark, fontFamily: MONO, fontWeight: 700, fontSize: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center'}}>+</span>
          <span style={{fontFamily: MONO, fontSize: 19, color: C.ink}}>{f}</span>
        </div>;
      })}
    </div>
    <Cursor t={t} show={[0.3, OUT]} keys={[{t: 0.3, x: 690, y: 860}, {t: 0.95, x: 690, y: 236, click: true}, {t: 1.9, x: 520, y: 420}]}/>
  </AbsoluteFill>;
}

/* 07 · End card: install command and docs. */
export function EndCard() {
  useBrandFonts();
  const {t, frame} = useClock(PLACEMENTS.end.start);
  const x = 160;
  return <AbsoluteFill style={{background: C.cream}}>
    <PixelField/>
    <Img src={staticFile('brand/orange-typemark.svg')} style={{...abs(x, 262), height: 62, ...appear(t, 0.5)}}/>
    <div style={{...abs(x, 372), fontFamily: SANS, fontWeight: 600, fontSize: 54, color: C.ink, letterSpacing: -1.2, ...appear(t, 0.58)}}>Plugin for Google Antigravity</div>
    {/* The chip is 31 Hack Bold 44 px glyphs (0.6021 em) plus 2 x 36 px padding wide. */}
    <PixelCorners x={x} y={486} w={31 * 44 * 0.6021 + 72} h={104} t={t} start={0.62} color={C.orange}/>
    <div style={{...abs(x, 486), ...wipe(t, 0.68, Infinity, 0.5)}}>
      <div style={{background: C.ink, borderRadius: 12, height: 104, padding: '0 36px', display: 'flex', alignItems: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 44, color: C.cream, whiteSpace: 'pre'}}>
        <span style={{color: C.orange}}>$ </span>agy plugin install coderabbit
      </div>
    </div>
    <div style={{...abs(x, 636), fontFamily: SANS, fontSize: 32, color: C.brown, ...appear(t, 0.82)}}>
      <Decode text="docs.coderabbit.ai/cli/antigravity" t={t} start={0.86} duration={0.5} frame={frame}/>
    </div>
  </AbsoluteFill>;
}
