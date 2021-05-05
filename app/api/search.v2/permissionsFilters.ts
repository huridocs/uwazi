import { SearchQuery } from 'shared/types/SearchQueryType';
import { permissionsContext } from 'api/permissions/permissionsContext';

import { cleanUp } from './queryHelpers';

export const permissionsFilters = (query: SearchQuery) => {
  const user = permissionsContext.getUserInContext();
  const publishedFilter = query.filter?.hasOwnProperty('published');

  return [
    !user && { term: { published: query.filter?.published === false ? 'not_allowed' : 'true' } },

    query.filter?.published && { term: { published: 'true' } },

    user && {
      bool: {
        [query.filter?.published === false ? 'must' : 'should']: [
          ...(permissionsContext.needsPermissionCheck()
            ? [
                {
                  term: { published: publishedFilter ? query.filter?.published : 'true' },
                },
                {
                  nested: {
                    path: 'permissions',
                    query: {
                      bool: {
                        must: [
                          {
                            terms: { 'permissions.refId': permissionsContext.permissionsRefIds() },
                          },
                        ],
                      },
                    },
                  },
                },
              ]
            : [publishedFilter && { term: { published: query.filter?.published } }].filter(
                cleanUp
              )),
        ],
      },
    },
  ].filter(cleanUp);
};
