// Full-only explainer moments: the slide eases left (still fully visible) beside an explainer panel
// (motion.py feature_bg / feature_head / feature_panel / feature_ops).
import React, {type ReactNode} from 'react';
import {OffthreadVideo, Sequence, staticFile} from 'remotion';
import {FEATURES} from '../cues';
import {BG, BLUE, COL, DIM, F, FEATURE_GRID, FHGT, FPS, FWID, FX, FY, GRAY, GREEN, INK, INTRO, LINE, MEDIA, ORANGE, PANEL, PEACH, RAISED, SLIDE, SMALL, SPEAKER_FRAMES} from './constants';
import {Bitmap, Ell, Label, Ln, Place, R, RO, Segs, Svg, Txt, gridBitmap, solid, sprite, type Sprite} from './draw';
import {segWrap, tlen, wrap} from './metrics';
import {REVEAL, STAG_F, TRAVEL, int, lerp, prog, pyRound, reveal} from './motion';
import {pill} from './cards';
import type {Ops} from './ops';
import type {ColorName, Feature, Seg, Version} from './types';

const [SX, SY, SW, SH] = SLIDE;
export const featureBg = (): Sprite => ({w: SW, h: SH, el: <Bitmap img={gridBitmap(SW, SH, 60, BG, FEATURE_GRID, [SW - 120, 60, 320, 70, BLUE])}/>});

function featureHead(eyebrow: string, segs: Seg[]): Sprite {
  let yy = 88;
  const lines = segWrap(segs, 'J', 46, FWID).map((ln, i) => { const el = <Segs key={i} line={ln} x={0} y={yy} face="J" size={46} tr={-1.1} color={(c: ColorName) => COL[c]}/>; yy += 54; return el; });
  return sprite(FWID, 300, <Svg w={FWID} h={300}><Label s={eyebrow} x={0} y={24} size={16} fill={ORANGE} tr={1.6}/>{lines}</Svg>);
}
function foot(txt: string) {
  const lines = wrap(txt.toUpperCase(), 'M', 13, FWID - 13 * 0.08 * 60);
  return lines.map((ln, i) => <Txt key={`foot${i}`} s={ln} x={0} y={FHGT - 46 - 19 * (lines.length - 1 - i)} face="M" size={13} fill={DIM} tr={1}/>);
}
/** motion.py cursor(): white arrow, dark outline drawn inside the shape. */
const cursor = (size = 28): Sprite => {
  const pts = [[0, 0], [0, 0.78], [0.22, 0.6], [0.36, 0.92], [0.5, 0.86], [0.36, 0.55], [0.62, 0.55]].map(([x, y]) => `${2 + x * size * 0.9},${2 + y * size * 0.9}`).join(' ');
  return sprite(size, size, <Svg w={size} h={size}>
    <defs><clipPath id="explainer-cursor"><polygon points={pts}/></clipPath></defs>
    <polygon points={pts} fill="#FFFFFF" stroke="#0A0A0A" strokeWidth={3.75} clipPath="url(#explainer-cursor)"/>
  </Svg>);
};

