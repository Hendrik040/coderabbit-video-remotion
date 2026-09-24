import React, {useId} from 'react';
import {Check} from 'lucide-react';
import {brandColorName, mainBrandColors, supportingBrandPalettes, type BrandSwatch} from '../lib/brandPalette';
import './palette-picker.css';

export function PalettePicker({value, onChange, label = 'Accent color'}: {value: string; onChange: (value: string) => void; label?: string}) {
  const id = useId();
  const selected = value.toUpperCase();
  function swatch(color: BrandSwatch) {
    const active = color.value === selected;
    return <button key={color.name} type="button" className="palette-option" aria-label={`${color.name}, ${color.value}`} aria-pressed={active} title={`${color.name} · ${color.value}`} onClick={() => onChange(color.value)}>
      <span className="palette-square" style={{backgroundColor: color.value}}>{active && <span className="palette-check"><Check size={11} strokeWidth={3}/></span>}</span>
      <span className="palette-option-label">{color.step ?? color.name.replace('CR ', '')}</span>
    </button>;
  }
  return <div className="palette-picker" role="group" aria-labelledby={`${id}-label`}>
    <div className="palette-heading"><span id={`${id}-label`}>{label}</span><span className="palette-current-chip" style={{backgroundColor: value}} aria-hidden="true"/></div>
    <div className="palette-current"><span>{brandColorName(value)}</span><code>{selected}</code></div>
    <div className="palette-caption" id={`${id}-main`}>Main colors</div>
    <div className="palette-main" role="group" aria-labelledby={`${id}-main`}>{mainBrandColors.map(swatch)}</div>
    <div className="palette-caption palette-supporting-title">Supporting palette</div>
    {supportingBrandPalettes.map(palette => <div className="palette-family" key={palette.name} role="group" aria-label={palette.name}>
      <span className="palette-family-label">{palette.name}</span>
      <div className="palette-grid">{palette.swatches.map(swatch)}</div>
    </div>)}
  </div>;
}
