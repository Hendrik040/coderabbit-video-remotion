import React from 'react';
import {Check} from 'lucide-react';
import {matchingNameIntroPreset, nameIntroPresets, type NameIntroColors} from '../lib/nameIntroPresets';
import type {Overlay} from '../types';
import './name-intro-presets.css';

export function NameIntroPresetPicker({asset, onChange}: {asset: Overlay; onChange: (colors: NameIntroColors) => void}) {
  const selected = matchingNameIntroPreset(asset);
  return <div className="name-presets">
    <div className="name-presets-heading"><span>Color preset</span><span>{selected ? selected.name : 'Custom colors'}</span></div>
    <div className="name-presets-grid" role="group" aria-label="Name intro color presets">
      {nameIntroPresets.map(preset => <button key={preset.id} type="button" className="name-preset" aria-label={`Apply ${preset.name} colors`} aria-pressed={selected?.id === preset.id} onClick={() => onChange(preset.colors)}>
        <span className="name-preset-art" aria-hidden="true">
          <span style={{backgroundColor: preset.colors.accent, color: preset.colors.textColor}}>Your name</span>
          <span style={{backgroundColor: preset.colors.detailBackground, color: preset.colors.detailTextColor}}>Position · Company</span>
        </span>
        <span className="name-preset-caption">{preset.name}{selected?.id === preset.id && <Check size={10} aria-hidden="true"/>}</span>
      </button>)}
    </div>
  </div>;
}
