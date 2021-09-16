import { RangeQuery, SearchQuery } from 'shared/types/SearchQueryType';
import { RequestBody } from '@elastic/elasticsearch/lib/Transport';
import { cleanUp, extractSearchParams, snippetsHighlight } from './queryHelpers';
import { permissionsFilters } from './permissionsFilters';

const languageFilter = (language: string) => [{ term: { language } }];

const sharedIdFilter = (query: SearchQuery) =>
  query.filter?.sharedId ? [{ terms: { 'sharedId.raw': [query.filter.sharedId] } }] : [];

const isRange = (
  range: (RangeQuery | string | number | boolean) | undefined
): range is RangeQuery => typeof range === 'object' && Object.keys(range).includes('from');

const metadataFilters = (query: SearchQuery) =>
  Object.keys(query.filter || {})
    .filter(filter => filter.startsWith('metadata.'))
    .map(key => {
      const filterValue = query.filter?.[key];
      if (isRange(filterValue)) {
        return {
          range: { [`${key}.value`]: { lte: filterValue.to } },
        };
      }
      return {
        term: {
          [`${key}.value`]: query.filter?.[key],
        },
      };
    });

const defaultFields = ['title', 'template', 'sharedId'];
export const buildQuery = async (query: SearchQuery, language: string): Promise<RequestBody> => {
  const { searchString, fullTextSearchString, searchMethod } = await extractSearchParams(query);
  return {
    _source: {
      includes: query.fields || defaultFields,
    },
    // const match = { range: {} };
    // match.range[`${path}.${filter.name}`] = { gte: filter.value.from, lte: filter.value.to };
    // return match;
    query: {
      bool: {
        filter: [
          ...metadataFilters(query),
          ...sharedIdFilter(query),
          ...languageFilter(language),
          ...permissionsFilters(query),
        ],
        must: [
          fullTextSearchString && {
            has_child: {
              type: 'fullText',
              score_mode: 'max',
              inner_hits: {
                _source: false,
                ...snippetsHighlight(query),
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
