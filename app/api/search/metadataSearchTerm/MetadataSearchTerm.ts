import { legacyLogger } from '#api/log/index.js';
import { prettifyError } from '#api/utils/handleError.js';
import { ElasticStemmer } from './ElasticStemmer.js';
import { SearchTermDecorator } from './SearchTermDecorator.js';

class MetadataSearchTerm {
  static async for(term: string, language: string, searchType: string): Promise<string> {
    if (searchType !== 'query_string') {
      return term;
    }

    const words = SearchTermDecorator.plainWords(term);
    if (!words.length) {
      return term;
    }

    try {
      const stems = await ElasticStemmer.stems(words, language);
      return SearchTermDecorator.decorate(term, stems);
    } catch (e) {
      legacyLogger.error(prettifyError(e));
      return term;
    }
  }
}

export { MetadataSearchTerm };
