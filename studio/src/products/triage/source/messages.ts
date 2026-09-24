import messages from './messages.json';

/** The website's English labels; no Next.js provider or network dependency. */
export function useTranslations(namespace: string) {
  return (key: string, values: Record<string, string | number> = {}) => {
    const path = [...namespace.replace('Triage.', '').split('.'), ...key.split('.')];
    const message = path.reduce<unknown>((value, part) => (value as Record<string, unknown>)?.[part], messages);
    return String(message ?? key).replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? ''));
  };
}
export const useLocale = () => 'en';
