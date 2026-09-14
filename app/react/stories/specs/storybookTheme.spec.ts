/**
 * @jest-environment node
 */
import { getStorybookContrastChecks, STORYBOOK_THEME_PRESETS } from '../storybookTheme.js';
import type { ThemeMode } from '#V2/theme/themes.js';

const modes: ThemeMode[] = ['light', 'dark'];

describe('getStorybookContrastChecks', () => {
  STORYBOOK_THEME_PRESETS.forEach(preset => {
    modes.forEach(mode => {
      it(`${preset} ${mode} passes WCAG AA`, () => {
        const failed = getStorybookContrastChecks(preset, mode)
          .filter(check => !check.passesAA)
          .map(check => `${check.id} ${check.ratio.toFixed(2)}`);
        expect(failed).toEqual([]);
      });
    });
  });
});
