import {z} from 'zod';
const gesture = z.enum(['Open_Palm', 'Pointing_Up', 'Pinch', 'Swipe', 'None']);
export const projectSchema = z.object({
  name: z.string().max(120), mediaUrl: z.string().max(250).nullable(), mediaName: z.string().max(250),
  duration: z.number().finite().min(0.1).max(60), fps: z.literal(30), width: z.number().int().min(2).max(1920), height: z.number().int().min(2).max(1080),
  sampleMode: z.boolean(), showTracking: z.boolean(), mute: z.boolean(),
  samples: z.array(z.object({t: z.number().min(0).max(60), x: z.number().finite().min(-1).max(2), y: z.number().finite().min(-1).max(2), pinch: z.number().finite().min(0).max(100), confidence: z.number().min(0).max(1), gesture, visible: z.boolean()})).max(2000),
  cues: z.array(z.object({id: z.string().max(100), time: z.number().min(0).max(60), gesture})).max(500),
  overlays: z.array(z.object({id: z.string().max(100), kind: z.enum(['code', 'diagram', 'callout', 'terminal', 'agentflow']), enabled: z.boolean(), title: z.string().max(150), body: z.string().max(3000), start: z.number().min(0).max(60), duration: z.number().min(0.1).max(60), binding: z.enum(['cue', 'progress', 'follow']), placement: z.enum(['left', 'right', 'center']), accent: z.string().regex(/^#[0-9a-fA-F]{6}$/), scale: z.number().min(0.5).max(1.3)})).max(12),
}).superRefine((p, ctx) => {
  if (p.samples.some((s, i) => i > 0 && s.t < p.samples[i - 1].t)) ctx.addIssue({code: 'custom', message: 'Tracking samples must be ordered by time.'});
  if (p.mediaUrl && !/^\/media\/[a-z0-9-]+\.(mp4|mov|webm|m4v)$/.test(p.mediaUrl)) ctx.addIssue({code: 'custom', message: 'The source must be a locally imported video.'});
  if (p.overlays.some(o => o.start + o.duration > p.duration + 0.001)) ctx.addIssue({code: 'custom', message: 'Layers must fit inside the project duration.'});
  if (new Set(p.overlays.map(o => o.id)).size !== p.overlays.length) ctx.addIssue({code: 'custom', message: 'Each layer needs a unique ID.'});
  if (p.width % 2 || p.height % 2) ctx.addIssue({code: 'custom', message: 'Video dimensions must be even.'});
});
