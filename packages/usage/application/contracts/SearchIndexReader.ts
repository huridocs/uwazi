interface SearchIndexReader {
  /** Bytes the index takes; 0 when it does not exist. */
  indexBytes(indexName: string): Promise<number>;
}

export type { SearchIndexReader };
