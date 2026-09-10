import { toPersistableSettingsFields } from '../persistableSettingsFields.js';

describe('toPersistableSettingsFields', () => {
  it('should persist nested collections and leave other fields alone', () => {
    const persistable = toPersistableSettingsFields({
      site_name: 'Uwazi',
      links: [{ title: 'Home', type: 'link', url: '/' }],
      filters: [{ _id: 'noise', id: 't1', name: 'Cases' }],
      languages: [{ key: 'en', label: 'English', default: true, ISO639_3: 'eng' }],
    });

    expect(persistable.site_name).toBe('Uwazi');
    expect(persistable.links?.[0]).toEqual({
      title: 'Home',
      type: 'link',
      url: '/',
    });
    expect(persistable.filters).toEqual([{ id: 't1', name: 'Cases' }]);
    expect(persistable.languages).toEqual([{ key: 'en', label: 'English', default: true }]);
  });
});