function featurePanel(feat: Feature, f: number): Sprite {
  const lf = f - F(feat.t0), layers: ReactNode[] = [];
  const svg = (...children: ReactNode[]) => layers.push(<Svg w={FWID} h={FHGT}>{children}</Svg>);
  switch (feat.kind) {
    case 'meat_proxy': {
      const flip = f >= F(feat.flip);
      layers.push(<Place s={featureHead('What do you want your life to be?', flip ? [['Or a ', 'ink'], ['fuller human?', 'orange']] : [['A meat proxy?', 'ink']])} x={0} y={90}/>);
      const clicks = feat.clicks.map(F), done = clicks.filter(c => f >= c + 3).length;
      const dim = 1 - 0.7 * REVEAL(prog(f, F(feat.flip), 12));
      for (let i = 0; i < 4; i++) {
        const ry = 330 + i * 86, [a, off] = reveal(lf, 10 + i * 2 * STAG_F, null), ok = i < done;
        const btn = pill(ok ? '✓ Approved' : 'Approve', ok ? GREEN : GRAY, ok, 18);
        const row = sprite(FWID, 70, solid(FWID, 70, PANEL).el, <Svg w={FWID} h={70}>
          <RO x0={0} y0={0} x1={FWID - 1} y1={69} stroke={LINE}/>
          <Label s="Agent PR" x={18} y={27} size={13} fill={DIM} tr={1.2}/>
          <R x0={18} y0={40} x1={18 + [220, 180, 250, 160][i]} y1={50} fill={RAISED}/>
        </Svg>, <Place s={btn} x={FWID - btn.w - 16} y={17}/>);
        layers.push(<Place s={row} x={0} y={ry + off * 0.5} a={a * dim}/>);
      }
      if (!flip) {
        const tgt = Math.min(done, 3), ry = 330 + tgt * 86 + 35, prev = tgt > 0 ? clicks[tgt - 1] : F(feat.t0) + 14;
        const mv = TRAVEL(prog(f, prev + 3, Math.max(4, clicks[Math.min(tgt, 3)] - prev - 3)));
        const px = lerp(FWID - 90, FWID - 70, mv), py = lerp(tgt ? ry - 86 : ry + 40, ry, mv);
        const press = clicks.some(c => f - c >= 0 && f - c < 3);
        layers.push(<Place s={cursor(28)} x={px + (press ? 2 : 0)} y={py + (press ? 2 : 0)} a={REVEAL(prog(lf, 14, 8))}/>);
      }
      svg(<Label s={`Approvals: ${done}`} x={0} y={700} size={17} fill={done ? GREEN : DIM} tr={1.6}/>, foot('Illustration of the "approve, approve, approve" loop Erik describes'));
      break;
    }
    case 'token_trim': {
      layers.push(<Place s={featureHead('Thin > thick  ·  skills', [['Trimmed ', 'ink'], ['~99.6%', 'orange'], [' of skill tokens', 'ink']])} x={0} y={90}/>);
      const s = TRAVEL(prog(f, F(feat.at), 34)), frac = lerp(1, 0.004, s), top = 420, bh = 64;
      svg(<Label s="Before" x={0} y={top - 16} size={13} fill={DIM} tr={1.2}/>, <R x0={0} y0={top} x1={FWID} y1={top + bh} fill={RAISED}/>,
        <Label s="After" x={0} y={top + bh + 58} size={13} fill={ORANGE} tr={1.2}/>);
      const [a] = reveal(lf, 10, null);
      layers.push(<Place s={sprite(FWID, bh, <Svg w={FWID} h={bh}><R x0={0} y0={0} x1={Math.max(4, FWID * frac)} y1={bh - 1} fill={ORANGE}/></Svg>)} x={0} y={top + bh + 66} a={a}/>);
      const pct = lerp(100, 0.4, s);
      svg(<Txt s={s > 0 ? `${pct.toFixed(1)}% of tokens remain` : '100% of tokens'} x={0} y={top + bh * 2 + 140} face="J" size={30} fill={INK} tr={-0.5}/>,
        foot("A tool + workflow analyzed agent traces for a repo's skills, then trimmed them. Bar to scale"));
      break;
    }
    case 'forward_motion': {
      layers.push(<Place s={featureHead('Pattern', [['Forward motion,', 'ink'], [' not loops', 'orange']])} x={0} y={90}/>);
      const u = TRAVEL(prog(f, F(feat.at) + 36, 30)), spin = (lf / FPS) * 1.6, cx = FWID / 2, cy = 470, r = 92, N = 90;
      const pts = Array.from({length: N}, (_, i) => {
        const s = i / (N - 1), ang = spin + s * Math.PI * 2 * 0.92;
        return [lerp(cx + r * Math.cos(ang), lerp(10, FWID - 20, s), u), lerp(cy + r * Math.sin(ang), cy, u)];
      });
      const [a] = reveal(lf, 8, null);
      const [x2, y2] = pts[N - 1], [x1, y1] = pts[N - 4], ang = Math.atan2(y2 - y1, x2 - x1);
      const tri = [[x2 + 14 * Math.cos(ang), y2 + 14 * Math.sin(ang)], [x2 + 12 * Math.cos(ang + 2.5), y2 + 12 * Math.sin(ang + 2.5)], [x2 + 12 * Math.cos(ang - 2.5), y2 + 12 * Math.sin(ang - 2.5)]];
      const squares = u >= 1 ? [0, 1, 2, 3].map(j => {   // drawn at 2x in the engine, inclusive corners
        const tx = lerp(10, FWID - 40, (j + 1) / 5), on = f >= F(feat.at) + 66 + j * 8;
        const l = int((tx - 9) * 2), t = int((cy - 9) * 2), rr = int((tx + 9) * 2), b = int((cy + 9) * 2);
        return <rect key={j} x={l / 2} y={t / 2} width={(rr - l + 1) / 2} height={(b - t + 1) / 2} fill={on ? GREEN : RAISED}/>;
      }) : null;
      layers.push(<Place s={sprite(FWID, FHGT, <Svg w={FWID} h={FHGT}>
        <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke={ORANGE} strokeWidth={5} strokeLinejoin="round"/>
        <polygon points={tri.map(p => p.join(',')).join(' ')} fill={ORANGE}/>
        {squares}
      </Svg>)} x={0} y={0} a={a}/>);
      svg(<Txt s={u >= 1 ? 'loops  →  checkpoints that move forward' : 'an agent loop'} x={0} y={640} face="G" size={22} fill={GRAY}/>,
        foot('Illustration. "Stay away from vibe-orchestrated loops."'));
      break;
    }
    case 'invert_review': {
      layers.push(<Place s={featureHead('How CodeRabbit is built', [['Deterministic orchestration.', 'ink'], [' Model calls where they fit.', 'orange']])} x={0} y={90}/>);
      const inv = REVEAL(prog(f, F(feat.at), 16)), [a0] = reveal(lf, 8, null), ya = 380, yb = 590;
      svg(<Label s="Typical  ·  an agent orchestrates" x={0} y={ya - 24} size={13} fill={DIM} tr={1.2}/>);
      const cxa = 70, cya = 60;
      layers.push(<Place s={sprite(FWID, 140, <Svg w={FWID} h={140}>
        {[0, 1, 2, 3, 4].map(j => {
          const bx = 170 + j * 56, oy = (j % 2) * 62;
          return <React.Fragment key={j}><Ln x0={cxa} y0={cya} x1={bx + 18} y1={22 + oy} w={2} fill={LINE}/><RO x0={bx} y0={10 + oy} x1={bx + 36} y1={34 + oy} stroke={DIM} w={2}/></React.Fragment>;
        })}
        <Ell x0={cxa - 34} y0={cya - 34} x1={cxa + 34} y1={cya + 34} fill={RAISED} stroke={GRAY} sw={2}/>
        <Txt s="agent" x={cxa} y={cya + 5} face="HM" size={14} fill={GRAY} anchor="ms"/>
      </Svg>)} x={0} y={ya} a={a0 * (1 - 0.65 * inv)}/>);
      svg(<Label s="Inverted  ·  pipeline calls models" x={0} y={yb - 24} size={13} fill={ORANGE} tr={1.2}/>);
      const n = 6, bw = 52, gap = (FWID - n * bw) / (n - 1), sx = (((lf / FPS) * 0.5) % 1) * (FWID - 10);
      layers.push(<Place s={sprite(FWID, 120, <Svg w={FWID} h={120}>
        {Array.from({length: n}, (_, j) => {
          const bx = j * (bw + gap);
          return <React.Fragment key={j}>
            {j < n - 1 && <Ln x0={bx + bw} y0={40} x1={bx + bw + gap} y1={40} w={2} fill={LINE}/>}
            <R x0={bx} y0={22} x1={bx + bw} y1={58} fill={PANEL}/><RO x0={bx} y0={22} x1={bx + bw} y1={58} stroke={GRAY} w={2}/>
            {(j === 2 || j === 4) && <><Ln x0={bx + bw / 2} y0={58} x1={bx + bw / 2} y1={84} w={2} fill={ORANGE}/><R x0={bx + bw / 2 - 11} y0={84} x1={bx + bw / 2 + 11} y1={106} fill={ORANGE}/></>}
          </React.Fragment>;
        })}
        <R x0={sx - 6} y0={34} x1={sx + 6} y1={46} fill={GREEN}/>
      </Svg>)} x={0} y={yb} a={inv}/>);
      svg(inv > 0 ? <Label s="Model call" x={FWID - 120} y={yb + 128} size={12} fill={ORANGE} tr={1}/> : null, foot("Illustration — not CodeRabbit's actual pipeline"));
      break;
    }
    case 'bug_rates': {
      layers.push(<Place s={featureHead('Audience Q&A  ·  bug rates', [['Model bug rate', 'ink'], [' vs humans', 'orange']])} x={0} y={90}/>);
      const [m0, m1, m2] = feat.marks.map(F), top = 320, maxw = FWID - 90;
      const rows: [string, number, string, number][] = [['Humans (baseline)', 1.0, GRAY, F(feat.t0) + 10], ['Models · last December', 1.7, ORANGE, m0], ['Models · late spring, then plateau', 1.3, PEACH, m1]];
      svg(...rows.map(([lab, val, col, t0], i) => {
        if (f < t0) return null;
        const g = TRAVEL(prog(f, t0, 18)), y = top + i * 92, x = maxw * val / 1.7 * g;
        return <React.Fragment key={lab}>
          <Txt s={lab} x={0} y={y} face="G" size={20} fill={GRAY}/>
          <R x0={0} y0={y + 14} x1={Math.max(6, x)} y1={y + 46} fill={col}/>
          <Txt s={i ? `~${val.toFixed(1)}×` : '1.0×'} x={x + 12} y={y + 40} face="J" size={24} fill={INK}/>
        </React.Fragment>;
      }));
      if (f >= m2) {
        const [g, off] = reveal(f, m2, null), lx = tlen('~20×', 'J', 70, -2) + 18;
        layers.push(<Place s={sprite(FWID, 120, <Svg w={FWID} h={120}>
          <Txt s="~20×" x={0} y={66} face="J" size={70} fill={GREEN} tr={-2}/>
          <Txt s="more PRs per engineer" x={lx} y={38} face="J" size={24} fill={INK}/>
          <Txt s="in aggregate" x={lx} y={66} face="G" size={20} fill={GRAY}/>
        </Svg>)} x={0} y={600 + off * 0.5} a={g}/>);
      }
      svg(foot('Bug rate per change/commit relative to humans, as stated by Erik from CodeRabbit data'));
      break;
    }
  }
  return sprite(FWID, FHGT, ...layers);
}

