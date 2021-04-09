import { Application, Request } from 'express';

import { elastic } from 'api/search/elastic';
import validateRequest from 'api/utils/validateRequest';
import { parseQuery } from 'api/utils';
import { SearchQuerySchema } from 'shared/types/SearchQuerySchema';
import { SearchQuery } from 'shared/types/SearchQueryType';
import { permissionsContext } from 'api/permissions/permissionsContext';

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

const nested = (filters, path) => ({
  nested: {
    path,
    query: {
      bool: {
        must: filters,
      },
    },
  },
});

const searchRoutes = (app: Application) => {
  app.get(
    '/api/v2/entities',
    parseQuery,
    validateRequest({
      query: SearchQuerySchema,
    }),
    async (req: UwaziRequest<SearchQuery>, res, _next) => {
      const { query, language, url } = req;
      const { filter = {} } = query;

      const user = permissionsContext.getUserInContext();
      const needsPermissions = !['admin', 'editor'].includes((user || {}).role);
      const elasticQuery = {
        body: {
          _source: {
            includes: ['title', 'template', 'sharedId', 'language'],
          },
          query: {
            bool: {
              filter: [
                { term: { language } },
                ...(!user || filter.published ? [{ term: { published: true } }] : []),
                ...(user && needsPermissions && filter.published === undefined
                  ? [
                      {
                        bool: {
                          should: [
                            { term: { published: true } },
                            nested(
                              [
                                {
                                  terms: {
                                    'permissions.refId': permissionsContext.permissionsRefIds(),
                                  },
                                },
                              ],
                              'permissions'
                            ),
                          ],
                        },
                      },
                    ]
                  : []),
              ],
              must: filter.searchString ? [{ query_string: { query: filter.searchString } }] : [],
            },
          },
          from: 0,
          size: query.page?.limit || 300,
        },
      };

      const response = await elastic.search(elasticQuery);

      const APIResponse: UwaziResponse = {
        data: response.body.hits.hits.map(h => {
          const entity = h._source;
          entity._id = h._id;
          return entity;
        }),
        links: {
          self: url,
          first: query.page?.limit ? url : undefined,
        },
      };

      res.json(APIResponse);
    }
  );
};

export { searchRoutes };
