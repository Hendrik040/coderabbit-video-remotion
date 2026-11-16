// Footer cards in the brand presenter-strap style (motion.py render_card / card_state / card_ops).
import React, {type ReactNode} from 'react';
import {CUES} from '../cues';
import {BG, CARD_B, CARD_R, CARD_W, COL, DIM, F, FPS, GRAY, GREEN, INK, LINE, ORANGE, PAD, PANEL, RAISED, RULE, TAB_H, hexRgb, rgba} from './constants';
import {Ell, Label, Ln, Place, R, RO, RRect, Segs, Svg, Txt, crop, sprite, type Sprite} from './draw';
import {getlength, segWrap, tlen, wrap} from './metrics';
import {ENTER_F, EXIT_F, REVEAL, TRAVEL, clamp, int, lerp, prog, pyRound, q, reveal} from './motion';
import type {ColorName, Cue, Seg, Version} from './types';
import type {Ops} from './ops';

const color = (c: ColorName) => COL[c];

// ---------------------------------------------------------------- shared pieces
/** Orange label tab flush on a panel with a 6 px orange left rule. `hole` punches the panel (Pillow draws
 * translucent ellipses by replacing pixels, so the status halo shows what is behind the card). */
function shell(w: number, h: number, tab: string, hole?: {cx: number; cy: number; r: number; id: string}) {
  const tabw = int(tlen(tab.toUpperCase(), 'M', 17, 1.7)) + 34, by = TAB_H;
  const panel = <>
    <R x0={0} y0={by} x1={w - 1} y1={by + h - 1} fill={PANEL}/>
    <RO x0={0} y0={by} x1={w - 1} y1={by + h - 1} stroke={LINE}/>
    <R x0={0} y0={by} x1={RULE - 1} y1={by + h - 1} fill={ORANGE}/>
  </>;
  const layer = <Svg w={w} h={h + TAB_H}>
    {hole ? <>
      <mask id={hole.id}><rect width={w} height={h + TAB_H} fill="white"/><Ell x0={hole.cx - hole.r} y0={hole.cy - hole.r} x1={hole.cx + hole.r} y1={hole.cy + hole.r} fill="black"/></mask>
      <g mask={`url(#${hole.id})`}>{panel}</g>
    </> : panel}
    <R x0={0} y0={0} x1={tabw} y1={TAB_H} fill={ORANGE}/>
    <Label s={tab} x={17} y={21} size={17} fill={BG} tr={1.7}/>
  </Svg>;
  return {layer, by, H: h + TAB_H};
}

const pillText = (c: string, filled: boolean) => filled ? BG : `rgb(${hexRgb(c).map(v => Math.min(255, int(v * 0.5 + 255 * 0.5))).join(',')})`;
/** motion.py pill: rounded chip, optional vector check for a leading "✓ ". */
export function pill(label: string, c: string, filled = false, size = 19): Sprite {
  const chk = label.startsWith('✓ '), text = chk ? label.slice(2) : label;
  const face = filled ? 'J' : 'G', cw = chk ? int(size * 0.95) : 0;
  const w = int(getlength(text, face, size)) + 26 + cw, h = size + 17, tc = pillText(c, filled);
  const pts = [[0.10, 0.52], [0.36, 0.72], [0.86, 0.28]].map(([x, y]) => `${12 + x * cw},${0.5 * h + (y - 0.5) * cw}`).join(' ');
  return sprite(w, h, <Svg w={w} h={h}>
    <RRect w={w} h={h} r={4} fill={filled ? c : rgba(c, 30)} stroke={rgba(c, 200)}/>
    {chk && <polyline points={pts} fill="none" stroke={tc} strokeWidth={2.5} strokeLinejoin="round"/>}
    <Txt s={text} x={13 + cw + (chk ? 4 : 0)} y={size >= 19 ? h - 11 : h - 9} face={face} size={size} fill={tc}/>
  </Svg>);
}
const pillW = (label: string, size = 19) => pill(label, INK, false, size).w;

