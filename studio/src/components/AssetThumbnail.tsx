import React, {memo, useId} from 'react';
import type {BrandAssetKind} from '../types';

const shades = ['#353535', '#626262', '#b5b5b5', '#777', '#292929', '#909090', '#474747', '#d8d8d8', '#a6a6a6', '#eee'];
// Bake a small, uneven pixel field once. Library artwork never mounts a player or a timer.
const pixelPaths = Array.from({length: 5}, (_, shade) => {
  let path = '';
  for (let y = 0; y < 100; y += 3) {
    for (let x = 0; x < 160; x += 3) {
      if ((x * 17 + y * 23) % 5 === shade) path += `M${x} ${y}h1.5v1.5h-1.5Z`;
    }
  }
  return path;
});

/** A fixed example of the template, independent of playback and the user's edits. */
export const AssetThumbnail = memo(function AssetThumbnail({kind}: {kind: BrandAssetKind | 'hero'}) {
  const id = useId();
  const glow = kind === 'hero';
  const pixels = glow || kind === 'pixel-glow-wipe';
  const introWipe = kind === 'name-intro-wipe';
  return <svg className="asset-thumbnail" viewBox="0 0 160 100" aria-hidden="true" focusable="false">
    <rect width="160" height="100" fill="#111"/>
    {(kind === 'name-intro' || introWipe) && <>
      <path d="M14 21H146M14 21V79M146 21V79" fill="none" stroke="#272727" strokeDasharray="2 4"/>
      {introWipe && <path d="M23 31H55m-5-4 5 4-5 4M103 31H135m-5-4 5 4-5 4" fill="none" stroke="#aaa" strokeWidth="1.5"/>}
      <rect x="14" y="43" width={introWipe ? 108 : 122} height="27" fill="#d6d6d6"/>
      <rect x="14" y="70" width={introWipe ? 90 : 122} height="16" fill="#8b8b8b"/>
      <text x="23" y="61" fill="#161616" fontSize="13" fontFamily="Geist, sans-serif" fontWeight="600">Your name</text>
      <text x="23" y="81" fill="#161616" fontSize="6.5" fontFamily="Geist, sans-serif">Position · Company</text>
    </>}
    {kind === 'stack-wipe' && <>
      {[126, 115, 99, 81, 57, 32].map((width, row) => <g key={row}>
        <rect y={row * 17} width={width + 11} height="17" fill="#555"/>
        <rect y={row * 17} width={width} height="17" fill="#bdbdbd"/>
      </g>)}
    </>}
    {kind === 'color-bar-wipe' && shades.map((fill, row) => <rect key={row} y={row * 10} width={148 - row * 7} height="10" fill={fill}/>)}
    {pixels && <>
      <defs>
        <radialGradient id={`${id}-light`} cx="32%" cy="24%" r="75%" gradientTransform="rotate(-28 .32 .24)">
          <stop stopColor="#9a9a9a" stopOpacity=".8"/>
          <stop offset=".5" stopColor="#777" stopOpacity=".3"/>
          <stop offset="1" stopColor="#111" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id={`${id}-fade`}>
          <stop stopColor="white"/><stop offset={glow ? '.48' : '.6'} stopColor="white" stopOpacity=".8"/><stop offset="1" stopColor="white" stopOpacity="0"/>
        </linearGradient>
        <mask id={`${id}-mask`}><rect width="160" height="100" fill={`url(#${id}-fade)`}/></mask>
      </defs>
      {glow && <rect width="160" height="100" fill={`url(#${id}-light)`}/>}
      <g mask={`url(#${id}-mask)`} fill="#eee">
        {pixelPaths.map((d, index) => <path key={index} d={d} opacity={(index + 1) * (glow ? .08 : .15)}/>)}
      </g>
    </>}
    {kind.startsWith('color-bar-') && kind !== 'color-bar-wipe' && <>
      <path d="M17 30H92M17 37H65" stroke="#383838" strokeWidth="3"/>
      <g transform="translate(0 74)">
        {shades.map((fill, index) => <rect key={index} x={index * 16} width="16" height="8" fill={fill}/>)}
      </g>
      {kind === 'color-bar-reveal' && <path d="M17 60H47m-5-4 5 4-5 4" fill="none" stroke="#888" strokeWidth="1.5"/>}
      {kind === 'color-bar-transition' && <path d="M17 60H47m-5-4 5 4-5 4M112 60H142m-5-4 5 4-5 4" fill="none" stroke="#888" strokeWidth="1.5"/>}
      {kind === 'color-bar-loop' && <path d="M73 54c-9-11-19 8-9 8 7 0 10-14 17-14 10 0 10 19 1 14l-9-8" fill="none" stroke="#aaa" strokeWidth="1.5"/>}
    </>}
  </svg>;
});
