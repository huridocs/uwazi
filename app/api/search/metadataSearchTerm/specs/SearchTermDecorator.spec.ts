import { SearchTermDecorator } from '../SearchTermDecorator.js';

describe('SearchTermDecorator', () => {
  describe('plainWords', () => {
    it.each([
      { term: 'corporate laws', words: ['corporate', 'laws'] },
      { term: 'laws  laws', words: ['laws'] },
      { term: 'países', words: ['países'] },
      { term: 'law* law? -law +law law~ law^2 title:law (law)', words: [] },
      {
        term: 'corporate AND laws OR rights NOT torture',
        words: ['corporate', 'laws', 'rights', 'torture'],
      },
      { term: '"corporate laws" rights', words: ['rights'] },
      { term: '"corporate laws rights', words: [] },
      { term: '2023 laws', words: ['laws'] },
      { term: 'covid19', words: ['covid19'] },
      { term: '', words: [] },
    ])('should pick $words out of "$term"', ({ term, words }) => {
      expect(SearchTermDecorator.plainWords(term)).toEqual(words);
    });
  });

  describe('decorate', () => {
    const stems = new Map([
      ['corporate', 'corpor'],
      ['laws', 'law'],
      ['law', 'law'],
      ['rights', 'right'],
      ['is', 'is'],
    ]);

    it.each([
      { term: 'laws', expected: '(laws law*)' },
      { term: 'law', expected: '(law law*)' },
      { term: 'corporate laws', expected: '(corporate corpor*) (laws law*)' },
      { term: 'corporate AND laws', expected: '(corporate corpor*) AND (laws law*)' },
      { term: '"corporate laws" rights', expected: '"corporate laws" (rights right*)' },
      { term: 'law* -laws title:laws', expected: 'law* -laws title:laws' },
      { term: 'is laws', expected: 'is (laws law*)' },
      { term: 'unknown laws', expected: 'unknown (laws law*)' },
      { term: '"corporate laws', expected: '"corporate laws' },
      { term: '  laws\trights ', expected: '  (laws law*)\t(rights right*) ' },
    ])('should turn "$term" into "$expected"', ({ term, expected }) => {
      expect(SearchTermDecorator.decorate(term, stems)).toBe(expected);
    });
  });
});
