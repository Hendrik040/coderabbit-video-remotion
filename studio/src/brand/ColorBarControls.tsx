import React, {useState} from 'react';
import {Check} from 'lucide-react';
import {colorBarColors, colorBarSegments} from '../lib/colorBar';
import {clamp} from '../lib/gesture';
import type {Overlay} from '../types';
import {PalettePicker} from './PalettePicker';

export function ColorBarControls({asset, onChange}: {asset: Overlay; onChange: (patch: Partial<Overlay>) => void}) {
  const [segment, setSegment] = useState(7);
  const colors = asset.barColors ?? colorBarColors;
  return <>
    <label className="field-label">Bar height<span className="input-unit"><input aria-label="Bar height" type="number" min={4} max={144} step={1} value={asset.barHeight ?? 4} onChange={e => onChange({barHeight: clamp(Number(e.target.value), 4, 144)})}/><span>px</span></span></label>
    <div className="field-label"><span>Position</span><div className="placement-picker" role="group" aria-label="Bar position">{(['top', 'center', 'bottom'] as const).map(barPosition => <button key={barPosition} aria-pressed={(asset.barPosition ?? 'bottom') === barPosition} onClick={() => onChange({barPosition})}>{barPosition}</button>)}</div></div>
    <div className="color-bar-segments" role="group" aria-label="Color bar segments"><span className="palette-caption">Color sequence · select a segment</span><div className="color-bar-segment-grid">{colorBarSegments.map((item, index) => <button key={item.name} type="button" className="palette-option" aria-label={`Edit segment ${index + 1}: ${item.name}`} aria-pressed={segment === index} title={`${index + 1}. ${item.name} · ${colors[index]}`} onClick={() => setSegment(index)}><span className="palette-square" style={{backgroundColor: colors[index]}}>{segment === index && <span className="palette-check"><Check size={11} strokeWidth={3}/></span>}</span><span className="palette-option-label">{index + 1}</span></button>)}</div></div>
    <PalettePicker label={`Segment ${segment + 1} · ${colorBarSegments[segment].name}`} value={colors[segment]} onChange={value => onChange({barColors: colors.map((color, index) => index === segment ? value : color)})}/>
    <a className="text-button color-bar-reference" href="https://www.coderabbit.ai/change-stack" target="_blank" rel="noreferrer">View the original hero bar ↗</a>
  </>;
}
