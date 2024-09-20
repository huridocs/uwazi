import elasticSearch, { RequestParams } from '@elastic/elasticsearch';
import {
  TransportRequestOptions,
  RequestBody,
  RequestNDBody,
} from '@elastic/elasticsearch/lib/Transport';
import { tenants } from 'api/tenants';
import { config } from 'api/config';
import { EntitySchema } from 'shared/types/entityType';
import { SearchResponse, IndicesPutMapping, IndicesDelete, IndicesCreate } from './elasticTypes';

const elasticClient = new elasticSearch.Client({
  nodes: config.elasticsearch_nodes,
});

const elastic = {
  async search(params?: RequestParams.Search<RequestBody>, options?: TransportRequestOptions) {
    return elasticClient.search<SearchResponse<EntitySchema>, RequestBody>(
      { ...params, index: tenants.current().indexName },
      options
    );
  },

  async scroll(scrollId: string, keepAlive = '30s') {
    return elasticClient.scroll({ scroll_id: scrollId, scroll: keepAlive });
  },

  async delete(params: RequestParams.Delete, options?: TransportRequestOptions) {
    return elasticClient.delete({ ...params, index: tenants.current().indexName }, options);
  },

  async bulk(params: RequestParams.Bulk<RequestNDBody>, options?: TransportRequestOptions) {
    return elasticClient.bulk({ ...params, index: tenants.current().indexName }, options);
  },

  async deleteByQuery(
    params: RequestParams.DeleteByQuery<RequestBody>,
    options?: TransportRequestOptions
  ) {
    return elasticClient.deleteByQuery({ ...params, index: tenants.current().indexName }, options);
  },

  indices: {
    async putMapping(params: IndicesPutMapping, options?: TransportRequestOptions) {
      return elasticClient.indices.putMapping(
        { ...params, index: tenants.current().indexName },
        options
      );
    },

    async getMapping(params?: RequestParams.IndicesGetMapping, options?: TransportRequestOptions) {
      return elasticClient.indices.getMapping(
        { ...params, index: tenants.current().indexName },
        options
      );
    },

    async delete(params?: IndicesDelete, options?: TransportRequestOptions) {
      return elasticClient.indices.delete(
        { ...params, index: tenants.current().indexName },
        options
      );
    },

    async create(params?: IndicesCreate, options?: TransportRequestOptions) {
      return elasticClient.indices.create(
        { ...params, index: tenants.current().indexName },
        options
      );
    },

    async refresh(params?: RequestParams.IndicesRefresh, options?: TransportRequestOptions) {
      return elasticClient.indices.refresh(
        { ...params, index: tenants.current().indexName },
        options
      );
    },

    async validateQuery(
      params?: RequestParams.IndicesValidateQuery<RequestBody>,
      options?: TransportRequestOptions
    ) {
      return elasticClient.indices.validateQuery(
        { ...params, index: tenants.current().indexName },
        options
      );
    },
  },

  cat: {
    async indices(params?: RequestParams.CatIndices, options?: TransportRequestOptions) {
      return elasticClient.cat.indices({ ...params, index: tenants.current().indexName }, options);
    },
  },
};

export { elastic, elasticClient };
