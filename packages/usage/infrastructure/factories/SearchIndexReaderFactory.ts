import { elasticClient } from '#api/search/elastic.js';
import type { SearchIndexReader } from '../../application/contracts/SearchIndexReader.js';
import { ElasticSearchIndexReader } from '../elasticsearch/ElasticSearchIndexReader.js';

class SearchIndexReaderFactory {
  static default(): SearchIndexReader {
    return new ElasticSearchIndexReader(elasticClient);
  }
}

export { SearchIndexReaderFactory };
