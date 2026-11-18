/**
 * @jest-environment jsdom
 */
import {
  focusThemeTokenRow,
  tokenForPaintedColor,
  tokenFromHit,
  tokenFromPreviewClick,
  tokenNeedsFullMode,
} from '../themeTokenFocus.js';

describe('themeTokenFocus', () => {
  it('keeps simple-mode rows in simple mode', () => {
    expect(tokenNeedsFullMode('--color-theme-chrome-app-bar')).toBe(false);
    expect(tokenNeedsFullMode('--color-theme-accent-supporting')).toBe(false);
    expect(tokenNeedsFullMode('--color-theme-bg-muted')).toBe(true);
    expect(tokenNeedsFullMode('--color-theme-chrome-app-bar-active')).toBe(true);
  });

  it('uses the edge token when the click is on the element rim', () => {
    const card = {
      token: '--color-theme-bg-surface',
      edge: '--color-theme-border-primary',
      width: 100,
      height: 80,
    };
    expect(tokenFromHit({ ...card, x: 4, y: 40 })).toBe('--color-theme-border-primary');
    expect(tokenFromHit({ ...card, x: 40, y: 40 })).toBe('--color-theme-bg-surface');
  });

  it('prefers the first painted color that matches', () => {
    expect(
      tokenForPaintedColor('#1A1A1A', [
        { token: '--color-theme-text-primary', color: '#1a1a1a' },
        { token: '--color-theme-accent-primary', color: '#1A1A1A' },
      ])
    ).toBe('--color-theme-text-primary');
    expect(
      tokenForPaintedColor('#FCFAF8', [
        { token: '--color-theme-bg-surface', color: '#FFFFFF' },
        { token: '--color-theme-bg-primary', color: '#F5F0E8' },
      ])
    ).toBeUndefined();
  });
  it('uses the text token when the click lands on the label', () => {
    const button = document.createElement('button');
    button.dataset.themeToken = '--color-theme-bg-surface';
    button.dataset.themeText = '--color-theme-text-primary';
    const label = document.createElement('span');
    button.append(label);
    document.body.append(button);
    expect(tokenFromPreviewClick(label, 0, 0)).toBe('--color-theme-text-primary');
    expect(tokenFromPreviewClick(button, 20, 20)).toBe('--color-theme-bg-surface');
    button.remove();
  });

  it('focuses the color control in the matching row', () => {
    document.body.innerHTML =
      '<div data-theme-token-row="--color-theme-bg-muted"><button type="button">color</button></div>';
    const row = document.querySelector('[data-theme-token-row]');
    const button = document.querySelector('button');
    if (row) row.scrollIntoView = () => undefined;
    expect(focusThemeTokenRow('--color-theme-bg-muted')).toBe(true);
    expect(document.activeElement).toBe(button);
  });
});
