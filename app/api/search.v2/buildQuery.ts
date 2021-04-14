import { SearchQuery } from 'shared/types/SearchQueryType';
import { RequestBody } from '@elastic/elasticsearch/lib/Transport';

import { cleanUp, searchStringMethod } from './queryHelpers';
import { permissionsFilters } from './permissionsFilters';

export const buildQuery = async (query: SearchQuery, language: string): Promise<RequestBody> => ({
  _source: {
    includes: ['title', 'template', 'sharedId', 'language', 'documents._id'],
  },
  query: {
    bool: {
      filter: [{ term: { language } }, ...permissionsFilters(query)],
      must: [
        query.filter?.searchString && {
          [await searchStringMethod(query.filter.searchString)]: {
            query: query.filter.searchString,
          },
        },
      ].filter(cleanUp),
    },
  },
  from: 0,
  size: query.page?.limit || 30,
});
