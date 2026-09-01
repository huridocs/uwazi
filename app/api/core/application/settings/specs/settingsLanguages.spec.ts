import { toPersistableLanguages, toReadableLanguages } from '../settingsLanguages.js';

describe('toPersistableLanguages', () => {
  it('should keep tenant fields and drop catalog fields and leftover _id', () => {
    expect(
      toPersistableLanguages([
        {
          _id: '58ad7d240d44252fee4e6214',
          key: 'es',
          label: 'Spanish',
          ISO639_3: 'spa',
          ISO639_1: 'es',
          localized_label: 'Español',
          elastic: 'spanish',
          rtl: false,
          translationAvailable: true,
          installing: true,
        },
      ])
    ).toEqual([{ key: 'es', label: 'Spanish', installing: true }]);
  });

  it('should persist default only when true', () => {
    expect(
      toPersistableLanguages([
        { key: 'en', label: 'English', default: true },
        { key: 'es', label: 'Spanish', default: false },
      ])
    ).toEqual([
      { key: 'en', label: 'English', default: true },
      { key: 'es', label: 'Spanish' },
    ]);
  });
});

describe('toReadableLanguages', () => {
  it('should join catalog fields from key without requiring them in storage', () => {
    expect(
      toReadableLanguages([{ _id: 'leftover', key: 'en', label: 'English', default: true }])
    ).toEqual([
      expect.objectContaining({
        key: 'en',
        label: 'English',
        default: true,
        ISO639_3: 'eng',
        localized_label: 'English',
      }),
    ]);
  });

  it('should not expose leftover _id', () => {
    const readable = toReadableLanguages([
      { _id: 'leftover', key: 'en', label: 'English', default: true },
    ]);
    expect(readable?.[0]).not.toHaveProperty('_id');
  });
});
