import React from 'react';
import {AbsoluteFill, Audio, Freeze, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {BG, END_TALK, FPS, H, INTRO, MEDIA, QA_F, SLIDE, SOURCE_IN, SPEAKER_FRAMES, SPK, TALK, W} from './engine/constants';
import {Overlay} from './Overlay';
import type {Version} from './engine/types';

const rect = ([x, y, w, h]: readonly [number, number, number, number]) => ({position: 'absolute' as const, left: x, top: y, width: w, height: h});

/** The engine fades the talk audio in over 0.03 s and out over its last 0.4 s (ffmpeg afade). Remotion sets one
 * volume per frame, centred on it, so each frame gets the mean of that envelope across the frame. */
function talkVolume(f: number) {
  const end = TALK / FPS, gain = (t: number) => Math.min(1, t / 0.03) * Math.min(1, Math.max(0, (end - t) / 0.4));
  const t0 = Math.max(0, (f - 0.5) / FPS), t1 = Math.min(end, (f + 0.5) / FPS);
  if (t0 >= 0.03 && t1 <= end - 0.4) return 1;
  let sum = 0;
  for (let i = 0; i < 32; i++) sum += gain(t0 + (t1 - t0) * (i + 0.5) / 32);
  return sum / 32;
}

/** One version of the talk: background, slide and speaker layers, program audio and the motion overlay.
 * Same layering as the engine's ffmpeg graph: before the talk the panels are ink, after it the last slide
 * frame is held (tpad clone) and the speaker panel is ink from the Q&A switch on. */
export const Program: React.FC<{version: Version}> = ({version}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{backgroundColor: '#000000'}}>
    <Img src={staticFile(MEDIA.bg)} style={{...rect([0, 0, W, H])}}/>
    {(frame < INTRO) && <div style={{...rect(SLIDE), backgroundColor: BG}}/>}
    <Freeze frame={END_TALK - 1} active={f => f >= END_TALK}>
      <Sequence from={INTRO} durationInFrames={TALK} layout="none" name="Slide panel">
        <OffthreadVideo src={staticFile(MEDIA.slide)} muted toneMapped={false} style={rect(SLIDE)}/>
      </Sequence>
    </Freeze>
    {(frame < INTRO || frame >= QA_F) && <div style={{...rect(SPK), backgroundColor: BG}}/>}
    <Sequence from={INTRO} durationInFrames={SPEAKER_FRAMES} layout="none" name="Speaker panel">
      <OffthreadVideo src={staticFile(MEDIA.speaker)} muted toneMapped={false} style={rect(SPK)}/>
    </Sequence>
    <Sequence from={INTRO} durationInFrames={TALK} layout="none" name="Program audio">
      <Audio src={staticFile(MEDIA.audio)} trimBefore={SOURCE_IN} volume={talkVolume}/>
    </Sequence>
    <Overlay version={version}/>
  </AbsoluteFill>;
};
