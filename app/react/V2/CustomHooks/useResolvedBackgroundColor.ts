import { RefObject, useEffect, useState } from 'react';
import { resolveBackgroundColor } from '#V2/utils/contrastColor.js';

/**
 * Reads the effective background color of the referenced element (walking up
 * the DOM tree through transparent ancestors), same resolution as
 * `useContrastColor`, for use as a painted surface (e.g. overlay matching the bar).
 *
 * Re-evaluates when any ancestor's `class` or `style` attribute changes.
 */
function useResolvedBackgroundColor(ref: RefObject<HTMLElement | null>): string {
  const [backgroundColor, setBackgroundColor] = useState('rgb(255, 255, 255)');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      setBackgroundColor(resolveBackgroundColor(el));
    };

    update();

    const observer = new MutationObserver(update);
    let node: HTMLElement | null = el.parentElement;
    while (node) {
      observer.observe(node, { attributes: true, attributeFilter: ['class', 'style'] });
      node = node.parentElement;
    }

    return () => observer.disconnect();
  }, [ref]);

  return backgroundColor;
}

export { useResolvedBackgroundColor };
