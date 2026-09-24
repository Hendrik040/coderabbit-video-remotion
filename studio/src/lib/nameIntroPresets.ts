import type {Overlay} from '../types';

export type NameIntroColors = Required<Pick<Overlay, 'accent' | 'detailBackground' | 'textColor' | 'detailTextColor'>>;
export type NameIntroPreset = {id: string; name: string; colors: NameIntroColors};

// Flat fields and contrasting type, using only the official CodeRabbit palette.
// Orange leads; mint and cobalt stay paired with their deeper supporting shades.
export const nameIntroPresets: NameIntroPreset[] = [
  {id: 'orange-ink', name: 'Orange & ink', colors: {accent: '#FF570A', textColor: '#121014', detailBackground: '#121014', detailTextColor: '#EFEDF0'}},
  {id: 'mauve-orange', name: 'Mauve & orange', colors: {accent: '#232127', textColor: '#FF570A', detailBackground: '#322F37', detailTextColor: '#EFEDF0'}},
  {id: 'cream-rust', name: 'Cream & rust', colors: {accent: '#F7F2EF', textColor: '#66350C', detailBackground: '#DACDC6', detailTextColor: '#311C15'}},
  {id: 'forest-mint', name: 'Forest & mint', colors: {accent: '#062619', textColor: '#85F9C5', detailBackground: '#25E2A8', detailTextColor: '#062619'}},
  {id: 'midnight-cobalt', name: 'Midnight & cobalt', colors: {accent: '#171D37', textColor: '#9DB3FF', detailBackground: '#687FF5', detailTextColor: '#0D0F16'}},
  {id: 'paper-ink', name: 'Paper & ink', colors: {accent: '#EFEDF0', textColor: '#121014', detailBackground: '#121014', detailTextColor: '#FF570A'}},
];

export function nameIntroColors(asset: Pick<Overlay, 'accent' | 'detailBackground' | 'textColor' | 'detailTextColor'>): NameIntroColors {
  return {
    accent: asset.accent,
    detailBackground: asset.detailBackground ?? '#25E2A8',
    textColor: asset.textColor ?? '#121014',
    // Older projects use one text color for both lines.
    detailTextColor: asset.detailTextColor ?? asset.textColor ?? '#121014',
  };
}

export function matchingNameIntroPreset(asset: Parameters<typeof nameIntroColors>[0]) {
  const colors = nameIntroColors(asset);
  return nameIntroPresets.find(preset => (Object.keys(colors) as (keyof NameIntroColors)[]).every(key => colors[key].toUpperCase() === preset.colors[key]));
}
