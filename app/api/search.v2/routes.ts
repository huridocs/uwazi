import { Application, Request, Response, NextFunction } from 'express';
//@ts-ignore
import queryTypes from 'query-types';

import { elastic } from 'api/search/elastic';
import validateRequest from 'api/utils/validateRequest';
import { SearchQuerySchema } from 'shared/types/SearchQuerySchema';
import { SearchQuery } from 'shared/types/SearchQueryType';

import { searchSnippets } from 'api/search.v2/snippetsSearch';
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

const captureError = (
  callback: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    await callback(req, res, next);
  } catch (e) {
    next(e);
  }
};

const searchRoutes = (app: Application) => {
  app.get(
    '/api/v2/entities',
    queryTypes.middleware(),
    validateRequest({
      properties: {
        query: SearchQuerySchema,
      },
    }),
    captureError(async (req: UwaziReq<SearchQuery>, res: UwaziRes) => {
      const { query, language, url } = req;

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
    })
  );

  app.get(
    '/api/v2/entities/:_id/snippets',
    queryTypes.middleware(),
    validateRequest({
      properties: {
        query: SearchQuerySchema,
      },
    }),
    captureError(async (req: UwaziReq<SearchQuery>, res: UwaziRes) => {
      const { query, language, url } = req;
      const { _id } = req.params;
      const response = await searchSnippets(_id, query, language);
      res.json({ data: response, links: { self: url } });
    })
  );
};

export { searchRoutes };
