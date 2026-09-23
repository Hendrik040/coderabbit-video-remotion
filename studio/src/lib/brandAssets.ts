import type {BrandAssetKind, Overlay, OverlayKind, Project} from '../types';
import {colorBarColors, colorBarSegments, isColorBar} from './colorBar';
import {pixelWipeDefaults} from './pixelWipe';

export const brandAssetTemplates = {
  'logo-reveal': {code: 'ID-01', name: 'Logo reveal', family: 'Reveals', duration: 3.2, alpha: true, title: 'Tagline', body: '', titleMax: 72, bodyMax: 0, description: 'A measured entrance for the full CodeRabbit lockup.', usage: 'Open a video, product launch, or presentation.'},
  'circle-wipe': {code: 'TR-01', name: 'Circle wipe', family: 'Transitions', duration: 1.8, alpha: true, title: '', body: '', titleMax: 40, bodyMax: 0, description: 'Orange leads. A circular field covers the cut and clears.', usage: 'Place over an edit. Cut the underlying footage at the center marker.'},
  'stack-wipe': {code: 'TR-02', name: 'Stack wipe', family: 'Transitions', duration: 2, alpha: true, title: '', body: '', titleMax: 40, bodyMax: 0, description: 'Six staggered rails sweep across the frame together.', usage: 'Place over an edit. Cut the underlying footage at the center marker.'},
  'color-bar-wipe': {code: 'TR-03', name: 'Color bar wipe', family: 'Transitions', duration: 2, alpha: true, title: '', body: '', titleMax: 40, bodyMax: 0, description: 'Ten brand-color bands enter from the left, cover the cut, and clear to the right.', usage: 'Place over an edit. Cut beneath the fully covered center frame.'},
  'pixel-glow-wipe': {code: 'TR-04', name: 'Change Stack pixel wipe', family: 'Transitions', duration: 2.4, alpha: true, title: '', body: '', titleMax: 40, bodyMax: 0, description: 'Uneven streams of pixels carry the Change Stack glow across the frame.', usage: 'Cover a cut with a pixel sweep. The marked center frame is fully opaque.'},
  'type-reveal': {code: 'TY-01', name: 'Type reveal', family: 'Typography', duration: 4, alpha: true, title: 'Headline', body: 'Supporting line', titleMax: 72, bodyMax: 100, description: 'Confident type with a shared reveal, hold, and exit.', usage: 'Introduce a feature, chapter, or announcement.'},
  'brand-signoff': {code: 'ID-02', name: 'Brand sign-off', family: 'Idents', duration: 4, alpha: false, title: 'Tagline', body: 'Website or call to action', titleMax: 72, bodyMax: 80, description: 'The official lockup, a closing line, and a clear destination.', usage: 'Close a film or give a presentation a consistent final frame.'},
  'signal-loop': {code: 'BG-01', name: 'Signal loop', family: 'Backgrounds', duration: 8, alpha: false, title: '', body: '', titleMax: 40, bodyMax: 0, description: 'Circles and rails repeat in an orange-led motion pattern.', usage: 'An ambient bed for event screens, titles, and holding slides.'},
  'color-bar-reveal': {code: 'AC-01', name: 'Color bar reveal', family: 'Brand accents', duration: 4, alpha: true, title: '', body: '', titleMax: 40, bodyMax: 0, description: 'The Change Stack hero bar: ten colors expand with the original 3.2-second easing.', usage: 'Finish a title, frame a product reveal, or underline a brand moment.'},
  'color-bar-loop': {code: 'AC-02', name: 'Color bar loop', family: 'Brand accents', duration: 8, alpha: true, title: '', body: '', titleMax: 40, bodyMax: 0, description: 'The hero’s color expansion, followed by a smooth return and seamless repeat.', usage: 'Add a continuous brand accent over footage, holding screens, or the Change Stack glow.'},
} as const;
export const brandAssetKinds = Object.keys(brandAssetTemplates) as BrandAssetKind[];
export const isBrandAsset = (kind: OverlayKind): kind is BrandAssetKind => kind in brandAssetTemplates;
export const isTransition = (kind: OverlayKind) => kind === 'circle-wipe' || kind === 'stack-wipe' || kind === 'color-bar-wipe' || kind === 'pixel-glow-wipe';

