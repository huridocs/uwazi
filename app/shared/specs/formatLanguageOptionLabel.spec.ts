import { formatLanguageLabelFromCode, formatLanguageOptionLabel } from '../language/formatLanguageOptionLabel.js';

describe('formatLanguageOptionLabel', () => {
  it('formats the language name in the UI locale with its ISO code', () => {
    expect(formatLanguageOptionLabel('es', 'en')).toBe('Spanish - ES');
    expect(formatLanguageOptionLabel('es', 'es')).toBe('Español - ES');
  });

  it('falls back to English names when the UI locale is missing', () => {
    expect(formatLanguageOptionLabel('en', '')).toBe('English - EN');
  });

  it('accepts ISO 639-1 or 639-3 codes', () => {
    expect(formatLanguageLabelFromCode('spa', 'es')).toBe('Español - ES');
    expect(formatLanguageLabelFromCode('es', 'en')).toBe('Spanish - ES');
    expect(formatLanguageLabelFromCode(undefined, 'en')).toBe('—');
  });
});
