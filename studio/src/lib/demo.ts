import type {Project, Sample, Overlay, OverlayKind} from '../types';

export const overlayDefaults: Record<OverlayKind, Omit<Overlay, 'id'>> = {
  terminal: {kind: 'terminal', enabled: true, title: '~/my-project', body: 'git diff --stat\ngit status --short', start: 0.6, duration: 4.6, binding: 'cue', placement: 'left', accent: '#FF570A', scale: 1},
  agentflow: {kind: 'agentflow', enabled: true, title: 'A better development loop.', body: 'Plan,Code,Review', start: 5.4, duration: 3.9, binding: 'progress', placement: 'left', accent: '#FF570A', scale: 1},
  code: {kind: 'code', enabled: true, title: 'useGesture.ts', body: 'const gesture = useGesture(video);\n\nif (gesture.is("open-palm")) {\n  reveal(<CodePanel />);\n}\n\n// Your movement. Your components.', start: 1.2, duration: 4.1, binding: 'cue', placement: 'left', accent: '#FF570A', scale: 1},
  diagram: {kind: 'diagram', enabled: true, title: 'From request to response', body: 'Client,API,Database', start: 5.4, duration: 3.9, binding: 'progress', placement: 'center', accent: '#25BAB1', scale: 1},
  callout: {kind: 'callout', enabled: true, title: 'Review smarter. Ship faster.', body: 'More context. Better reviews. CodeRabbit.', start: 9.1, duration: 2.6, binding: 'cue', placement: 'right', accent: '#F2B8EB', scale: 1},
};

export function demoProject(preset: 'walkthrough' | 'technical' = 'walkthrough'): Project {
  const samples: Sample[] = Array.from({length: 145}, (_, i) => {
    const t = i / 12;
    const x = t < 5.4 ? 0.72 + 0.045 * Math.sin(t * 1.5) : t < 8.6 ? 0.22 + ((t - 5.4) / 3.2) * 0.61 : 0.7 + 0.06 * Math.sin((t - 8.6) * 1.3);
    const gesture = t > 1.2 && t < 2.1 ? 'Open_Palm' : t > 5.4 && t < 6.6 ? 'Pointing_Up' : t > 9.1 && t < 10.4 ? 'Pinch' : 'None';
    return {t, x, y: 0.52 + 0.08 * Math.sin(t * 1.2), pinch: gesture === 'Pinch' ? 0.12 : 0.7, confidence: 0.96, visible: true, gesture};
  });
  return {
    name: preset === 'walkthrough' ? 'The developer walkthrough' : 'Inside the API', mediaUrl: null, mediaName: 'Interactive sample', duration: 12, fps: 30, width: 1280, height: 720,
    samples, cues: [{id: 'palm', time: 1.2, gesture: 'Open_Palm'}, {id: 'sweep', time: 5.4, gesture: 'Swipe'}, {id: 'pinch', time: 9.1, gesture: 'Pinch'}],
    overlays: (preset === 'walkthrough' ? ['terminal', 'agentflow', 'callout'] as const : ['code', 'diagram', 'callout'] as const).map(kind => ({id: kind, ...overlayDefaults[kind]})),
    sampleMode: true, showTracking: true, mute: false,
  };
}
