export type BrandSwatch = {name: string; value: string; step?: number};
export type BrandPalette = {name: string; swatches: BrandSwatch[]};

// Official sRGB tokens for the swatches displayed at https://www.coderabbit.ai/brand.
// Supporting families use the site's dark palette and retain its published step numbers.
export const mainBrandColors: BrandSwatch[] = [
  {name: 'CR Orange', value: '#FF570A'},
  {name: 'CR Mint', value: '#25E2A8'},
  {name: 'CR Cobalt', value: '#687FF5'},
];

const family = (name: string, steps: number[], values: string[]): BrandPalette => ({
  name,
  swatches: values.map((value, index) => ({name: `${name} ${steps[index]}`, value, step: steps[index]})),
});

export const supportingBrandPalettes: BrandPalette[] = [
  family('Mauve', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], [
    '#121014', '#1A181D', '#232127', '#2B282F', '#322F37', '#3C3841',
    '#4A464F', '#625E68', '#6F6B75', '#7D7982', '#B5B2B9', '#EFEDF0',
  ]),
  family('Primary', [2, 4, 6, 8, 9, 10], ['#1E150F', '#462100', '#66350C', '#A35829', '#FF570A', '#FF801F']),
  family('Secondary', [1, 3, 5, 7, 9, 11], ['#09120E', '#062619', '#003E28', '#006947', '#46E1A5', '#85F9C5']),
  family('Tertiary', [1, 3, 5, 7, 9, 11], ['#0D0F16', '#171D37', '#242E60', '#3A499C', '#687FF5', '#9DB3FF']),
  family('Cream', [1, 2, 3, 4, 5, 6], ['#311C15', '#6E564D', '#A1887E', '#DACDC6', '#EBE7E6', '#F7F2EF']),
];

export const brandSwatches = [...mainBrandColors, ...supportingBrandPalettes.flatMap(palette => palette.swatches)];

export function brandColorName(value: string) {
  return brandSwatches.find(swatch => swatch.value === value.toUpperCase())?.name ?? 'Custom color';
}
