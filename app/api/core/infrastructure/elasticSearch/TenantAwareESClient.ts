import type { Client } from '@elastic/elasticsearch';
import type { QueryDslQueryContainer } from '@elastic/elasticsearch/api/types';
import { z } from 'zod';
import {
  type SearchResponse,
  type SearchOptions,
  type IndexOptions,
  type DeleteOptions,
  type BulkOptions,
  type DeleteByQueryOptions,
  BulkIndexingError,
} from './Types.js';
import { IndexNameResolver } from './IndexNameResolver.js';

const tenantFilter = (tenantId: string): QueryDslQueryContainer => ({
  term: { tenantId },
});

const Schema = z.object({
  tenantId: z.string().trim().min(1),
});

type Deps = {
  client: Client;
  resolver: IndexNameResolver;
  tenantId: string;
};

class TenantAwareESClient {
  readonly tenantId: string;

  constructor(private deps: Deps) {
    const parsed = Schema.parse({ tenantId: this.deps.tenantId });
    this.tenantId = parsed.tenantId;
  }

  private applyTenantGuard(query: QueryDslQueryContainer): QueryDslQueryContainer {
    const filter = tenantFilter(this.tenantId);

    if (query.bool !== undefined) {
      const existingFilter = query.bool.filter;
      let normalised: QueryDslQueryContainer[];

      if (Array.isArray(existingFilter)) {
        normalised = [...existingFilter, filter];
      } else if (existingFilter !== undefined && existingFilter !== null) {
        normalised = [existingFilter as QueryDslQueryContainer, filter];
      } else {
        normalised = [filter];
      }

      return { bool: { ...query.bool, filter: normalised } };
    }

    return { bool: { must: [query], filter: [filter] } };
  }

  private buildDocumentId(id: string): string {
    return `${this.tenantId}__${id}`;
  }

  private stampTenantId(document: Record<string, unknown>): Record<string, unknown> {
    return { ...document, tenantId: this.tenantId };
  }

  async search<T>(options: SearchOptions): Promise<SearchResponse<T>> {
    const index = await this.deps.resolver.resolve(options.alias, this.tenantId);
    const guardedQuery = this.applyTenantGuard(options.query);

    const response = await this.deps.client.search<SearchResponse<T>>({
      index,
      body: {
        query: guardedQuery,
        from: options.from,
        size: options.size,
        sort: options.sort,
        _source: options.source,
      },
    });

    return response.body;
  }

  async index(options: IndexOptions): Promise<void> {
    const index = await this.deps.resolver.resolve(options.alias, this.tenantId);
    const id = this.buildDocumentId(options.id);
    const document = this.stampTenantId(options.document);

    await this.deps.client.index({ index, id, body: document, routing: options.routing });
  }

  async delete(options: DeleteOptions): Promise<void> {
    const index = await this.deps.resolver.resolve(options.alias, this.tenantId);
    const id = this.buildDocumentId(options.id);

    await this.deps.client.delete({ index, id, routing: options.routing });
  }

  async bulk(options: BulkOptions): Promise<void> {
    const index = await this.deps.resolver.resolve(options.alias, this.tenantId);

    const body = options.operations.flatMap(op => [
      { update: { _index: index, _id: this.buildDocumentId(op.id) } },
      { doc: this.stampTenantId(op.document), doc_as_upsert: true },
    ]);

    const response = await this.deps.client.bulk({
      body,
      routing: options.routing,
      refresh: options.refresh,
    });

    if (response.body.errors) {
      // Todo: Inject logger here.
      console.log('Bulk indexing errors', {
        failedItems: response.body.items.filter((item: any) => item.update?.error),
      });

      throw new BulkIndexingError();
    }
  }

  async deleteByQuery(options: DeleteByQueryOptions): Promise<void> {
    const index = await this.deps.resolver.resolve(options.alias, this.tenantId);
    const guardedQuery = this.applyTenantGuard(options.query);

    await this.deps.client.deleteByQuery({
      index,
      body: { query: guardedQuery },
      routing: options.routing,
      refresh: options.refresh,
    });
  }
}

export { TenantAwareESClient };
