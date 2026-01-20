import { Application, Request, Response } from 'express';

import { elastic } from '#api/search/elastic.js';
import { validateAndCoerceRequest } from '#api/utils/validateRequest.js';
import { SearchQuerySchema } from '#shared/types/SearchQuerySchema.js';
import { SearchQuery, Page } from '#shared/types/SearchQueryType.js';

import { mapResults } from '#api/search.v2/searchResponse.js';
import qs from 'qs';
import { buildQuery } from '#api/search.v2/buildQuery.js';
import { tenants } from '#api/tenants/index.js';

interface UwaziResponse {
  data: any;
  links?: {
    self: string;
    first?: string | null;
    last?: string | null;
    next?: string | null;
    prev?: string | null;
  };
}

type UwaziReq = Request & { query: SearchQuery };

type UwaziRes = Omit<Response, 'json'> & { json(data: UwaziResponse): Response };

const link = (limit: number, offset: number) =>
  `/api/v2/search?${qs.stringify({
    page: { limit, offset },
  })}`;

const prevPaginationLink = (queryLimit: Page['limit'], currentOffset: number) =>
  queryLimit && currentOffset > 0 ? link(queryLimit, currentOffset - queryLimit) : undefined;

const nextPaginationLink = (
  queryLimit: Page['limit'],
  currentOffset: number,
  lastOffset: number
) =>
  queryLimit && currentOffset < lastOffset
    ? link(queryLimit, currentOffset + queryLimit)
    : undefined;

const lastPaginationLink = (queryLimit: Page['limit'], offset: number) =>
  queryLimit ? link(queryLimit, offset) : undefined;

const pagination = (currentUrl: string, totalResults: number, page?: Page) => {
  const currentOffset = page?.offset || 0;
  const lastOffset = page?.limit ? totalResults - page.limit : 0;
  return {
    self: currentUrl,
    first: page?.limit ? currentUrl : undefined,
    prev: prevPaginationLink(page?.limit, currentOffset),
    next: nextPaginationLink(page?.limit, currentOffset, lastOffset),
    last: lastPaginationLink(page?.limit, lastOffset),
  };
};

const searchRoutes = (app: Application) => {
  app.get(
    '/api/v2/search',
    validateAndCoerceRequest({
      type: 'object',
      properties: {
        query: SearchQuerySchema,
      },
    }),
    async (req: UwaziReq, res: UwaziRes) => {
      const { query, language, url } = req;
      const mappings = (await elastic.indices.getMapping()).body[tenants.current().indexName]
        .mappings.properties;
      const response = await elastic.search({ body: await buildQuery(query, language, mappings) });
      res.json({
        data: mapResults(response.body, query),
        links: pagination(url, response.body.hits.total.value, query.page),
      });
    }
  );
};

export { searchRoutes };
