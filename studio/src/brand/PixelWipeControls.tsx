import React from 'react';
import {NumberControl, SliderControl} from './GlowControls';
import {normalizeWipePixelSize, pixelWipeDefaults} from '../lib/pixelWipe';
import {PalettePicker} from './PalettePicker';
import type {Overlay} from '../types';

export function PixelWipeControls({asset, onChange}: {asset: Overlay; onChange: (patch: Partial<Overlay>) => void}) {
  return <>
    <div className="field-label"><span>Direction</span><div className="placement-picker" role="group" aria-label="Asset direction">{(['left', 'right'] as const).map(direction => <button key={direction} aria-pressed={(asset.direction ?? 'right') === direction} onClick={() => onChange({direction})}>{direction}</button>)}</div></div>
    <NumberControl label="Pixel size" name="Wipe pixel size" value={normalizeWipePixelSize(asset.pixelSize)} min={2} max={8} step={1} unit="px" onChange={pixelSize => onChange({pixelSize: Math.round(pixelSize)})}/>
    <SliderControl label="Timing variation" name="Pixel timing variation" value={(asset.scatter ?? pixelWipeDefaults.scatter) * 100} min={0} max={100} onChange={scatter => onChange({scatter: scatter / 100})}/>
    <SliderControl label="Brightness" name="Pixel brightness" value={(asset.intensity ?? 1) * 100} min={25} max={150} step={5} onChange={intensity => onChange({intensity: intensity / 100})}/>
    <PalettePicker label="Pixel color" value={asset.accent} onChange={accent => onChange({accent})}/>
  </>;
}
