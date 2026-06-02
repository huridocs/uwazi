import { RefObject, useEffect, useState } from 'react';
import { resolveBackgroundColor, getContrastColor } from '#V2/utils/contrastColor.js';

type ContrastColor = 'white' | 'black';

/**
 * Reads the effective background color of the referenced element (walking up
 * the DOM tree through transparent ancestors) and returns the WCAG-optimal
 * foreground color — 'white' or 'black'.
 *
 * Automatically re-evaluates when any ancestor's `class` or `style` attribute
 * changes, so dynamic theme swaps are handled without a remount.
 */
function useContrastColor(ref: RefObject<HTMLElement | null>): ContrastColor {
  const [color, setColor] = useState<ContrastColor>('white');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      setColor(getContrastColor(resolveBackgroundColor(el)));
    };

    update(); // run immediately after mount

    // Observe every ancestor so runtime theme changes (class/style swaps) are caught.
    const observer = new MutationObserver(update);
    let node: HTMLElement | null = el.parentElement;
    while (node) {
      observer.observe(node, { attributes: true, attributeFilter: ['class', 'style'] });
      node = node.parentElement;
    }

    return () => observer.disconnect();
  }, [ref]);

  return color;
}

export type { ContrastColor };
export { useContrastColor };
