import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {FPS} from './kit';
import {PLACEMENTS, CliInstall, PromptLoop, LoginDemo, Questions, ReviewRun, Finding, FilesChanged, EndCard} from './scenes';

// Antigravity launch inserts (worked example for .claude/skills/product-ui-animations).
// Each composition matches its timeline placement frame for frame.
const scenes = [
  ['AG08CliInstall', CliInstall, PLACEMENTS.cli],
  ['AGD1PromptLoop', PromptLoop, PLACEMENTS.prompt],
  ['AGD2LoginDemo', LoginDemo, PLACEMENTS.login],
  ['AG04Questions', Questions, PLACEMENTS.questions],
  ['AGD3ReviewRun', ReviewRun, PLACEMENTS.review],
  ['AG05Finding', Finding, PLACEMENTS.finding],
  ['AGD4FilesChanged', FilesChanged, PLACEMENTS.changes],
  ['AG07EndCard', EndCard, PLACEMENTS.end],
] as const;

function AntigravityInserts() {
  return <>{scenes.map(([id, component, placement]) =>
    <Composition key={id} id={id} component={component} durationInFrames={placement.frames} fps={FPS} width={1920} height={1080}/>)}</>;
}

registerRoot(AntigravityInserts);
