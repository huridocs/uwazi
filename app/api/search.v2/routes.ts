import { Application, Request, Response } from 'express';

import { elastic } from 'api/search/elastic';
import validateRequest from 'api/utils/validateRequest';
import { parseQuery } from 'api/utils';
import { SearchQuerySchema } from 'shared/types/SearchQuerySchema';
import { SearchQuery } from 'shared/types/SearchQueryType';

import { buildQuery } from './buildQuery';

interface UwaziResponse {
  data: any;
  links?: {
    self: string;
    first?: string | null;
  };
}

interface UwaziReq<T> extends Request {
  query: T;
}

type UwaziRes = Omit<Response, 'json'> & { json(data: UwaziResponse): Response };

const searchRoutes = (app: Application) => {
  app.get(
    '/api/v2/entities',
    parseQuery,
    validateRequest({
      query: SearchQuerySchema,
    }),
    async (req: UwaziReq<SearchQuery>, res: UwaziRes, _next) => {
      const { query, language, url } = req;
      const { filter = {} } = query;

      //should parse query do this?
      if (filter.published === 'false') {
        filter.published = false;
      }
      if (filter.published === 'true') {
        filter.published = true;
      }
      //

      const response = await elastic.search({ body: await buildQuery(query, language) });

      res.json({
        data: response.body.hits.hits.map(h => {
          const entity = h._source;
          entity._id = h._id;
          return entity;
        }),
        links: {
          self: url,
          first: query.page?.limit ? url : undefined,
        },
      });
    }
  );
};

export { searchRoutes };
