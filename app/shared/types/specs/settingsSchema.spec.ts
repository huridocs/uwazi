import { validateSettings } from '../settingsSchema.js';

describe('settingsSchema SEO', () => {
  it('should accept instance SEO metadata', async () => {
    await expect(
      validateSettings({
        site_name: 'My collection',
        seo: {
          title: 'Human rights database',
          description: 'A collection of documents and cases.',
          ogTitle: 'Share this collection',
          ogDescription: 'Open data on human rights.',
          ogImage: '/assets/og-image.png',
        },
      })
    ).resolves.toMatchObject({
      site_name: 'My collection',
      seo: {
        title: 'Human rights database',
        description: 'A collection of documents and cases.',
        ogTitle: 'Share this collection',
        ogDescription: 'Open data on human rights.',
        ogImage: '/assets/og-image.png',
      },
    });
  });

  it('should reject unknown SEO fields', async () => {
    await expect(
      validateSettings({
        seo: {
          title: 'Human rights database',
          unknown: 'nope',
        },
      })
    ).rejects.toThrow();
  });
});