const base = {enabled: true, start: 0, binding: 'cue', placement: 'center', accent: '#FF570A', scale: 1, colorway: 'dark', direction: 'right'} as const;
export const brandAssetDefaults = Object.fromEntries(brandAssetKinds.map(kind => [kind, {
  ...base, kind, duration: brandAssetTemplates[kind].duration,
  title: kind === 'type-reveal' ? 'Review smarter.\nShip faster.' : kind === 'logo-reveal' || kind === 'brand-signoff' ? 'Review code with confidence.' : brandAssetTemplates[kind].name,
  body: kind === 'type-reveal' ? 'More context. Better code.' : kind === 'brand-signoff' ? 'coderabbit.ai' : '',
  ...(kind === 'signal-loop' || kind === 'color-bar-loop' ? {loopDuration: 8} : {}),
  ...(isColorBar(kind) ? {barHeight: 4, barPosition: 'bottom', barColors: [...colorBarColors]} : {}),
  ...(kind === 'color-bar-wipe' ? {barColors: [...colorBarColors]} : {}),
  ...(kind === 'pixel-glow-wipe' ? {accent: '#687FF5', intensity: 1, ...pixelWipeDefaults} : {}),
}])) as Record<BrandAssetKind, Omit<Overlay, 'id'>>;

export function assetProject(asset: Overlay, width = 1280): Project {
  const duration = asset.kind === 'signal-loop' || asset.kind === 'hero' || asset.kind === 'color-bar-loop' ? asset.loopDuration ?? asset.duration : asset.duration;
  const code = isBrandAsset(asset.kind) ? brandAssetTemplates[asset.kind].code : 'BG-02';
  const name = isBrandAsset(asset.kind) ? brandAssetTemplates[asset.kind].name : 'Change Stack glow';
  return {name: `CodeRabbit ${code} ${name}`, mediaUrl: null, mediaName: name, duration, fps: 30, width, height: width * 9 / 16,
    samples: [], cues: [], overlays: [{...asset, enabled: true, start: 0, duration}], sampleMode: true, showTracking: false, mute: true, brandAsset: true};
}

export function appendBrandAsset(project: Project, asset: Overlay, id: string): Project {
  if (project.overlays.length >= 12) throw new Error('Your composition has 12 layers. Remove a layer there before adding this asset.');
  return {...project, overlays: [...project.overlays, {...asset, id, enabled: true, start: 0, duration: Math.min(asset.duration, project.duration)}]};
}

export const unit = (value: number) => Math.max(0, Math.min(1, value));
export const motionEase = (value: number) => {const t = unit(value); return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;};
export const assetPhase = (frame: number, duration: number, fps = 30) => unit(frame / Math.max(2, Math.ceil(duration * fps) - 1));
export const cutFrame = (duration: number, fps = 30) => Math.floor(Math.ceil(duration * fps) / 2);
export function signalPhase(frame: number, fps = 30, seconds = 8) {
  const length = Math.max(1, Math.round(seconds * fps));
  return ((frame % length) + length) % length / length;
}

/** Solid coverage surrounds the center cut; the first and last frames are transparent. */
export function circleWipeState(frame: number, duration: number, fps = 30) {
  const p = assetPhase(frame, duration, fps), maxRadius = Math.hypot(1280 * 0.84, 360) + 4;
  return {
    x: 1280 * (0.16 + 0.68 * motionEase((p - 0.55) / 0.45)),
    orange: maxRadius * motionEase(p / 0.28) * (1 - motionEase((p - 0.68) / 0.32)),
    plate: maxRadius * motionEase((p - 0.035) / 0.32) * (1 - motionEase((p - 0.6) / 0.36)),
    logo: motionEase((p - 0.36) / 0.07) * (1 - motionEase((p - 0.55) / 0.05)),
  };
}

export function stackWipeState(frame: number, duration: number, row: number, fps = 30, accent = false) {
  const p = assetPhase(frame, duration, fps), delay = row * 0.014 + (accent ? 0 : 0.025);
  const enter = motionEase((p - delay) / 0.3), leave = motionEase((p - 0.6 - delay) / 0.3);
  return -1280 + 1280 * enter + 1280 * leave;
}

/** Ten bands share Stack wipe's total stagger, keeping the cut covered and the last band clear. */
export function colorBarWipeState(frame: number, duration: number, fps = 30) {
  const height = 720 / colorBarSegments.length;
  return colorBarSegments.map((segment, index) => ({
    ...segment, y: index * height, height,
    x: stackWipeState(frame, duration, index * 5 / (colorBarSegments.length - 1), fps, true),
  }));
}
