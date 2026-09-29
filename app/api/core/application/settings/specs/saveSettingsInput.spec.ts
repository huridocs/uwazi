import { SaveSettingsInputSchema } from '../saveSettingsInput.js';

const validSeo = {
  title: 'Human rights database',
  description: 'A collection of documents and cases.',
  ogTitle: 'Share this collection',
  ogDescription: 'Open data on human rights.',
  ogImage: '/assets/og-image.png',
};

describe('SaveSettingsInputSchema SEO', () => {
  it('should accept instance SEO metadata', () => {
    expect(
      SaveSettingsInputSchema.parse({
        site_name: 'My collection',
        seo: validSeo,
      })
    ).toMatchObject({
      site_name: 'My collection',
      seo: validSeo,
    });
  });

  it('should reject unknown SEO fields', () => {
    expect(() =>
      SaveSettingsInputSchema.parse({
        seo: {
          title: 'Human rights database',
          unknown: 'nope',
        },
      })
    ).toThrow();
  });

  it('should reject SEO values that exceed their length limits', () => {
    expect(() =>
      SaveSettingsInputSchema.parse({
        seo: { title: 'x'.repeat(201) },
      })
    ).toThrow();
    expect(() =>
      SaveSettingsInputSchema.parse({
        seo: { description: 'x'.repeat(321) },
      })
    ).toThrow();
    expect(() =>
      SaveSettingsInputSchema.parse({
        seo: { ogImage: 'x'.repeat(2049) },
      })
    ).toThrow();
  });
});

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
