import elasticSearch, { RequestParams } from '@elastic/elasticsearch';
import { IndicesPutSettings } from '@elastic/elasticsearch/api/requestParams';
import {
  RequestBody,
  RequestNDBody,
  TransportRequestOptions,
} from '@elastic/elasticsearch/lib/Transport';
import { config } from 'api/config';
import { tenants } from 'api/tenants';
import { EntitySchema } from 'shared/types/entityType';
import { IndicesCreate, IndicesDelete, IndicesPutMapping, SearchResponse } from './elasticTypes';

const elasticClient = new elasticSearch.Client({
  nodes: config.elasticsearch.nodes,
  requestTimeout: config.elasticsearch.requestTimeout,
  auth: config.elasticsearch.auth,
});

const elastic = {
  async search(params?: RequestParams.Search<RequestBody>, options?: TransportRequestOptions) {
    return elasticClient.search<SearchResponse<EntitySchema>, RequestBody>(
      { ...params, index: tenants.current().indexName },
      options
    );
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
    async putSettings(params: IndicesPutSettings, options?: TransportRequestOptions) {
      return elasticClient.indices.putSettings(
        {
          ...params,
          index: tenants.current().indexName,
        },
        options
      );
    },

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
