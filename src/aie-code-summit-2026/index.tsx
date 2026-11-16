import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {FPS, H, TOTAL, W} from './engine/constants';
import {Overlay, type OverlayProps} from './Overlay';
import {Program} from './Program';
import type {Version} from './engine/types';

// Erik Thorelli, "Manage Yourself Out of the Loop", AI Engineer Code Summit 2026, San Francisco.
// A port of the v4 conference motion engine (Edit-v4-Three-Versions/source/engine/motion.py) that matches
// its timing frame for frame: 24000/1001 fps, 38,048 frames, 1920x1080.
//   AIE26-<Version>          clean layers + program audio + motion overlay (the delivery picture)
//   AIE26-Overlay-<Version>  the motion overlay alone, transparent, for ProRes 4444 export
const VERSIONS: [string, Version][] = [['Plain', 'plain'], ['Light', 'light'], ['Full', 'full']];

function AIECodeSummit2026() {
  return <>
    {VERSIONS.map(([name, version]) => <Composition key={name} id={`AIE26-${name}`} component={Program} defaultProps={{version}}
      durationInFrames={TOTAL} fps={FPS} width={W} height={H}/>)}
    {VERSIONS.map(([name, version]) => <Composition key={`o-${name}`} id={`AIE26-Overlay-${name}`} component={Overlay}
      defaultProps={{version} as OverlayProps} durationInFrames={TOTAL} fps={FPS} width={W} height={H}/>)}
  </>;
}

registerRoot(AIECodeSummit2026);
