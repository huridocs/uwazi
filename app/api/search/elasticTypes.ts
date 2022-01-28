import { RequestParams } from '@elastic/elasticsearch';
import { RequestBody } from '@elastic/elasticsearch/lib/Transport';
import { Aggregations } from 'shared/types/aggregations';

interface ShardsResponse {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
}

interface Explanation {
  value: number;
  description: string;
  details: Explanation[];
}

export interface ElasticHit<T> {
  _index: string;
  _type: string;
  _id: string;
  _score: number;
  _source: T;
  _version?: number;
  _explanation?: Explanation;
  fields?: any;
  highlight?: any;
  // eslint-disable-next-line camelcase
  inner_hits?: { fullText: { hits: { hits: [{ highlight: {} }] } } };
  // eslint-disable-next-line camelcase
  matched_queries?: string[];
  sort?: string[];
}

export interface SearchResponse<T> {
  took: number;
  // eslint-disable-next-line camelcase
  timed_out: boolean;
  // eslint-disable-next-line camelcase
  _scroll_id?: string;
  _shards: ShardsResponse;
  hits: {
    total: { value: number; relation: 'eq' | 'gte' };
    // eslint-disable-next-line camelcase
    max_score: number;
    hits: Array<ElasticHit<T>>;
  };
  aggregations?: Aggregations;
}

export type IndicesDelete = Omit<RequestParams.IndicesDelete, 'index'>;
export type IndicesCreate = Omit<RequestParams.IndicesCreate<RequestBody>, 'index'>;
export type IndicesPutMapping = Omit<RequestParams.IndicesPutMapping<RequestBody>, 'index'>;
