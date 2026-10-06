import { shouldKeepEnglish } from '../keepEnglish.js';

describe('shouldKeepEnglish', () => {
  it('keeps brands, formats and query syntax in English', () => {
    expect(shouldKeepEnglish({ key: 'Uwazi' })).toBe(true);
    expect(shouldKeepEnglish({ key: 'PDF' })).toBe(true);
    expect(shouldKeepEnglish({ key: 'AND OR NOT' })).toBe(true);
    expect(shouldKeepEnglish({ key: '198?' })).toBe(true);
    expect(shouldKeepEnglish({ key: '"Costa Rica"' })).toBe(true);
    expect(shouldKeepEnglish({ key: 'juris*' })).toBe(true);
  });

  it('keeps rows marked DoNotTranslate or example-query components', () => {
    expect(shouldKeepEnglish({ key: 'Anything', doNotTranslate: true })).toBe(true);
    expect(shouldKeepEnglish({ key: 'the status "~5"', component: 'Search tip example' })).toBe(
      true
    );
  });

  it('does not keep real UI copy just because it mentions a format', () => {
    expect(shouldKeepEnglish({ key: 'Upload' })).toBe(false);
    expect(shouldKeepEnglish({ key: 'Choose PDF files' })).toBe(false);
    expect(shouldKeepEnglish({ key: 'or drag and drop PDF files here' })).toBe(false);
    expect(shouldKeepEnglish({ key: 'Save' })).toBe(false);
    expect(shouldKeepEnglish({ key: 'Are you sure?' })).toBe(false);
  });
});
