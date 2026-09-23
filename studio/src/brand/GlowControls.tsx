import React, {useId} from 'react';
import {ChevronDown, RotateCcw} from 'lucide-react';
import {clamp} from '../lib/gesture';
import {lightingDefaults, vignetteDefaults, type GlowLighting, type GlowVignette} from '../lib/glowSettings';
import type {Overlay} from '../types';
import {PalettePicker} from './PalettePicker';
import './glow-controls.css';

type ControlProps = {label: string; name: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (value: number) => void};
export function NumberControl({label, name, value, min, max, step = 1, unit = '%', onChange}: ControlProps) {
  return <label className="field-label">{label}<span className="input-unit"><input aria-label={name} type="number" min={min} max={max} step={step} value={Number(value.toFixed(2))} onChange={e => {if (Number.isFinite(e.target.valueAsNumber)) onChange(clamp(e.target.valueAsNumber, min, max));}}/><span>{unit}</span></span></label>;
}
export function SliderControl({label, name, value, min, max, step = 1, unit = '%', onChange}: ControlProps) {
  const id = useId();
  return <div className="glow-slider-control"><div><label htmlFor={id}>{label}</label><span><input id={id} aria-label={name} type="number" min={min} max={max} step={step} value={Number(value.toFixed(2))} onChange={e => {if (Number.isFinite(e.target.valueAsNumber)) onChange(clamp(e.target.valueAsNumber, min, max));}}/><span>{unit}</span></span></div><input aria-label={`${name} slider`} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}/></div>;
}

export function GlowControls({asset, onChange, transition = false}: {asset: Overlay; onChange: (patch: Partial<Overlay>) => void; transition?: boolean}) {
  const light = {...lightingDefaults, ...asset.lighting};
  const vignette = {...vignetteDefaults, ...asset.vignette};
  const editLight = (patch: Partial<GlowLighting>) => onChange({lighting: {...light, ...patch}});
  const editVignette = (patch: Partial<GlowVignette>) => onChange({vignette: {...vignette, ...patch}});
  return <div className="glow-controls">
    {!transition && <NumberControl label="Cycle length" name="Glow cycle length" value={asset.loopDuration ?? 16} min={4} max={32} step={0.5} unit="s" onChange={loopDuration => onChange({loopDuration})}/>}
    <details className="glow-control-section" open={!transition}><summary><span>Lighting</span><ChevronDown size={13}/></summary>
      <div className="two-fields"><NumberControl label="X offset" name="Light X offset" value={light.x * 100} min={-100} max={100} onChange={x => editLight({x: x / 100})}/><NumberControl label="Y offset" name="Light Y offset" value={light.y * 100} min={-100} max={100} onChange={y => editLight({y: y / 100})}/></div>
      <SliderControl label="Angle" name="Light angle" value={light.angle} min={-180} max={180} unit="°" onChange={angle => editLight({angle})}/>
      <div className="two-fields"><NumberControl label="Width" name="Light width" value={light.width * 100} min={25} max={250} onChange={width => editLight({width: width / 100})}/><NumberControl label="Height" name="Light height" value={light.height * 100} min={25} max={250} onChange={height => editLight({height: height / 100})}/></div>
      <SliderControl label="Softness" name="Light softness" value={light.softness * 100} min={5} max={100} onChange={softness => editLight({softness: softness / 100})}/>
      <SliderControl label="Intensity" name="Glow intensity" value={(asset.intensity ?? 1) * 100} min={25} max={150} step={5} onChange={intensity => onChange({intensity: intensity / 100})}/>
      <SliderControl label="Ambient fill" name="Ambient fill" value={light.ambient * 100} min={0} max={100} onChange={ambient => editLight({ambient: ambient / 100})}/>
      <button className="text-button glow-reset" onClick={() => onChange({lighting: {...lightingDefaults}, intensity: 1})}><RotateCcw size={12}/> Reset lighting</button>
    </details>
    <details className="glow-control-section" open={vignette.strength > 0 || undefined}><summary><span>Vignette</span><span className="glow-section-value">{vignette.strength ? `${Math.round(vignette.strength * 100)}%` : 'Off'}</span><ChevronDown size={13}/></summary>
      <SliderControl label="Strength" name="Vignette strength" value={vignette.strength * 100} min={0} max={100} onChange={strength => editVignette({strength: strength / 100})}/>
      <div className="two-fields"><NumberControl label="Center X" name="Vignette center X" value={vignette.x * 100} min={0} max={100} onChange={x => editVignette({x: x / 100})}/><NumberControl label="Center Y" name="Vignette center Y" value={vignette.y * 100} min={0} max={100} onChange={y => editVignette({y: y / 100})}/></div>
      <div className="two-fields"><NumberControl label="Width" name="Vignette width" value={vignette.width * 100} min={20} max={300} onChange={width => editVignette({width: width / 100})}/><NumberControl label="Height" name="Vignette height" value={vignette.height * 100} min={20} max={300} onChange={height => editVignette({height: height / 100})}/></div>
      <SliderControl label="Angle" name="Vignette angle" value={vignette.angle} min={-180} max={180} unit="°" onChange={angle => editVignette({angle})}/>
      <SliderControl label="Feather" name="Vignette feather" value={vignette.softness * 100} min={5} max={100} onChange={softness => editVignette({softness: softness / 100})}/>
      <button className="text-button glow-reset" onClick={() => onChange({vignette: {...vignetteDefaults}})}><RotateCcw size={12}/> Reset vignette</button>
    </details>
    {!transition && <SliderControl label="Backdrop opacity" name="Backdrop opacity" value={(asset.opacity ?? 1) * 100} min={10} max={100} onChange={opacity => onChange({opacity: opacity / 100})}/>}
    <PalettePicker label="Glow color" value={asset.accent} onChange={accent => onChange({accent})}/>
  </div>;
}
