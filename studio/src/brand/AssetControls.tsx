import React from 'react';
import {brandAssetTemplates, isBrandAsset, isNameIntro, isTransition} from '../lib/brandAssets';
import {assetType} from '../lib/looping';
import {clamp} from '../lib/gesture';
import type {Overlay} from '../types';
import {PalettePicker} from './PalettePicker';
import {isColorBar} from '../lib/colorBar';
import {ColorBarControls} from './ColorBarControls';
import {GlowControls} from './GlowControls';
import {PixelWipeControls} from './PixelWipeControls';
import {NameIntroControls} from './NameIntroControls';

export function AssetControls({asset, onChange}: {asset: Overlay; onChange: (patch: Partial<Overlay>) => void}) {
  if (isNameIntro(asset.kind)) return <NameIntroControls asset={asset} onChange={onChange}/>;
  if (asset.kind === 'hero') return <GlowControls asset={asset} onChange={onChange}/>;
  if (asset.kind === 'pixel-glow-wipe') return <PixelWipeControls asset={asset} onChange={onChange}/>;
  const template = isBrandAsset(asset.kind) ? brandAssetTemplates[asset.kind] : undefined;
  const colorBar = isColorBar(asset.kind) || asset.kind === 'color-bar-wipe';
  return <>
    {template?.title && <label className="field-label">{template.title}<textarea aria-label={`Asset ${template.title.toLowerCase()}`} rows={asset.kind === 'type-reveal' ? 3 : 2} maxLength={template.titleMax} value={asset.title} onChange={e => onChange({title: e.target.value})}/></label>}
    {template?.body && <label className="field-label">{template.body}<input aria-label={`Asset ${template.body.toLowerCase()}`} maxLength={template.bodyMax} value={asset.body} onChange={e => onChange({body: e.target.value})}/></label>}
    {assetType(asset.kind) === 'looping' && <label className="field-label">Cycle length<span className="input-unit"><input aria-label="Asset cycle length" type="number" min={4} max={32} step={0.5} value={asset.loopDuration ?? 16} onChange={e => onChange({loopDuration: clamp(Number(e.target.value), 4, 32)})}/><span>s</span></span></label>}
    {template && !colorBar && <div className="field-label"><span>Colorway</span><div className="placement-picker" role="group" aria-label="Asset colorway">{(['dark', 'light'] as const).map(colorway => <button key={colorway} aria-pressed={(asset.colorway ?? 'dark') === colorway} onClick={() => onChange({colorway})}>{colorway}</button>)}</div></div>}
    {(isTransition(asset.kind) || asset.kind === 'signal-loop' || asset.kind === 'color-bar-transition') && <div className="field-label"><span>Direction</span><div className="placement-picker" role="group" aria-label="Asset direction">{(['left', 'right'] as const).map(direction => <button key={direction} aria-pressed={(asset.direction ?? 'right') === direction} onClick={() => onChange({direction})}>{direction}</button>)}</div></div>}
    {colorBar ? <ColorBarControls asset={asset} onChange={onChange}/> : <PalettePicker value={asset.accent} onChange={accent => onChange({accent})}/>}
  </>;
}
