import { permissionsContext } from 'api/permissions/permissionsContext';
import { SearchQuery } from 'shared/types/SearchQueryType';
import { RequestBody } from '@elastic/elasticsearch/lib/Transport';

import { elastic } from 'api/search';

import { bool, cleanUp, term, nested, must, terms } from './queryHelpers';

const searchStringMethod = async (searchString: string | number) => {
  const validationResult = await elastic.indices.validateQuery({
    body: { query: { query_string: { query: searchString } } },
  });
  return validationResult.body.valid ? 'query_string' : 'simple_query_string';
};

export const buildQuery = async (query: SearchQuery, language: string): Promise<RequestBody> => {
  const user = permissionsContext.getUserInContext();
  const publishedFilter = query.filter?.published;

  return {
    _source: { includes: ['title', 'template', 'sharedId', 'language'] },
    query: bool({
      filter: cleanUp([
        term({ language }),
        query.filter?.published && term({ published: 'true' }),
        !user && term({ published: query.filter?.published === false ? 'not_allowed' : 'true' }),
        user &&
          bool({
            [query.filter?.published === false ? 'must' : 'should']: cleanUp([
              publishedFilter !== undefined && term({ published: publishedFilter.toString() }),
              ...(permissionsContext.needsPermissionCheck()
                ? [
                    term({
                      published:
                        publishedFilter !== undefined ? publishedFilter.toString() : 'true',
                    }),
                    nested({
                      path: 'permissions',
                      query: bool(
                        must([
                          terms({
                            'permissions.refId': permissionsContext.permissionsRefIds(),
                          }),
                        ])
                      ),
                    }),
                  ]
                : []),
            ]),
          }),
      ]),
      must: cleanUp([
        query.filter?.searchString && {
          [await searchStringMethod(query.filter.searchString)]: {
            query: query.filter.searchString,
          },
        },
      ]),
    }),
    from: 0,
    size: query.page?.limit || 30,
  };
};
