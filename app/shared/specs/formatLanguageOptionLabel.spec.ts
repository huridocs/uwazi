import {
  formatLanguageLabelFromCode,
  formatLanguageName,
  formatLanguageOptionLabel,
} from '../language/formatLanguageOptionLabel.js';

describe('formatLanguageName', () => {
  it('returns the translated language name only', () => {
    expect(formatLanguageName('es', 'en')).toBe('Spanish');
    expect(formatLanguageName('es', 'es')).toBe('Español');
  });

  it('falls back to English names when the UI locale is missing', () => {
    expect(formatLanguageName('en', '')).toBe('English');
  });
});

describe('formatLanguageOptionLabel', () => {
  it('formats the language name in the UI locale with its ISO code', () => {
    expect(formatLanguageOptionLabel('es', 'en')).toBe('Spanish - ES');
    expect(formatLanguageOptionLabel('es', 'es')).toBe('Español - ES');
  });

  it('falls back to English names when the UI locale is missing', () => {
    expect(formatLanguageOptionLabel('en', '')).toBe('English - EN');
  });
});

describe('formatLanguageLabelFromCode', () => {
  it('returns the translated name only for ISO 639-1 or 639-3 codes', () => {
    expect(formatLanguageLabelFromCode('spa', 'es')).toBe('Español');
    expect(formatLanguageLabelFromCode('es', 'en')).toBe('Spanish');
    expect(formatLanguageLabelFromCode(undefined, 'en')).toBe('—');
  });
});
