import type { CSSProperties } from 'react';

type ThemeScopeStyle = CSSProperties & Record<string, string>;

const copyThemeScopeStyle = (from?: HTMLElement | null): ThemeScopeStyle => {
  if (typeof document === 'undefined') return {};
  const scope =
    from?.closest<HTMLElement>('.tw-content') ||
    document.querySelector<HTMLElement>('.tw-content[data-theme-mode]') ||
    document.querySelector<HTMLElement>('.tw-content');
  if (!scope) return {};
  const copied: ThemeScopeStyle = {};
  const { style } = scope;
  for (let i = 0; i < style.length; i += 1) {
    const name = style.item(i);
    if (name.startsWith('--')) copied[name] = style.getPropertyValue(name);
  }
  copied.colorScheme = scope.classList.contains('dark') ? 'dark' : 'light';
  return copied;
};

export { copyThemeScopeStyle };
