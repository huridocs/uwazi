/**
 * @jest-environment jsdom
 */
import { copyThemeScopeStyle } from '../copyThemeScopeStyle.js';

describe('copyThemeScopeStyle', () => {
  it('copies custom properties from the closest .tw-content', () => {
    const host = document.createElement('div');
    host.className = 'tw-content dark';
    host.style.setProperty('--color-theme-bg-primary', '#111111');
    const inner = document.createElement('span');
    host.appendChild(inner);
    document.body.appendChild(host);
    const copied = copyThemeScopeStyle(inner);
    expect(copied['--color-theme-bg-primary']).toBe('#111111');
    expect(copied.colorScheme).toBe('dark');
    host.remove();
  });

  it('returns empty when document has no theme scope', () => {
    expect(copyThemeScopeStyle()).toEqual({});
  });
});
