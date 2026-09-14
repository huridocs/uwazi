import { SaveSettingsInputSchema } from '../saveSettingsInput.js';

describe('SaveSettingsInputSchema themeVars', () => {
  it('should accept unset keys as undefined, matching Settings.themeVars', () => {
    const parsed = SaveSettingsInputSchema.parse({
      themeVars: { '--color-theme-accent-primary': '#1A1A1A', '--color-unset': undefined },
    });

    expect(parsed.themeVars).toEqual({
      '--color-theme-accent-primary': '#1A1A1A',
      '--color-unset': undefined,
    });
  });

  it('should reject values longer than 512 characters', () => {
    expect(() =>
      SaveSettingsInputSchema.parse({
        themeVars: { '--color-theme-accent-primary': 'x'.repeat(513) },
      })
    ).toThrow();
  });
});
