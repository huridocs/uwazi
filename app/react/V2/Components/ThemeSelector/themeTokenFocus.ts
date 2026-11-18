import React from 'react';
import {
  SIMPLE_SEMANTIC_ANCHOR_KEYS,
  THEME_EDITOR_MODE_KEY,
} from '#V2/theme/themeSimpleDerivation.js';

const SIMPLE_ROW_TOKENS = new Set<string>([
  ...SIMPLE_SEMANTIC_ANCHOR_KEYS,
  '--color-theme-chrome-app-bar',
  '--color-theme-chrome-app-bar-fg',
  '--color-theme-chrome-app-bar-hover',
]);

const EDGE_PX = 10;

const tokenNeedsFullMode = (token: string) => !SIMPLE_ROW_TOKENS.has(token);

type PreviewHit = {
  token: string | undefined;
  edge: string | undefined;
  x: number;
  y: number;
  width: number;
  height: number;
};

const tokenFromHit = ({ token, edge, x, y, width, height }: PreviewHit) => {
  const onEdge = x < EDGE_PX || y < EDGE_PX || width - x < EDGE_PX || height - y < EDGE_PX;
  if (edge && onEdge) return edge;
  return token;
};

const tokenForPaintedColor = (color: string, candidates: { token: string; color: string }[]) =>
  candidates.find(item => item.color.toLowerCase() === color.toLowerCase())?.token;

const tokenFromPreviewClick = (target: Element, clientX: number, clientY: number) => {
  const marked = target.closest<HTMLElement>('[data-theme-token]');
  if (!marked) return undefined;
  if (marked.dataset.themeText && target !== marked) return marked.dataset.themeText;
  const rect = marked.getBoundingClientRect();
  return tokenFromHit({
    token: marked.dataset.themeToken,
    edge: marked.dataset.themeEdge,
    x: clientX - rect.left,
    y: clientY - rect.top,
    width: rect.width,
    height: rect.height,
  });
};

const focusThemeTokenRow = (token: string) => {
  const row = document.querySelector(`[data-theme-token-row="${token}"]`);
  const button = row?.querySelector('button');
  if (!(row instanceof HTMLElement) || !(button instanceof HTMLElement)) return false;
  row.scrollIntoView({ block: 'center' });
  button.focus({ preventScroll: true });
  return true;
};

const elementFromEventTarget = (target: EventTarget) => {
  if (target instanceof Element) return target;
  if (target instanceof Node) return target.parentElement;
  return null;
};

type RevealArgs = {
  editorMode: 'simple' | 'advanced';
  open: boolean;
  setOpen: (open: boolean) => void;
  previewMode: string;
  themeVars: Record<string, string | undefined>;
  onChange: (value: Record<string, string | undefined>) => void;
};

const useRevealThemeToken = ({
  editorMode,
  open,
  setOpen,
  previewMode,
  themeVars,
  onChange,
}: RevealArgs) => {
  const [focusToken, setFocusToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    const onToken = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      const token: unknown = event.detail;
      if (typeof token !== 'string') return;
      setOpen(true);
      if (tokenNeedsFullMode(token) && editorMode === 'simple') {
        onChange({ ...themeVars, [THEME_EDITOR_MODE_KEY]: 'advanced' });
      }
      setFocusToken(token);
    };
    document.addEventListener('uwazi-theme-token', onToken);
    return () => document.removeEventListener('uwazi-theme-token', onToken);
  }, [editorMode, onChange, setOpen, themeVars]);

  React.useLayoutEffect(() => {
    if (!focusToken || !open) return;
    if (tokenNeedsFullMode(focusToken) && editorMode !== 'advanced') return;
    if (focusThemeTokenRow(focusToken)) setFocusToken(null);
  }, [editorMode, focusToken, open, previewMode]);
};

export {
  elementFromEventTarget,
  focusThemeTokenRow,
  tokenForPaintedColor,
  tokenFromHit,
  tokenFromPreviewClick,
  tokenNeedsFullMode,
  useRevealThemeToken,
};
