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

const observeChromeAncestors = (el: HTMLElement, update: () => void): MutationObserver => {
  const observer = new MutationObserver(update);
  let node: HTMLElement | null = el.parentElement;
  while (node) {
    observer.observe(node, { attributes: true, attributeFilter: ['class', 'style'] });
    node = node.parentElement;
  }
  return observer;
};

const DEFAULT_FADE_START = 'rgb(255, 255, 255)';

const defaultHeaderChrome = (): HeaderChrome => ({
  fadeColor: DEFAULT_FADE_START,
  fadeStartColor: DEFAULT_FADE_START,
  foreground: toForeground(DEFAULT_FADE_START),
});

const useHeaderChrome = (ref: RefObject<HTMLElement | null>): HeaderChrome => {
  const [chrome, setChrome] = useState<HeaderChrome>(defaultHeaderChrome);

  useEffect(() => {
    const el = ref.current;
    let observer: MutationObserver | undefined;

    if (el) {
      const update = () => {
        const fadeColor = resolveChromeFadeColor(el);
        const fadeStartColor = resolveChromeTextColor(el);
        setChrome({ fadeColor, fadeStartColor, foreground: toForeground(fadeStartColor) });
      };

      update();
      observer = observeChromeAncestors(el, update);
    }

    return () => observer?.disconnect();
  }, [ref]);

  return chrome;
};

export type { HeaderChrome };
export { useHeaderChrome };
