import { RangeQuery, SearchQuery } from 'shared/types/SearchQueryType';
import { RequestBody } from '@elastic/elasticsearch/lib/Transport';
import { cleanUp, extractSearchParams, snippetsHighlight } from './queryHelpers';
import { permissionsFilters } from './permissionsFilters';

const languageFilter = (language: string) => [{ term: { language } }];

const sharedIdFilter = (query: SearchQuery) =>
  query.filter?.sharedId ? [{ terms: { 'sharedId.raw': [query.filter.sharedId] } }] : [];

const isRange = (
  range: (RangeQuery | string | number | boolean) | undefined
): range is RangeQuery =>
  typeof range === 'object' &&
  (Object.keys(range).includes('from') || Object.keys(range).includes('to'));

const metadataFilters = (query: SearchQuery) =>
  Object.keys(query.filter || {})
    .filter(filter => filter.startsWith('metadata.'))
    .map(key => {
      const filterValue = query.filter?.[key];
      if (isRange(filterValue)) {
        return {
          range: { [`${key}.value`]: { gte: filterValue.from, lte: filterValue.to } },
        };
      }
      return {
        term: {
          [`${key}.value`]: query.filter?.[key],
        },
      };
    });

const fullTextSearch = (
  searchString: string | undefined,
  query: SearchQuery,
  searchMethod: string
) =>
  searchString
    ? [
        {
          has_child: {
            type: 'fullText',
            score_mode: 'max',
            inner_hits: {
              _source: false,
              ...snippetsHighlight(query),
            },
            query: {
              [searchMethod]: {
                query: searchString,
                fields: ['fullText_*'],
              },
            },
          },
        },
      ]
    : [];

const textSearch = (searchString: string | number | undefined, searchMethod: string) =>
  searchString ? [{ [searchMethod]: { query: searchString } }] : [];

const defaultFields = ['title', 'template', 'sharedId'];
export const buildQuery = async (query: SearchQuery, language: string): Promise<RequestBody> => {
  const { searchString, fullTextSearchString, searchMethod } = await extractSearchParams(query);
  return {
    _source: {
      includes: query.fields || defaultFields,
    },

    query: {
      bool: {
        filter: [
          ...metadataFilters(query),
          ...sharedIdFilter(query),
          ...languageFilter(language),
          ...permissionsFilters(query),
        ],
        must: [
          ...fullTextSearch(fullTextSearchString, query, searchMethod),
          ...textSearch(searchString, searchMethod),
        ],
      },
    },
    from: 0,
    size: query.page?.limit || 30,
  };
};
