import { Application, Request, Response } from 'express';

import { elastic } from 'api/search/elastic';
import { validateAndCoerceRequest } from 'api/utils/validateRequest';
import { SearchQuerySchema } from 'shared/types/SearchQuerySchema';
import { SearchQuery, Page } from 'shared/types/SearchQueryType';

import { mapResults } from 'api/search.v2/searchResponse';
import qs from 'qs';
import { buildQuery } from './buildQuery';

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

interface UwaziReq<T> extends Request {
  query: T;
}

type UwaziRes = Omit<Response, 'json'> & { json(data: UwaziResponse): Response };

const link = (limit: number, offset: number) =>
  `/api/v2/entities?${qs.stringify({
    page: { limit, offset },
  })}`;

const prevPaginationLink = (queryLimit: Page['limit'], currentOffset: number) =>
  queryLimit && currentOffset > 0 ? link(queryLimit, currentOffset - queryLimit) : undefined;

const nextPaginationLink = (queryLimit: Page['limit'], currentOffset: number, lastOffset: number) =>
  queryLimit && currentOffset < lastOffset
    ? link(queryLimit, currentOffset + queryLimit)
    : undefined;

const lastPaginationLink = (queryLimit: Page['limit'], offset: number) =>
  queryLimit ? link(queryLimit, offset) : undefined;

const searchRoutes = (app: Application) => {
  app.get(
    '/api/v2/entities',
    validateAndCoerceRequest({
      properties: {
        query: SearchQuerySchema,
      },
    }),
    async (req: UwaziReq<SearchQuery>, res: UwaziRes) => {
      const { query, language, url } = req;
      const response = await elastic.search({ body: await buildQuery(query, language) });
      const currentOffset = query.page?.offset || 0;
      const lastOffset = query.page?.limit ? response.body.hits.total.value - query.page.limit : 0;
      res.json({
        data: mapResults(response.body, query),
        links: {
          self: url,
          first: query.page?.limit ? url : undefined,
          prev: prevPaginationLink(query.page?.limit, currentOffset),
          next: nextPaginationLink(query.page?.limit, currentOffset, lastOffset),
          last: lastPaginationLink(query.page?.limit, lastOffset),
        },
      });
    }
  );
};

export { searchRoutes };
