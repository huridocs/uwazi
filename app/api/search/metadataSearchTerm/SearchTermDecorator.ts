const SEGMENTS = /("[^"]*"|\s+)/;
const PLAIN_WORD = /^[\p{L}\p{M}\p{N}]+$/u;
const ONLY_DIGITS = /^\p{N}+$/u;
const OPERATORS = ['AND', 'OR', 'NOT'];
const MIN_STEM_LENGTH = 3;

class SearchTermDecorator {
  static plainWords(term: string): string[] {
    return [...new Set(SearchTermDecorator.segments(term).filter(SearchTermDecorator.isPlainWord))];
  }

  static decorate(term: string, stems: Map<string, string>): string {
    return SearchTermDecorator.segments(term)
      .map(segment => {
        const stem = stems.get(segment);
        return SearchTermDecorator.isPlainWord(segment) && stem && stem.length >= MIN_STEM_LENGTH
          ? `(${segment} ${stem}*)`
          : segment;
      })
      .join('');
  }

  private static segments(term: string): string[] {
    if (SearchTermDecorator.hasUnbalancedQuotes(term)) {
      return [term];
    }
    return term.split(SEGMENTS).filter(segment => segment !== '');
  }

  private static hasUnbalancedQuotes(term: string) {
    return (term.match(/"/g) || []).length % 2 !== 0;
  }

  private static isPlainWord(segment: string) {
    return PLAIN_WORD.test(segment) && !ONLY_DIGITS.test(segment) && !OPERATORS.includes(segment);
  }
}

export { SearchTermDecorator };
