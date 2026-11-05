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

  it('uses the catalog name when the runtime only echoes the code', () => {
    const real = Intl.DisplayNames;
    function CodeOnlyDisplayNames(this: { of(code: string): string }) {
      this.of = (code: string) => code;
    }
    Object.assign(Intl, { DisplayNames: CodeOnlyDisplayNames });
    try {
      expect(formatLanguageName('aa', 'und-x-code')).toBe('Afar');
      expect(formatLanguageName('ab', 'und-x-code')).toBe('Abkhazian');
    } finally {
      Object.assign(Intl, { DisplayNames: real });
    }
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
