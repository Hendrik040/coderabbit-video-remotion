import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Scene} from './Scene';
import {demoProject} from '../lib/demo';
const Root = () => <Composition id="CodeRabbitMotion" component={Scene} durationInFrames={360} fps={30} width={1280} height={720} defaultProps={{project: demoProject(), transparent: false}} calculateMetadata={({props}) => ({durationInFrames: Math.max(1, Math.ceil(props.project.duration * props.project.fps)), fps: props.project.fps, width: props.project.width, height: props.project.height})}/>;
registerRoot(Root);