/** The talk slide picture at frame `k` of SLIDE_PANEL.mp4, scaled to w x h. */
function SlidePicture({w, h}: {w: number; h: number}) {
  return <Sequence from={INTRO} layout="none" name="Explainer slide">
    <OffthreadVideo src={staticFile(MEDIA.slide)} muted toneMapped={false} style={{position: 'absolute', left: 0, top: 0, width: w, height: h}}/>
  </Sequence>;
}

export function featureOps(ops: Ops, f: number, v: Version) {
  if (v !== 'full') return false;
  for (const feat of FEATURES) {
    const f0 = F(feat.t0), f1 = F(feat.t1);
    if (!(f0 <= f && f < f1)) continue;
    const s = TRAVEL(prog(f, f0, 18)) * (1 - TRAVEL(prog(f, f1 - 18, 18)));
    const [x1, y1, w1, h1] = SMALL;
    const rx = lerp(SX, x1, s), ry = lerp(SY, y1, s), rw = lerp(SW, w1, s), rh = lerp(SH, h1, s);
    ops.add('fbg', featureBg(), SX, SY, 1);
    const k = f - INTRO;
    const pw = Math.abs(rw - SW) < 0.5 ? SW : pyRound(rw), ph = Math.abs(rw - SW) < 0.5 ? SH : pyRound(rh);
    ops.node('fslide', <div style={{position: 'absolute', left: pyRound(rx), top: pyRound(ry), width: pw, height: ph, overflow: 'hidden'}}><SlidePicture w={pw} h={ph}/></div>);
    if (s > 0.02) {
      const iw = int(rw), ih = int(rh);
      ops.add('fframe', sprite(iw + 2, ih + 2, <Svg w={iw + 2} h={ih + 2}>
        <RO x0={0} y0={0} x1={iw + 1} y1={ih + 1} stroke={LINE}/>
        {[[0, 0, 1, 1], [iw + 1, 0, -1, 1], [0, ih + 1, 1, -1], [iw + 1, ih + 1, -1, -1]].map(([cx, cy, sx, sy], i) =>
          <React.Fragment key={i}><Ln x0={cx} y0={cy} x1={cx + 12 * sx} y1={cy} w={2} fill={ORANGE}/><Ln x0={cx} y0={cy} x1={cx} y1={cy + 12 * sy} w={2} fill={ORANGE}/></React.Fragment>)}
      </Svg>), rx - 1, ry - 1, s);
      const lab = k < SPEAKER_FRAMES ? 'Slide' : 'Stage';
      ops.add('flab', sprite(140, 24, <Svg w={140} h={24}><Label s={lab} x={0} y={18} size={14} fill={DIM} tr={1.6}/></Svg>), x1, y1 + h1 + 16, s);
    }
    const [pa, off] = reveal(f, f0 + 8, f1 - 6);
    if (pa > 0) ops.add('fpanel', featurePanel(feat, f), FX + off, FY, pa);
    return true;
  }
  return false;
}
