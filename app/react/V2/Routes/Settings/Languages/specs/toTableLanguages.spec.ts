import { LanguageSchema } from '#shared/types/commonTypes.js';
import { toTableLanguages } from '../toTableLanguages.js';

const available: LanguageSchema[] = [
  { key: 'en', label: 'English', translationAvailable: true },
  { key: 'es', label: 'Spanish', translationAvailable: true },
  { key: 'fr', label: 'French', translationAvailable: false },
];

describe('toTableLanguages', () => {
  it('keeps predefined translations so Reset stays available', () => {
    const rows = toTableLanguages(available, [
      { key: 'en', label: 'English', default: true, translationAvailable: false },
      { key: 'es', label: 'Spanish', translationAvailable: false },
    ]);

    expect(rows.find(row => row.key === 'en')?.translationAvailable).toBe(true);
    expect(rows.find(row => row.key === 'es')?.translationAvailable).toBe(true);
  });

  it('marks only the current default after the default language changes', () => {
    const previousDefault: LanguageSchema = { key: 'en', label: 'English', default: true };
    const [first] = toTableLanguages(available, [previousDefault, { key: 'es', label: 'Spanish' }]);

    const next = toTableLanguages(available, [
      { key: 'en', label: 'English' },
      { key: 'es', label: 'Spanish', default: true },
    ]);

    expect(first.default).toBe(true);
    expect(next.map(row => row.default)).toEqual([false, true]);
    expect(previousDefault.default).toBe(true);
  });
});