function layoutPills(pills: [string, ColorName, number][], maxw: number, gap = 8) {
  const pos: [number, number][] = [];
  let x = 0, y = 0, rowh = 0;
  for (const [label] of pills) {
    const w = pillW(label), h = 19 + 17;
    if (x && x + w > maxw) { x = 0; y += rowh + gap; rowh = 0; }
    pos.push([x, y]); x += w + gap; rowh = Math.max(rowh, h);
  }
  return {pos, height: y + rowh};
}

/** motion.py check_icon: a 1 px box with a check that draws on with p. */
export function checkIcon(size: number, c: string, p = 1): Sprite {
  const pts = [[0.24, 0.52], [0.43, 0.70], [0.78, 0.30]].map(([x, y]) => [x * size, y * size]);
  const L1 = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]), L2 = Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]);
  let path: number[][] = [];
  if (p > 0) {
    const L = (L1 + L2) * p;
    if (L <= L1) path = [pts[0], [lerp(pts[0][0], pts[1][0], L / L1), lerp(pts[0][1], pts[1][1], L / L1)]];
    else { const u = (L - L1) / L2; path = [pts[0], pts[1], [lerp(pts[1][0], pts[2][0], u), lerp(pts[1][1], pts[2][1], u)]]; }
  }
  return sprite(size, size, <Svg w={size} h={size}>
    <rect x={1} y={1} width={size - 2} height={size - 2} fill={rgba(c, 36)}/>
    <rect x={0.5} y={0.5} width={size - 1} height={size - 1} fill="none" stroke={c} strokeWidth={1}/>
    {path.length > 0 && <polyline points={path.map(pt => pt.join(',')).join(' ')} fill="none" stroke={c} strokeWidth={2.25} strokeLinejoin="round"/>}
  </Svg>);
}

const fmtNumber = (fmt: string, n: number) => fmt.replace('{:,}', String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','));

// ---------------------------------------------------------------- card state (quantised, as cached by the engine)
export type CardState = {
  val?: number; pills?: number[]; cur?: number; rows?: number[] | number; chk?: number[]; state?: [string, ColorName, number];
  pulse?: number; shrink?: number; hl?: number; steps?: number[]; move?: number; strike?: number; alt?: number;
  in?: number; rev?: number; bubble?: number; hook?: number;
};

export function cardState(cue: Cue, f: number, v: Version): CardState {
  const full = v === 'full', st: CardState = {};
  const appear = (t: number) => full ? q(REVEAL(prog(f, F(t), ENTER_F))) : q(REVEAL(prog(f, F(t), 10)));
  switch (cue.kind) {
    case 'stat': st.val = full ? pyRound(cue.value * REVEAL(prog(f, F(cue.t0) + 4, 26))) : cue.value; break;
    case 'pills':
      st.pills = cue.pills.map(p => appear(p[2]));
      if (cue.agenda) st.cur = Math.max(-1, ...cue.pills.map((p, i) => (f >= F(p[2]) ? i : -1)));
      break;
    case 'list':
      st.rows = cue.rows.map(([, t]) => appear(t));
      if (full) st.chk = cue.rows.map(([, t]) => q(REVEAL(prog(f, F(t) + 3, 10))));
      break;
    case 'status': {
      const cur = cue.states.filter(s => f >= F(s[2]));
      st.state = cur.length ? cur[cur.length - 1] : cue.states[0];
      st.pulse = full ? q(0.5 + 0.5 * Math.sin((f - F(cue.t0)) / FPS * Math.PI * 2 * 0.9), 12) : 1;
      break;
    }
    case 'bar': st.shrink = q(TRAVEL(prog(f, F(cue.at), 22))); break;
    case 'seat': st.rows = int(clamp((f - F(cue.t0) - 4) / 2, 0, 7)); st.hl = q(REVEAL(prog(f, F(cue.t0) + 30, 14))); break;
    case 'steps': st.steps = cue.rows.flatMap(([, items]) => items.map(([, t]) => appear(t))); break;
    case 'slider': st.move = q(TRAVEL(prog(f, F(cue.move), 30))); break;
    case 'never': st.strike = q(REVEAL(prog(f, F(cue.flip), 10))); st.alt = q(REVEAL(prog(f, F(cue.flip) + 8, 12))); break;
    case 'venn': st.in = q(REVEAL(prog(f, F(cue.t0) + 4, 14))); st.rev = q(REVEAL(prog(f, F(cue.reveal), 14))); break;
    case 'loose': st.bubble = q(REVEAL(prog(f, F(cue.bubble), 12))); st.hook = q(REVEAL(prog(f, F(cue.hook), 14))); break;
    default: break;
  }
  return st;
}

