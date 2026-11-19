import { checkContrast } from '#shared/utils/contrast.js';
import {
  relatedPickerColors,
  semanticColorsFromEdit,
  settingsColorsFromRail,
} from '../relatedColorSuggestions.js';

describe('relatedColorSuggestions', () => {
  it('sets readable text and surfaces when the page background is black', () => {
    const next = semanticColorsFromEdit(
      {
        themeVars: { 'light:--color-theme-text-primary': '#112740' },
        mode: 'light',
        hex: '#000000',
        context: { page: '#F5F0E8', surface: '#FFFFFF', text: '#112740' },
      },
      '--color-theme-bg-primary'
    );
    expect(next?.['light:--color-theme-bg-primary']).toBe('#000000');
    expect(next?.['light:--color-theme-text-primary']).toBe('#FFFFFF');
    expect(
      checkContrast('#000000', next?.['light:--color-theme-text-primary'] ?? '').passesAA
    ).toBe(true);
    expect(next?.['light:--color-theme-bg-surface']).not.toBe('#000000');
    expect(next?.['light:--color-theme-text-secondary']).toBeDefined();
  });

  it('steps the other text colors from the main text', () => {
    const next = semanticColorsFromEdit(
      {
        themeVars: {},
        mode: 'light',
        hex: '#112740',
        context: { page: '#FFFFFF', surface: '#FFFFFF', text: '#1A1A1A' },
      },
      '--color-theme-text-primary'
    );
    expect(next?.['light:--color-theme-text-primary']).toBe('#112740');
    expect(next?.['light:--color-theme-text-secondary']).not.toBe('#112740');
  });

  it('sets a readable active item when the settings rail changes', () => {
    const next = settingsColorsFromRail({}, 'light', '#000000');
    expect(next['light:--color-theme-chrome-settings-rail-bg']).toBe('#000000');
    expect(
      checkContrast(next['light:--color-theme-chrome-settings-nav-item-active-bg'] ?? '', '#FFFFFF')
        .passesAA
    ).toBe(true);
  });

  it('leads the text picker with a color that passes on the page', () => {
    const colors = relatedPickerColors({
      suggestion: '#FFFFFF',
      against: '#000000',
      swatchIsBackground: false,
      displayValue: '#112740',
      colorOptions: ['#112740', '#FFFFFF'],
    });
    expect(colors[0]).toBe('#FFFFFF');
    expect(colors).not.toContain('#112740');
  });
});
