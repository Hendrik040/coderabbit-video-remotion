import React, {useEffect, useState} from 'react';
import {brandAssetTemplates} from '../lib/brandAssets';
import {nameIntroColors, type NameIntroColors} from '../lib/nameIntroPresets';
import type {Overlay} from '../types';
import {PalettePicker} from './PalettePicker';
import {NameIntroPresetPicker} from './NameIntroPresetPicker';

function HexColor({label, value, onChange}: {label: string; value: string; onChange: (value: string) => void}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const valid = /^#[0-9a-fA-F]{6}$/.test(draft);
  return <label className="field-label">Custom hex color<input aria-label={`${label} hex color`} value={draft} maxLength={7} spellCheck={false} autoComplete="off" aria-invalid={!valid}
    onChange={e => {const next = e.target.value; setDraft(next); if (/^#[0-9a-fA-F]{6}$/.test(next)) onChange(next.toUpperCase());}}
    onBlur={() => {if (!valid) setDraft(value);}}/></label>;
}

export function NameIntroControls({asset, onChange}: {asset: Overlay; onChange: (patch: Partial<Overlay>) => void}) {
  const [target, setTarget] = useState<keyof NameIntroColors>('accent');
  const labels = {accent: 'Primary fill', detailBackground: 'Secondary fill', textColor: 'Name text', detailTextColor: 'Details text'};
  const label = labels[target];
  const colors = nameIntroColors(asset);
  const value = colors[target];
  const changeColor = (color: string) => onChange({...colors, [target]: color});
  const template = brandAssetTemplates['name-intro'];
  return <>
    <label className="field-label">Name<input aria-label="Intro name" maxLength={template.titleMax} value={asset.title} onChange={e => onChange({title: e.target.value})}/></label>
    <label className="field-label">Position<input aria-label="Intro position" maxLength={template.bodyMax} value={asset.body} onChange={e => onChange({body: e.target.value})}/></label>
    <label className="field-label">Company<input aria-label="Intro company" maxLength={72} value={asset.company ?? ''} onChange={e => onChange({company: e.target.value})}/></label>
    <div className="field-label"><span>Screen position</span><div className="placement-picker" role="group" aria-label="Intro screen position">{(['left', 'right'] as const).map(placement => <button key={placement} aria-pressed={(asset.placement === 'right' ? 'right' : 'left') === placement} onClick={() => onChange({placement})}>{placement}</button>)}</div></div>
    <NameIntroPresetPicker asset={asset} onChange={onChange}/>
    <section className="name-custom-colors" aria-label="Name intro colors"><div className="name-colors-heading">Brand palette</div>
      <div className="field-label"><div className="placement-picker name-color-targets" role="group" aria-label="Intro color to edit">{(['accent', 'detailBackground', 'textColor', 'detailTextColor'] as const).map(color => <button key={color} aria-label={labels[color]} aria-pressed={target === color} onClick={() => setTarget(color)}><span className="palette-current-chip" style={{backgroundColor: colors[color]}} aria-hidden="true"/>{labels[color]}</button>)}</div></div>
      <PalettePicker label={`${label} color`} value={value} onChange={changeColor}/>
      <HexColor key={target} label={label} value={value} onChange={changeColor}/>
    </section>
  </>;
}
