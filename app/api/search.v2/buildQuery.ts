import { SearchQuery } from 'shared/types/SearchQueryType';
import { RequestBody } from '@elastic/elasticsearch/lib/Transport';

import { cleanUp, searchStringMethod } from './queryHelpers';
import { permissionsFilters } from './permissionsFilters';

async function extractSearchParams(query: SearchQuery) {
  if (query.filter && query.filter.searchString && typeof query.filter.searchString === 'string') {
    let { searchString } = query.filter;
    let fullTextSearchString = searchString;
    const searchMethod = await searchStringMethod(searchString);

    if (query.filter.searchString.includes(':')) {
      const fullTextGroups = /fullText:\s*([^,]*)/g.exec(searchString) || [''];
      if (fullTextGroups.length > 1) {
        [searchString] = fullTextGroups;
        fullTextSearchString = fullTextGroups[1].replace(fullTextGroups[0], '');
      } else fullTextSearchString = '';
    }
    return { searchString, fullTextSearchString, searchMethod };
  }
  return {
    searchString: query.filter?.searchString,
    searchMethod: 'query_string',
  };
}

export const buildQuery = async (query: SearchQuery, language: string): Promise<RequestBody> => {
  const { searchString, fullTextSearchString, searchMethod } = await extractSearchParams(query);
  return {
    _source: {
      includes: ['title', 'template', 'sharedId', 'language', 'documents._id'],
    },
    query: {
      bool: {
        filter: [
          query.filter?.sharedId && {
            terms: {
              'sharedId.raw': [query.filter.sharedId],
            },
          },
          {
            term: { language },
          },
          ...permissionsFilters(query),
        ].filter(cleanUp),
        must: [
          fullTextSearchString && {
            has_child: {
              type: 'fullText',
              score_mode: 'max',
              inner_hits: {
                _source: false,
                highlight: {
                  order: 'score',
                  pre_tags: ['<b>'],
                  post_tags: ['</b>'],
                  encoder: 'html',
                  number_of_fragments: 9999,
                  type: 'fvh',
                  fragment_size: 300,
                  fragmenter: 'span',
                  fields: {
                    'fullText_*': {},
                  },
                },
              },
              query: {
                [searchMethod]: {
                  query: fullTextSearchString,
                  fields: ['fullText_*'],
                },
              },
            },
          },
          searchString && {
            [searchMethod]: {
              query: searchString,
            },
          },
        ].filter(cleanUp),
      },
    },
    from: 0,
    size: query.page?.limit || 30,
  };
};
