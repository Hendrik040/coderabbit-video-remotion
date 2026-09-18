import type {Cue, Sample} from '../types';
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// Binary search makes seeking independent of the previous playback position.
export function sampleAt(samples: Sample[], time: number): Sample | null {
  if (!samples.length) return null;
  let lo = 0, hi = samples.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (samples[mid].t <= time) lo = mid; else hi = mid - 1;
  }
  const a = samples[lo], b = samples[Math.min(lo + 1, samples.length - 1)];
  if (time < a.t - 0.2 || time > b.t + 0.3) return {...a, visible: false};
  const p = a === b ? 0 : clamp((time - a.t) / (b.t - a.t));
  return {...a, t: time, x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p, pinch: a.pinch + (b.pinch - a.pinch) * p};
}

// Require a sustained pose and a release before retriggering it.
export function deriveCues(samples: Sample[]): Cue[] {
  const cues: Cue[] = [];
  let current = 'None', since = 0, emitted = false, lastSweep = -10;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const label = s.visible && s.confidence >= 0.55 ? s.gesture : 'None';
    if (label !== current) {current = label; since = s.t; emitted = false;}
    if (label !== 'None' && label !== 'Swipe' && !emitted && s.t - since >= 0.16) {
      cues.push({id: `cue-${cues.length}`, time: Math.round(since * 100) / 100, gesture: s.gesture});
      emitted = true;
    }
    const old = samples[Math.max(0, i - 5)];
    const uninterrupted = samples.slice(Math.max(0, i - 5), i + 1).every(point => point.visible);
    if (s.visible && old.visible && uninterrupted && s.t - old.t <= 0.65 && s.t - old.t >= 0.25 && Math.abs(s.x - old.x) > 0.22 && s.t - lastSweep > 1.8) {
      cues.push({id: `cue-${cues.length}`, time: old.t, gesture: 'Swipe'});
      lastSweep = s.t;
    }
  }
  return cues.sort((a, b) => a.time - b.time);
}

export function smoothSamples(samples: Sample[]): Sample[] {
  let previous: Sample | null = null;
  return samples.map(sample => {
    const next = {...sample};
    if (previous && sample.visible && previous.visible && sample.t - previous.t < 0.3) {
      const alpha = 1 - Math.exp(-(sample.t - previous.t) / 0.065);
      next.x = previous.x + (sample.x - previous.x) * alpha;
      next.y = previous.y + (sample.y - previous.y) * alpha;
    }
    if (!sample.visible && previous) {next.x = previous.x; next.y = previous.y;}
    previous = next;
    return next;
  });
}
