export function parseTimecode(value: string): number | null {
  if (!/^\d+(?::\d{1,2}){0,2}(?:\.\d+)?$/.test(value.trim())) return null;
  const parts = value.trim().split(':').map(Number);
  if (parts.slice(1).some(part => part >= 60)) return null;
  const seconds = parts.reduce((total, part) => total * 60 + part, 0);
  return Number.isFinite(seconds) ? seconds : null;
}
