import {useEffect, useState, type RefObject} from 'react';

/** Preview preferences never enter the composition or change an exported frame. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

/** Decorative previews run only while visible and permitted by the viewer. */
export function usePreviewActivity(element: RefObject<HTMLElement | null>) {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [foreground, setForeground] = useState(() => !document.hidden);
  useEffect(() => {
    const node = element.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    const update = () => setForeground(!document.hidden);
    observer.observe(node);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, [element]);
  return visible && foreground && !reduced;
}
