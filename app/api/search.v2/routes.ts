import { Application, Request, Response, NextFunction } from 'express';
//@ts-ignore
import queryTypes from 'query-types';

import { elastic } from 'api/search/elastic';
import validateRequest from 'api/utils/validateRequest';
import { SearchQuerySchema } from 'shared/types/SearchQuerySchema';
import { SearchQuery } from 'shared/types/SearchQueryType';

import { mapResults } from 'api/search.v2/searchResponse';
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
        data: mapResults(response.body.hits.hits, query),
        links: {
          self: url,
          first: query.page?.limit ? url : undefined,
        },
      });
    })
  );
};

export { searchRoutes };
