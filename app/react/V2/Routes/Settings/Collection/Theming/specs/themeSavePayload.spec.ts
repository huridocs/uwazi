import { buildThemeSavePayload, savedThemeFields } from '../themeSavePayload.js';

describe('buildThemeSavePayload', () => {
  it('sends theme fields only and copies the light logo and favicon', () => {
    expect(
      buildThemeSavePayload(
        { __preset: 'default', '--accent-primary': '#111' },
        {
          preset: 'default',
          siteLogo: { light: ' /logo.svg ', dark: '/logo-dark.svg' },
          favicon: { light: '/favicon.png' },
        }
      )
    ).toEqual({
      themeVars: { __preset: 'default', '--accent-primary': '#111' },
      themeAssets: {
        preset: 'default',
        siteLogo: { light: ' /logo.svg ', dark: '/logo-dark.svg' },
        favicon: { light: '/favicon.png' },
      },
      site_logo: '/logo.svg',
      favicon: '/favicon.png',
    });
  });

  it('clears top-level logo and favicon when the light assets are blank', () => {
    expect(buildThemeSavePayload({}, { siteLogo: { light: '  ' } })).toEqual({
      themeVars: {},
      themeAssets: { siteLogo: { light: '  ' } },
      site_logo: '',
      favicon: '',
    });
  });

  it('writes the saved theme back onto the form, including cleared branding', () => {
    expect(
      savedThemeFields({
        themeVars: { __preset: 'default' },
        themeAssets: {},
        site_logo: '',
        favicon: '',
      })
    ).toEqual({
      themeVars: { __preset: 'default' },
      themeAssets: {},
      site_logo: '',
      favicon: '',
    });
  });
});
