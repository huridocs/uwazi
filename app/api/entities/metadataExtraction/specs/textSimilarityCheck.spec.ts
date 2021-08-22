import { textSimilarityCheck } from '../textSimilarityCheck';

describe('Are text similar', () => {
  it('should detect similar texts', () => {
    expect(textSimilarityCheck('', '')).toEqual(true);
    expect(textSimilarityCheck('it works', 'it works')).toEqual(true);
    expect(textSimilarityCheck('it works', 'different text')).toEqual(false);
    expect(textSimilarityCheck('it works', '')).toEqual(false);
    expect(
      textSimilarityCheck(
        'very long sentence with a lot of words',
        'very long sentence with a lot of'
      )
    ).toEqual(true);
    expect(
      textSimilarityCheck(
        'very long sentence with a lot of words',
        'long sentence, with a lot of words'
      )
    ).toEqual(true);
    expect(
      textSimilarityCheck(
        'very long sentence with a lot of words',
        'very long, with a lot of words'
      )
    ).toEqual(true);
    expect(
      textSimilarityCheck(
        'very long sentence with a lot of words',
        'different sentence with different words'
      )
    ).toEqual(false);
    expect(
      textSimilarityCheck(
        'verylongsentencewithalotofwords',
        'very long sentence with a lot of words'
      )
    ).toEqual(true);
    expect(
      textSimilarityCheck('very long sentence with a lot of words', 'very long of words')
    ).toEqual(false);
  });

  it('should account for numbers and only return true if they are the same', () => {
    expect(textSimilarityCheck(1, 1)).toBe(true);
    expect(textSimilarityCheck(1, 2)).toBe(false);
    expect(textSimilarityCheck(198234, 19823)).toBe(false);
    expect(textSimilarityCheck('198234', '19823')).toBe(false);
    expect(textSimilarityCheck(198234, '198234')).toBe(true);
    expect(textSimilarityCheck(198234, '1982')).toBe(false);
    expect(textSimilarityCheck('', 456123)).toBe(false);
    expect(textSimilarityCheck('', '456123')).toBe(false);
  });
});