// ---------------------------------------------------------------- card artwork
export function renderCard(cue: Cue, st: CardState, v: Version): Sprite {
  const w = CARD_W, full = v === 'full', x0 = RULE + PAD, inner = w - x0 - PAD;
  const layers: ReactNode[] = [];
  const done = (H: number) => sprite(w, H, ...layers);
  switch (cue.kind) {
    case 'statement': case 'slide': case 'never': case 'loose': {
      const k = cue.kind;
      const head: Seg[] = typeof cue.head === 'string' ? [[cue.head, 'ink']] : cue.head;
      const lines = segWrap(head, 'J', 31, inner);
      const subText = (cue.kind === 'statement' || cue.kind === 'slide') ? cue.sub : null;
      const sub = subText ? wrap(subText, 'G', 20, inner) : [];
      const extra = k === 'never' ? 44 : k === 'loose' ? 92 : 0;
      const h = 24 + 38 * lines.length + (sub.length ? 6 + 27 * sub.length : 0) + 18 + extra;
      const s = shell(w, h, k === 'slide' || k === 'loose' ? 'On screen' : (cue as {tab: string}).tab);
      layers.push(s.layer);
      let y = s.by + 24 + 28;
      const draw: ReactNode[] = [];
      for (const ln of lines) { draw.push(<Segs line={ln} x={x0} y={y} face="J" size={31} tr={-0.4} color={color}/>); y += 38; }
      for (const t of sub) {
        // Slide subtitles are wrapped with body metrics but set in Hack, as in the engine.
        draw.push(k === 'slide' ? <Txt s={t} x={x0} y={y + 2} face="HM" size={18} fill={GRAY}/> : <Txt s={t} x={x0} y={y + 2} face="G" size={20} fill={GRAY}/>);
        y += 27;
      }
      if (cue.kind === 'never' && (st.strike ?? 0) > 0) {
        const xe = x0 + getlength('Never', 'J', 31), yy = s.by + 24 + 28 - 10;
        draw.push(<Ln x0={x0} y0={yy} x1={lerp(x0, xe + 4, st.strike!)} y1={yy} w={3} fill={ORANGE}/>);
      }
      layers.push(<Svg w={w} h={s.H}>{draw}</Svg>);
      if (cue.kind === 'never' && (st.alt ?? 0) > 0) {
        const alt = sprite(w, 40, <Svg w={w} h={40}><Txt s={cue.alt} x={0} y={28} face="J" size={24} fill={GREEN}/></Svg>);
        layers.push(<Place s={alt} x={x0 + (1 - st.alt!) * 10} y={y - 6} a={st.alt}/>);
      }
      if (cue.kind === 'loose') {
        const b = st.bubble ?? 0, hk = st.hook ?? 0;
        if (b > 0) {
          const txt = '“This one is for you — I couldn’t do this.”';
          const bw = int(getlength(txt, 'HM', 16)) + 24;
          const bub = sprite(bw, 34, <Svg w={bw} h={34}>
            <RRect w={bw} h={34} r={4} fill={RAISED} stroke={LINE}/>
            <Txt s={txt} x={12} y={23} face="HM" size={16} fill={GRAY}/>
            {hk > 0 && <Ln x0={10} y0={17} x1={lerp(10, bw - 10, hk)} y1={17} w={2} fill={ORANGE}/>}
          </Svg>);
          layers.push(<Place s={bub} x={x0} y={y - 4 + (1 - b) * 8} a={b}/>);
        }
        if (hk > 0) layers.push(<Place s={pill('hooks: no loose ends', GREEN, false, 18)} x={x0} y={y + 38 + (1 - hk) * 8} a={hk}/>);
      }
      return done(s.H);
    }
    case 'stat': {
      const s = shell(w, 140, cue.tab), y = s.by + 24 + 54;
      const val = st.val ?? cue.value, x2 = x0 + tlen(fmtNumber(cue.fmt, cue.value), 'J', 62, -1.5) + 14;
      layers.push(s.layer, <Svg w={w} h={s.H}>
        <Txt s={fmtNumber(cue.fmt, pyRound(val))} x={x0} y={y} face="J" size={62} fill={COL[cue.color ?? 'green']} tr={-1.5}/>
        <Txt s={cue.unit} x={x2} y={y} face="J" size={28} fill={INK}/>
        {wrap(cue.sub, 'G', 20, inner).slice(0, 2).map((t, i) => <Txt key={i} s={t} x={x0} y={y + 34 + 26 * i} face="G" size={20} fill={GRAY}/>)}
      </Svg>);
      return done(s.H);
    }
    case 'pills': {
      const {pos, height} = layoutPills(cue.pills, inner);
      const h = 22 + (cue.title ? 34 : 0) + height + 22, s = shell(w, h, cue.tab);
      let y0 = s.by + 22;
      layers.push(s.layer);
      if (cue.title) { layers.push(<Svg w={w} h={s.H}><Txt s={cue.title} x={x0} y={y0 + 22} face="J" size={23} fill={INK} tr={-0.3}/></Svg>); y0 += 34; }
      cue.pills.forEach((p, i) => {
        const a = st.pills?.[i] ?? 0;
        if (a <= 0) return;
        const [px, py] = pos[i];
        if (cue.agenda) {
          const im = i === st.cur ? pill(p[0], ORANGE, true) : pill(p[0], GRAY);
          layers.push(<Place s={im} x={x0 + px} y={y0 + py + (1 - a) * 8} a={(i === st.cur ? 1 : 0.85) * a}/>);
        } else layers.push(<Place s={pill(p[0], COL[p[1]])} x={x0 + px} y={y0 + py + (1 - a) * 8} a={a}/>);
      });
      return done(s.H);
    }
    case 'list': {
      const rows = cue.rows, rh = 31, shown = (st.rows as number[] | undefined) ?? [];
      const vis = Math.max(1, shown.filter(a => a > 0).length), grow = vis - 1 < shown.length ? shown[vis - 1] : 1;
      const h = int(22 + rh * (vis - 1 + (v !== 'plain' ? grow : 1)) + 14), s = shell(w, h, cue.tab);
      layers.push(s.layer);
      rows.forEach(([txt], i) => {
        const a = shown[i] ?? 0;
        if (a <= 0) return;
        let row: Sprite;
        if (cue.mode === 'approve' && txt === 'Approve') row = sprite(w, rh, <Place s={pill('✓ Approve', GREEN, true, 17)} x={0} y={2}/>);
        else if (cue.mode === 'approve') row = sprite(w, rh, <Svg w={w} h={rh}><Txt s={txt} x={0} y={22} face="J" size={21} fill={ORANGE} tr={-0.2}/></Svg>);
        else row = sprite(w, rh,
          <Place s={checkIcon(20, GREEN, full && st.chk && i < st.chk.length ? st.chk[i] : 1)} x={0} y={4}/>,
          <Svg w={w} h={rh}><Txt s={txt} x={32} y={21} face="G" size={21} fill={INK}/></Svg>);
        layers.push(<Place s={row} x={x0 + (1 - a) * 10} y={s.by + 20 + i * rh} a={a}/>);
      });
      return done(s.H);
    }
    case 'question': {
      const lines = wrap(cue.head, 'J', 27, inner), h = 24 + 34 * lines.length + 34;
      const s = shell(w, h, `Audience question ${cue.n}`);
      let y = s.by + 24 + 26;
      const draw = lines.map((ln, i) => { const el = <Txt key={i} s={ln} x={x0} y={y} face="J" size={27} fill={INK} tr={-0.3}/>; y += 34; return el; });
      layers.push(s.layer, <Svg w={w} h={s.H}>{draw}<Label s="As restated by Erik on stage" x={x0} y={y + 2} size={14} fill={DIM} tr={1.2}/></Svg>);
      return done(s.H);
    }
    case 'status': {
      const [txt, c] = st.state ?? cue.states[0], pulse = st.pulse ?? 1;
      const r = 6 + 3 * pulse, cx = x0 + 8, cy = TAB_H + 31, rr = r + 4;
      const s = shell(w, 62, cue.tab, {cx, cy, r: rr, id: `halo-${cue.id}`});
      layers.push(s.layer, <Svg w={w} h={s.H}>
        <Ell x0={cx - rr} y0={cy - rr} x1={cx + rr} y1={cy + rr} fill={rgba(COL[c], int(60 * pulse))}/>
        <Ell x0={cx - 6} y0={cy - 6} x1={cx + 6} y1={cy + 6} fill={COL[c]}/>
        <Txt s={txt} x={x0 + 30} y={s.by + 39} face="J" size={23} fill={INK}/>
      </Svg>);
      return done(s.H);
    }
    case 'bar': {
      const s = shell(w, 132, cue.tab), frac = lerp(1, 0.004, st.shrink ?? 0);
      layers.push(s.layer, <Svg w={w} h={s.H}>
        <Txt s={cue.value} x={x0} y={s.by + 24 + 40} face="J" size={46} fill={ORANGE} tr={-1}/>
        <R x0={x0} y0={s.by + 78} x1={x0 + inner} y1={s.by + 92} fill={RAISED}/>
        <R x0={x0} y0={s.by + 78} x1={x0 + Math.max(3, inner * frac)} y1={s.by + 92} fill={ORANGE}/>
        <Txt s={cue.sub} x={x0} y={s.by + 116} face="G" size={19} fill={GRAY}/>
      </Svg>);
      return done(s.H);
    }
    case 'seat': {
      const lines = segWrap(cue.head, 'J', 28, 300), s = shell(w, 140, cue.tab);
      let y = s.by + 24 + 28;
      const draw: ReactNode[] = lines.map((ln, i) => { const el = <Segs key={i} line={ln} x={x0} y={y} face="J" size={28} tr={-0.3} color={color}/>; y += 36; return el; });
      draw.push(<Txt s={cue.sub} x={x0} y={y + 4} face="G" size={19} fill={GRAY}/>);
      const sx0 = w - 196, sy0 = s.by + 18, rowsOn = (st.rows as number | undefined) ?? 0, hl = st.hl ?? 0;
      const [la, lb, lc] = hexRgb(LINE), [oa, ob, oc] = hexRgb(ORANGE);
      const hlColor = `rgb(${int(lerp(la, oa, hl))},${int(lerp(lb, ob, hl))},${int(lerp(lc, oc, hl))})`;
      for (let r = 0; r < Math.min(7, rowsOn); r++) for (let k = 0; k < 6; k++) {
        const xx = sx0 + k * 26 + (k >= 3 ? 10 : 0), yy = sy0 + r * 15;
        draw.push(r === 3 ? <RO x0={xx} y0={yy} x1={xx + 20} y1={yy + 11} stroke={hlColor} w={2}/> : <R x0={xx} y0={yy} x1={xx + 20} y1={yy + 11} fill={RAISED}/>);
      }
      layers.push(s.layer, <Svg w={w} h={s.H}>{draw}</Svg>);
      return done(s.H);
    }
    case 'steps': {
      const s = shell(w, 128, cue.tab), shown = st.steps ?? [];
      let idx = 0;
      layers.push(s.layer);
      cue.rows.forEach(([lab, items], r) => {
        const y = s.by + 22 + r * 50;
        layers.push(<Svg w={w} h={s.H}><Label s={lab} x={x0} y={y + 23} size={14} fill={r === 0 ? DIM : GREEN} tr={1.2}/></Svg>);
        let x = x0 + 132;
        items.forEach(([txt], j) => {
          const a = shown[idx++] ?? 0;
          const p = pill((r === 1 ? '✓ ' : '') + txt, r === 0 ? GRAY : GREEN, false, 17);
          if (a > 0) layers.push(<Place s={p} x={x + (1 - a) * 8} y={y + 2} a={a}/>);
          x += p.w + 6;
          if (r === 0 && j < items.length - 1 && a > 0) {
            layers.push(<Svg w={w} h={s.H}><Txt s="→" x={x - 2} y={y + 24} face="G" size={18} fill={DIM}/></Svg>);
            x += 16;
          }
        });
      });
      return done(s.H);
    }
    case 'slider': {
      const lines = segWrap(cue.head, 'J', 28, inner), h = 22 + 36 * lines.length + 26 + 62, s = shell(w, h, cue.tab);
      let y = s.by + 24 + 28;
      const draw: ReactNode[] = lines.map((ln, i) => { const el = <Segs key={i} line={ln} x={x0} y={y} face="J" size={28} tr={-0.3} color={color}/>; y += 36; return el; });
      draw.push(<Txt s={cue.sub} x={x0} y={y} face="G" size={19} fill={GRAY}/>);
      y += 30;
      const xa = x0, xb = w - PAD, kx = lerp(xa + 60, xa + (xb - xa) * 0.68, st.move ?? 0);
      draw.push(
        <Ln x0={xa} y0={y + 12} x1={xb} y1={y + 12} w={4} fill={RAISED}/>,
        <Ln x0={xa} y0={y + 12} x1={kx} y1={y + 12} w={4} fill={ORANGE}/>,
        <Ell x0={kx - 9} y0={y + 3} x1={kx + 9} y1={y + 21} fill={INK} stroke={ORANGE} sw={3}/>,
        <Label s="Low autonomy" x={xa} y={y + 42} size={13} fill={DIM} tr={1}/>,
        <Txt s="HIGH AUTONOMY" x={xb} y={y + 42} face="M" size={13} fill={DIM} anchor="rs"/>,
      );
      layers.push(s.layer, <Svg w={w} h={s.H}>{draw}</Svg>);
      return done(s.H);
    }
    case 'venn': {
      const s = shell(w, 168, cue.tab), a = st.in ?? 1, rv = st.rev ?? 0, cx = x0 + 120, cy = s.by + 84, r = 62, tx = x0 + 290;
      const circles = sprite(w, s.H, <Svg w={w} h={s.H}>
        {rv > 0 && <Ell x0={cx + 70 - r} y0={cy - r} x1={cx + 70 + r} y1={cy + r} fill={rgba(ORANGE, int(46 * rv))}/>}
        <Ell x0={cx - r} y0={cy - r} x1={cx + r} y1={cy + r} fill={RAISED} stroke={GRAY} sw={2}/>
        <Ell x0={cx + 70 - r} y0={cy - r} x1={cx + 70 + r} y1={cy + r} stroke={ORANGE} sw={2}/>
      </Svg>);
      layers.push(s.layer, <Place s={circles} x={0} y={0} a={a}/>, <Svg w={w} h={s.H}>
        <Txt s="good for humans" x={tx} y={s.by + 50} face="G" size={19} fill={GRAY}/>
        <Txt s="good for agents" x={tx} y={s.by + 78} face="G" size={19} fill={ORANGE}/>
        <Txt s="often both…" x={tx} y={s.by + 106} face="G" size={19} fill={INK}/>
      </Svg>);
      if (rv > 0) layers.push(<Place s={sprite(240, 30, <Svg w={240} h={30}><Txt s="…but many: agents only" x={0} y={22} face="G" size={19} fill={ORANGE}/></Svg>)} x={tx} y={s.by + 112} a={rv}/>);
      return done(s.H);
    }
  }
}

// ---------------------------------------------------------------- placement (motion.py card_ops)
export function cardOps(ops: Ops, f: number, v: Version) {
  if (v === 'plain') return;
  const tag = v === 'light' ? 'L' : 'F';
  for (const cue of CUES) {
    if (!cue.v.includes(tag)) continue;
    const f0 = F(cue.t0), f1 = F(cue.t1);
    if (!(f0 <= f && f < f1)) continue;
    const im = renderCard(cue, cardState(cue, f, v), v);
    const x = CARD_R - CARD_W, y = CARD_B - im.h;
    const [a, off] = reveal(f, f0, f1);
    if (v === 'full') {   // the panel wipes in from its left edge and clears back to it
      const e = REVEAL(prog(f, f0, ENTER_F)), lv = REVEAL(prog(f, f1 - EXIT_F, EXIT_F));
      let wv = e < 1 ? int(im.w * e) : im.w;
      if (lv > 0) wv = int(im.w * (1 - lv));
      ops.add('card', wv < im.w ? crop(im, 0, 0, Math.max(1, wv), im.h) : im, x, y, 1);
    } else ops.add('card', im, x, y + off * 0.6, a);
  }
}
