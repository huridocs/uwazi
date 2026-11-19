import { checkContrast } from '#shared/utils/contrast.js';
import {
  colorsByContrast,
  headerColorsFromBar,
  headerPickerColors,
} from '#V2/theme/headerColorSuggestions.js';

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
    expect(next['light:--color-theme-chrome-app-bar-fg']).toBe('#FFFFFF');
    expect(
      checkContrast(next['light:--color-theme-chrome-app-bar-hover'] ?? '', '#FFFFFF').passesAA
    ).toBe(true);
  });

  it('replaces a previous automatic text color when the bar changes', () => {
    const first = headerColorsFromBar({}, 'light', '#363636');
    const second = headerColorsFromBar(first, 'light', '#FFFFFF');
    expect(second['light:--color-theme-chrome-app-bar-fg']).toBe('#1A1A1A');
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
    expect(picker[0]).toBe('#1A1A1A');
    expect(picker).not.toContain('#93C5FD');
    const suggested = headerPickerColors({
      key: '--color-theme-chrome-app-bar-fg',
      displayValue: '#FFFFFF',
      colorOptions: ['#FFFFFF', '#F59E0B'],
      bar: '#F59E0B',
      text: '#FFFFFF',
    });
    expect(suggested[0]).toBe('#1A1A1A');
    expect(suggested).not.toContain('#FFFFFF');
  });
});
