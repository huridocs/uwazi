import { Application, Request } from 'express';

import { elastic } from 'api/search/elastic';
import validateRequest from 'api/utils/validateRequest';
import { parseQuery } from 'api/utils';
import { SearchQuerySchema } from 'shared/types/SearchQuerySchema';
import { SearchQuery } from 'shared/types/SearchQueryType';

interface UwaziRequest<T> extends Request {
  query: T;
}

interface UwaziResponse {
  data: any;
  links?: {
    self: string;
    first?: string | null;
  };
}

const searchRoutes = (app: Application) => {
  app.get(
    '/api/v2/entities',
    parseQuery,
    validateRequest({
      query: SearchQuerySchema,
    }),
    async (req: UwaziRequest<SearchQuery>, res, _next) => {
      const { query, language, url } = req;
      const links: UwaziResponse['links'] = { self: url };

      const elasticQuery = {
        body: {
          _source: {
            include: ['title', 'template', 'sharedId', 'language'],
          },
          query: {
            bool: {
              filter: [{ term: { language: { value: language } } }],
              must: query.filter?.searchString
                ? [{ query_string: { query: query.filter.searchString } }]
                : [],
            },
          },
          from: 0,
          size: 300,
        },
      };

      if (query.page?.limit) {
        elasticQuery.body.size = query.page.limit;
      }

      const response = await elastic.search(elasticQuery);

      if (query.page?.limit) {
        links.first = url;
      }

      const APIResponse: UwaziResponse = {
        data: response.body.hits.hits.map(h => {
          const entity = h._source;
          entity._id = h._id;
          return entity;
        }),
        links,
      };

      res.json(APIResponse);
    }
  );
};

export { searchRoutes };
