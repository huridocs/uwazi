import { RefObject, useEffect, useState } from 'react';
import {
  getContrastColor,
  resolveChromeFadeColor,
  resolveChromeTextColor,
} from '#V2/utils/contrastColor.js';

type HeaderChrome = {
  foreground: string;
  fadeColor: string;
  fadeStartColor: string;
};

const toForeground = (surfaceColor: string): string =>
  getContrastColor(surfaceColor) === 'white' ? '#ffffff' : '#171717';

const useHeaderChrome = (ref: RefObject<HTMLElement | null>): HeaderChrome => {
  const [chrome, setChrome] = useState<HeaderChrome>({
    foreground: '#ffffff',
    fadeColor: 'rgb(255, 255, 255)',
    fadeStartColor: 'rgb(255, 255, 255)',
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const fadeColor = resolveChromeFadeColor(el);
      const fadeStartColor = resolveChromeTextColor(el);
      setChrome({ fadeColor, fadeStartColor, foreground: toForeground(fadeStartColor) });
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

  return chrome;
};

export type { HeaderChrome };
export { useHeaderChrome };
