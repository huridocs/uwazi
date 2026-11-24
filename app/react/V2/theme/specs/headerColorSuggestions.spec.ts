import { checkContrast } from '#shared/utils/contrast.js';
import {
  colorsByContrast,
  headerColorsFromBar,
  headerPickerColors,
} from '#V2/theme/headerColorSuggestions.js';
import { headerCompanionsFromBar } from '#V2/theme/themeChromeOverrides.js';

describe('headerColorSuggestions', () => {
  it('sets header text to white when the bar is black', () => {
    const next = headerColorsFromBar(
      {
        'light:--color-theme-chrome-app-bar': '#8A857C',
        'light:--color-theme-chrome-app-bar-fg': '#112740',
        'light:--color-theme-chrome-app-bar-hover': '#A2392A',
      },
      'light',
      '#000000'
    );
    expect(next['light:--color-theme-chrome-app-bar']).toBe('#000000');
    expect(next['light:--color-theme-chrome-app-bar-fg']).toBe('#D4CDB8');
    expect(next['light:--color-theme-chrome-app-bar-fg-hover']).toBe('#F5F0E8');
    const hover = next['light:--color-theme-chrome-app-bar-hover'] ?? '';
    const active = next['light:--color-theme-chrome-app-bar-active'] ?? '';
    expect(checkContrast('#000000', '#D4CDB8').passesAA).toBe(true);
    expect(checkContrast(hover, '#f5f0e8').passesAA).toBe(true);
    expect(checkContrast(active, '#f5f0e8').passesAA).toBe(true);
  });

  it('uses the design dark hover and ink when the bar is the prototype surface', () => {
    const next = headerColorsFromBar({}, 'light', '#242424');
    expect(next['light:--color-theme-chrome-app-bar-hover']).toBe('#1a1a1a');
    expect(next['light:--color-theme-chrome-app-bar-fg']).toBe('#D4CDB8');
    expect(next['light:--color-theme-chrome-app-bar-fg-hover']).toBe('#F5F0E8');
    expect(checkContrast('#242424', '#D4CDB8').passesAA).toBe(true);
    expect(checkContrast('#1a1a1a', '#f5f0e8').passesAA).toBe(true);
  });

  it('replaces a previous automatic text color when the bar changes', () => {
    const first = headerColorsFromBar({}, 'light', '#363636');
    const second = headerColorsFromBar(first, 'light', '#FFFFFF');
    expect(second['light:--color-theme-chrome-app-bar-fg']).toBe('#333333');
    expect(second['light:--color-theme-chrome-app-bar-fg-hover']).toBe('#1A1A1A');
  });

  it('lists the most readable swatches first', () => {
    const ordered = colorsByContrast(['#93C5FD', '#FFFFFF', '#1A1A1A'], '#8A857C', false);
    const ratios = ordered.map(color => checkContrast('#8A857C', color).ratio);
    expect(ordered[0]).toBe('#1A1A1A');
    expect(ratios[0]).toBeGreaterThanOrEqual(ratios[1] ?? 0);
    const picker = headerPickerColors({
      key: '--color-theme-chrome-app-bar-fg',
      displayValue: '#93C5FD',
      colorOptions: ['#93C5FD', '#A2392A'],
      bar: '#8A857C',
      text: '#93C5FD',
    });
    expect(checkContrast('#8A857C', picker[0]).passesAA).toBe(true);
    expect(picker).not.toContain('#93C5FD');
    const suggested = headerPickerColors({
      key: '--color-theme-chrome-app-bar-fg',
      displayValue: '#FFFFFF',
      colorOptions: ['#FFFFFF', '#F59E0B'],
      bar: '#F59E0B',
      text: '#FFFFFF',
    });
    expect(suggested[0]).toBe('#333333');
    expect(suggested).not.toContain('#FFFFFF');
  });

  it('rejects a hover fill that fails against the hover ink', () => {
    const picker = headerPickerColors({
      key: '--color-theme-chrome-app-bar-hover',
      displayValue: '#FFFFFF',
      colorOptions: ['#FFFFFF'],
      bar: '#242424',
      text: '#D4CDB8',
    });
    expect(picker[0]).toBe('#1a1a1a');
    expect(picker).not.toContain('#FFFFFF');
  });

  it('keeps hover and active fills readable against the hover ink', () => {
    ['#242424', '#7A756C', '#F59E0B', '#FFFFFF'].forEach(bar => {
      const companions = headerCompanionsFromBar(bar);
      const ink = companions['--color-theme-chrome-app-bar-fg-hover'];
      expect(checkContrast(companions['--color-theme-chrome-app-bar-hover'], ink).passesAA).toBe(
        true
      );
      expect(checkContrast(companions['--color-theme-chrome-app-bar-active'], ink).passesAA).toBe(
        true
      );
    });
  });
});
