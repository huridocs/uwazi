import { omitSharedReduxCatalog } from '../omitSharedReduxCatalog.js';

describe('omitSharedReduxCatalog', () => {
  it('should remove shared catalog keys duplicated in atomStoreData', () => {
    const reduxData = {
      templates: [{ name: 'A' }],
      thesauris: [{ name: 'T' }],
      translations: [{ locale: 'en' }],
      relationTypes: [{ name: 'R' }],
      user: { _id: '1' },
      locale: 'en',
      settings: {
        collection: { site_name: 'Uwazi' },
        stats: { total: 1 },
      },
      library: { documents: [] },
    };

    expect(omitSharedReduxCatalog(reduxData)).toEqual({
      settings: {
        stats: { total: 1 },
      },
      library: { documents: [] },
    });
  });

  it('should omit settings entirely when only collection was present', () => {
    const reduxData = {
      templates: [],
      settings: {
        collection: { site_name: 'Uwazi' },
      },
      library: {},
    };

    expect(omitSharedReduxCatalog(reduxData)).toEqual({
      library: {},
    });
  });
});
