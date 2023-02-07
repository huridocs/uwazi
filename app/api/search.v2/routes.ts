import { Application, Request, Response } from 'express';

import { elastic } from 'api/search/elastic';
import { Page } from 'shared/types/SearchQueryType';

import { mapResults } from 'api/search.v2/searchResponse';
import { paths } from 'api/uwaziOpenAPIDocumentTypes';
import qs from 'qs';
import { buildQuery } from './buildQuery';

const link = (limit: number, offset: number) =>
  `/api/v2/search?${qs.stringify({
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

type SearchQuery = {
  query: NonNullable<paths['/api/v2/search']['get']['parameters']>['query'];
};

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

type UwaziRes = Omit<Response, 'json'> & { json(data: UwaziResponse): Response };

const searchRoutes = (app: Application) => {
  app.get('/api/v2/search', async (req: Request & SearchQuery, res: UwaziRes) => {
    const { query, language, url } = req;

    const response = await elastic.search({ body: await buildQuery(query, language) });
    res.json({
      data: mapResults(response.body, query),
      links: pagination(url, response.body.hits.total.value, query.page),
    });
  });
};

export { searchRoutes };
