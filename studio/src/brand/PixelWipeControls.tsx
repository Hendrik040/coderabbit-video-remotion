import React from 'react';
import {GlowControls, NumberControl, SliderControl} from './GlowControls';
import {pixelWipeDefaults} from '../lib/pixelWipe';
import type {Overlay} from '../types';

export function PixelWipeControls({asset, onChange}: {asset: Overlay; onChange: (patch: Partial<Overlay>) => void}) {
  return <>
    <div className="field-label"><span>Direction</span><div className="placement-picker" role="group" aria-label="Asset direction">{(['left', 'right'] as const).map(direction => <button key={direction} aria-pressed={(asset.direction ?? 'right') === direction} onClick={() => onChange({direction})}>{direction}</button>)}</div></div>
    <NumberControl label="Pixel size" name="Wipe pixel size" value={asset.pixelSize ?? pixelWipeDefaults.pixelSize} min={8} max={40} step={4} unit="px" onChange={pixelSize => onChange({pixelSize: Math.round(pixelSize)})}/>
    <SliderControl label="Unevenness" name="Pixel unevenness" value={(asset.scatter ?? pixelWipeDefaults.scatter) * 100} min={0} max={100} onChange={scatter => onChange({scatter: scatter / 100})}/>
    <GlowControls asset={asset} onChange={onChange} transition/>
  </>;
}
