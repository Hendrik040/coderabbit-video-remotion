import {broadcastTemplates, isBroadcast} from './broadcast';
import {brandAssetTemplates, isBrandAsset} from './brandAssets';
import {normalizeWipePixelSize} from './pixelWipe';
import {z} from 'zod';
import {MAX_VIDEO_SECONDS, MAX_TRACKING_SAMPLES} from './limits';
const gesture = z.enum(['Open_Palm', 'Pointing_Up', 'Pinch', 'Swipe', 'None']);
// Preserve old presets while upgrading their coarse image tiles to the fine particle renderer.
const wipePixelSize = z.number().int().min(2).max(40).transform(normalizeWipePixelSize);
const lightingSchema = z.object({
  x: z.number().finite().min(-1).max(1), y: z.number().finite().min(-1).max(1),
  angle: z.number().finite().min(-180).max(180),
  width: z.number().finite().min(0.25).max(2.5), height: z.number().finite().min(0.25).max(2.5),
  softness: z.number().finite().min(0.05).max(1), ambient: z.number().finite().min(0).max(1),
}).partial();
const vignetteSchema = z.object({
  x: z.number().finite().min(0).max(1), y: z.number().finite().min(0).max(1),
  angle: z.number().finite().min(-180).max(180),
  width: z.number().finite().min(0.2).max(3), height: z.number().finite().min(0.2).max(3),
  softness: z.number().finite().min(0.05).max(1), strength: z.number().finite().min(0).max(1),
}).partial();
export const projectSchema = z.object({
  name: z.string().max(120), mediaUrl: z.string().max(250).nullable(), mediaName: z.string().max(250),
  duration: z.number().finite().min(0.1).max(MAX_VIDEO_SECONDS), fps: z.literal(30), width: z.number().int().min(2).max(1920), height: z.number().int().min(2).max(1080),
  broadcast: z.boolean().optional(), brandAsset: z.boolean().optional(), sampleMode: z.boolean(), showTracking: z.boolean(), mute: z.boolean(),
  samples: z.array(z.object({t: z.number().min(0).max(MAX_VIDEO_SECONDS), x: z.number().finite().min(-1).max(2), y: z.number().finite().min(-1).max(2), pinch: z.number().finite().min(0).max(100), confidence: z.number().min(0).max(1), gesture, visible: z.boolean()})).max(MAX_TRACKING_SAMPLES),
  cues: z.array(z.object({id: z.string().max(100), time: z.number().min(0).max(MAX_VIDEO_SECONDS), gesture})).max(MAX_TRACKING_SAMPLES),
  overlays: z.array(z.object({id: z.string().max(100), kind: z.enum(['code', 'diagram', 'callout', 'terminal', 'agentflow', 'presenter', 'headline', 'triage', 'stack', 'ticker', 'bug', 'ident', 'hero', 'name-intro', 'name-intro-wipe', 'logo-reveal', 'circle-wipe', 'stack-wipe', 'color-bar-wipe', 'pixel-glow-wipe', 'type-reveal', 'brand-signoff', 'signal-loop', 'color-bar-reveal', 'color-bar-loop', 'color-bar-transition']), enabled: z.boolean(), introTransition: z.enum(['reveal', 'color-bar']).optional(), company: z.string().max(72).optional(), detailBackground: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(), detailTextColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(), textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(), pixelSize: wipePixelSize.optional(), scatter: z.number().finite().min(0).max(1).optional(), lighting: lightingSchema.optional(), vignette: vignetteSchema.optional(), barHeight: z.number().finite().min(4).max(144).optional(), barPosition: z.enum(['top', 'center', 'bottom']).optional(), barColors: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).length(10).optional(), colorway: z.enum(['dark', 'light']).optional(), direction: z.enum(['left', 'right']).optional(), kicker: z.string().max(40).optional(), loopDuration: z.number().finite().min(4).max(32).optional(), intensity: z.number().finite().min(0.25).max(1.5).optional(), opacity: z.number().finite().min(0.1).max(1).optional(), title: z.string().max(150), body: z.string().max(3000), start: z.number().min(0).max(MAX_VIDEO_SECONDS), duration: z.number().min(0.1).max(MAX_VIDEO_SECONDS), binding: z.enum(['cue', 'progress', 'follow']), placement: z.enum(['left', 'right', 'center']), accent: z.string().regex(/^#[0-9a-fA-F]{6}$/), scale: z.number().min(0.5).max(1.3)}).transform(({introTransition, ...overlay}) => ({
    ...overlay,
    // Migrate the former animation dropdown to its own asset without changing saved motion.
    kind: overlay.kind === 'name-intro' && introTransition === 'color-bar' ? 'name-intro-wipe' as const : overlay.kind,
  }))).max(12),
}).superRefine((p, ctx) => {
  p.overlays.forEach((o, i) => {
    if (isBroadcast(o.kind)) {
      const template = broadcastTemplates[o.kind];
      if (o.title.length > template.titleMax || o.body.length > template.bodyMax) ctx.addIssue({code: 'custom', path: ['overlays', i], message: `${template.name}: content exceeds the template limit.`});
    }
    if (isBrandAsset(o.kind)) {
      const template = brandAssetTemplates[o.kind];
      if (o.title.length > template.titleMax || o.body.length > template.bodyMax) ctx.addIssue({code: 'custom', path: ['overlays', i], message: `${template.name}: content exceeds the asset limit.`});
    }
  });
  if (p.samples.some((s, i) => i > 0 && s.t < p.samples[i - 1].t)) ctx.addIssue({code: 'custom', message: 'Tracking samples must be ordered by time.'});
  if (p.samples.some(s => s.t > p.duration) || p.cues.some(c => c.time > p.duration)) ctx.addIssue({code: 'custom', message: 'Tracking and cues must fit inside the project duration.'});
  if (p.mediaUrl && !/^\/media\/[a-z0-9-]+\.(mp4|mov|webm|m4v)$/.test(p.mediaUrl)) ctx.addIssue({code: 'custom', message: 'The source must be a locally imported video.'});
  if (p.overlays.some(o => o.start + o.duration > p.duration + 0.001)) ctx.addIssue({code: 'custom', message: 'Layers must fit inside the project duration.'});
  if (new Set(p.overlays.map(o => o.id)).size !== p.overlays.length) ctx.addIssue({code: 'custom', message: 'Each layer needs a unique ID.'});
  if (p.width % 2 || p.height % 2) ctx.addIssue({code: 'custom', message: 'Video dimensions must be even.'});
});
