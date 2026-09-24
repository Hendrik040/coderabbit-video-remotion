import React, {memo} from 'react';
import {gestureLabel, type Cue} from '../types';

// An hour of tracking can produce thousands of cues. Keep the overview legible;
// the inspector's cue selector retains every cue at its exact timestamp.
export const TimelineCues = memo(function TimelineCues({cues, duration, onSeek}: {cues: Cue[]; duration: number; onSeek: (time: number) => void}) {
  const buckets = new Map<number, Cue>();
  for (const cue of cues) {
    const bucket = Math.floor(cue.time / duration * 200);
    if (!buckets.has(bucket)) buckets.set(bucket, cue);
  }
  return <>{[...buckets.values()].map(cue => <button key={cue.id} aria-label={`Seek to ${gestureLabel[cue.gesture]} at ${cue.time.toFixed(1)} seconds`} className="cue-marker" style={{left: `${cue.time / duration * 100}%`}} onClick={() => onSeek(cue.time)}><span>◆</span><em>{gestureLabel[cue.gesture]}</em></button>)}{!cues.length && <span className="empty-track">Analyze footage to detect cues</span>}</>;
});
