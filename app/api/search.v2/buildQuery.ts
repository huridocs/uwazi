import { SearchQuery } from 'shared/types/SearchQueryType';
import { RequestBody } from '@elastic/elasticsearch/lib/Transport';

import { cleanUp, searchStringMethod } from './queryHelpers';
import { permissionsFilters } from './permissionsFilters';

async function extractSearchParams(query: SearchQuery) {
  if (query.filter && query.filter.searchString && typeof query.filter.searchString === 'string') {
    const regex = /fullText:\s*([^,]*)/g;
    const fullTextGroups = regex.exec(query.filter.searchString);
    const fullTextSearchString = fullTextGroups ? fullTextGroups[1] : undefined;
    const searchString = fullTextGroups
      ? query.filter.searchString.replace(fullTextGroups[0], '')
      : query.filter.searchString;
    const searchMethod =
      query.filter && query.filter.searchString
        ? await searchStringMethod(query.filter.searchString)
        : 'query_string';
    return { searchString, fullTextSearchString, searchMethod };
  }
  return { searchMethod: 'query_string' };
}

export const buildQuery = async (query: SearchQuery, language: string): Promise<RequestBody> => {
  const __ret = await extractSearchParams(query);
  const { searchString, fullTextSearchString, searchMethod } = __ret;
  return {
    _source: {
      includes: ['title', 'template', 'sharedId', 'language', 'documents._id'],
    },
    query: {
      bool: {
        filter: [{ term: { language } }, ...permissionsFilters(query)].filter(cleanUp),
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
