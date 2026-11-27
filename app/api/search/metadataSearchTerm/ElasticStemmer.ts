import { elastic } from '#api/search/elastic.js';
import { elasticLanguageCodes, LanguageUtils } from '#shared/language/index.js';

type AnalyzedToken = { token: string; start_offset: number; end_offset: number };

type WordSpan = { word: string; start: number; end: number };

const GENERIC_ANALYZER = 'other';

class ElasticStemmer {
  static async stems(words: string[], language: string): Promise<Map<string, string>> {
    if (!words.length) {
      return new Map();
    }

    const spans = ElasticStemmer.spans(words);
    const response = await elastic.indices.analyze({
      body: {
        analyzer: ElasticStemmer.analyzerFor(language),
        text: words.join(' '),
      },
    });

    return ElasticStemmer.stemsBySpan(spans, response.body.tokens);
  }

  private static analyzerFor(language: string) {
    const elasticLanguage = LanguageUtils.fromISO639_1(language).elastic;
    return elasticLanguage && elasticLanguageCodes.includes(elasticLanguage)
      ? `stop_${elasticLanguage}`
      : GENERIC_ANALYZER;
  }

  private static spans(words: string[]): WordSpan[] {
    let start = 0;
    return words.map(word => {
      const span = { word, start, end: start + word.length };
      start = span.end + 1;
      return span;
    });
  }

  private static stemsBySpan(spans: WordSpan[], tokens: AnalyzedToken[]) {
    const stems = new Map<string, string>();
    spans.forEach(({ word, start, end }) => {
      const wordTokens = tokens.filter(t => t.start_offset >= start && t.end_offset <= end);
      const [token] = wordTokens;
      if (wordTokens.length === 1 && token.start_offset === start && token.end_offset === end) {
        stems.set(word, token.token);
      }
    });
    return stems;
  }
}

export { ElasticStemmer };
