import { isAiTranslated, prependAiTranslated, stripAiTranslated } from '../aiTranslatedText.js';

describe('aiTranslatedText', () => {
  it('treats a value as auto-translated only when it starts with the marker', () => {
    expect(isAiTranslated('(AI translated) Hello')).toBe(true);
    expect(isAiTranslated('Hello')).toBe(false);
    expect(isAiTranslated('')).toBe(false);
    expect(isAiTranslated('(AI translation pending) Hello')).toBe(false);
  });

  it('prepends the backend marker and its trailing space once', () => {
    expect(prependAiTranslated('Hello')).toBe('(AI translated) Hello');
    expect(prependAiTranslated('(AI translated) Hello')).toBe('(AI translated) Hello');
    expect(prependAiTranslated('')).toBe('');
  });

  it('strips the marker once', () => {
    expect(stripAiTranslated('(AI translated) Hello')).toBe('Hello');
    expect(stripAiTranslated('(AI translated) (AI translated) Hello')).toBe(
      '(AI translated) Hello'
    );
    expect(stripAiTranslated('Hello')).toBe('Hello');
    expect(stripAiTranslated('')).toBe('');
  });
});
