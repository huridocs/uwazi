import { getInstanceSeoMeta } from '../instanceSeo.js';

describe('getInstanceSeoMeta', () => {
  it('should fall back to the collection name when SEO fields are empty', () => {
    const result = getInstanceSeoMeta({ site_name: 'My collection' });

    expect(result.defaultTitle).toBe('My collection');
    expect(result.titleTemplate).toBe('%s • My collection');
    expect(result.meta).toEqual(
      expect.arrayContaining([
        { charSet: 'utf-8' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'My collection' },
        { property: 'og:title', content: 'My collection' },
      ])
    );
    expect(result.meta.find(tag => tag.name === 'description')).toBeUndefined();
    expect(result.meta.find(tag => tag.property === 'og:image')).toBeUndefined();
  });

  it('should use configured page title, description and Open Graph fields', () => {
    const result = getInstanceSeoMeta(
      {
        site_name: 'My collection',
        seo: {
          title: 'Human rights database',
          description: 'Documents and cases from the archive.',
          ogTitle: 'Share title',
          ogDescription: 'Share description',
          ogImage: '/assets/og.png',
        },
      },
      'https://example.org'
    );

    expect(result.defaultTitle).toBe('Human rights database');
    expect(result.titleTemplate).toBe('%s • My collection');
    expect(result.meta).toEqual(
      expect.arrayContaining([
        { name: 'description', content: 'Documents and cases from the archive.' },
        { property: 'og:title', content: 'Share title' },
        { property: 'og:description', content: 'Share description' },
        { property: 'og:image', content: 'https://example.org/assets/og.png' },
      ])
    );
  });

  it('should fall og title and description back to page title and meta description', () => {
    const result = getInstanceSeoMeta({
      site_name: 'My collection',
      seo: {
        title: 'Human rights database',
        description: 'Documents and cases from the archive.',
      },
    });

    expect(result.meta).toEqual(
      expect.arrayContaining([
        { property: 'og:title', content: 'Human rights database' },
        { property: 'og:description', content: 'Documents and cases from the archive.' },
      ])
    );
  });

  it('should keep absolute Open Graph image URLs unchanged', () => {
    const result = getInstanceSeoMeta(
      {
        site_name: 'My collection',
        seo: { ogImage: 'https://cdn.example.org/share.jpg' },
      },
      'https://example.org'
    );

    expect(result.meta.find(tag => tag.property === 'og:image')?.content).toBe(
      'https://cdn.example.org/share.jpg'
    );
  });
});
