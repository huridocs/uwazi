import type { Client } from '@elastic/elasticsearch';
import type { SearchIndexReader } from '../../application/contracts/SearchIndexReader.js';

type IndexStoreStats = {
  indices?: Record<string, { total?: { store?: { size_in_bytes?: number } } }>;
};

const NOT_FOUND = 404;

const isNotFound = (error: unknown) =>
  (error as { meta?: { statusCode?: number } })?.meta?.statusCode === NOT_FOUND;

/** Primaries and replicas: the bytes the cluster holds for the index. */
class ElasticSearchIndexReader implements SearchIndexReader {
  constructor(private readonly client: Client) {}

  async indexBytes(indexName: string): Promise<number> {
    try {
      const { body } = await this.client.indices.stats<IndexStoreStats>({
        index: indexName,
        metric: 'store',
      });
      return body.indices?.[indexName]?.total?.store?.size_in_bytes ?? 0;
    } catch (error) {
      if (isNotFound(error)) {
        return 0;
      }
      throw error;
    }
  }
}

export { ElasticSearchIndexReader };
