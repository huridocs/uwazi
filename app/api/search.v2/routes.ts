import { Application, Request } from 'express';
import { elastic } from 'api/search/elastic';
import validateRequest from 'api/utils/validateRequest';
import { parseQuery } from 'api/utils';
import { SearchQuerySchema } from 'shared/types/SearchQuerySchema';
import { SearchQuery } from 'shared/types/SearchQueryType';

interface UwaziRequest<T> extends Request {
  query: T;
}

const searchRoutes = (app: Application) => {
  app.get(
    '/api/v2/entities',
    parseQuery,
    validateRequest({
      query: SearchQuerySchema,
    }),
    async (req: UwaziRequest<SearchQuery>, res, _next) => {
      const { query } = req;
      const response = await elastic.search({
        body: {
          _source: {
            include: ['title', 'template', 'sharedId', 'language'],
          },
          query: {
            bool: {
              must: query.filter?.searchQuery
                ? [{ query_string: { query: query.filter.searchQuery } }]
                : [],
              filter: [{ term: { language: { value: 'en' } } }],
            },
          },
        },
      });

      res.json({
        data: response.body.hits.hits.map(h => {
          const entity = h._source;
          entity._id = h._id;
          return entity;
        }),
      });
    }
  );
};

export { searchRoutes };
