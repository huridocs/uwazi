import { CompoundFilter, RangeFilter, SearchQuery } from 'shared/types/SearchQueryType';
import { RequestBody } from '@elastic/elasticsearch/lib/Transport';
import { extractSearchParams, snippetsHighlight } from './queryHelpers';
import { permissionsFilters } from './permissionsFilters';

type Filter = (RangeFilter | CompoundFilter | string | number | boolean) | undefined;

const isRange = (range: Filter): range is RangeFilter =>
  typeof range === 'object' && (range.hasOwnProperty('from') || range.hasOwnProperty('to'));

const isCompound = (filterValue: Filter): filterValue is CompoundFilter =>
  typeof filterValue === 'object' && filterValue.hasOwnProperty('values');

const getFilterValue = (filterValue: Filter) => {
  if (isCompound(filterValue)) {
    const operator = filterValue.operator === 'AND' ? ' + ' : ' | ';
    return filterValue.values?.join(operator);
  }

  return filterValue;
};

const buildPropertyFilter = (query: SearchQuery) => (key: string) => {
  const filterValue = query.filter?.[key];
  if (isRange(filterValue)) {
    return {
      range: { [`${key}.value`]: { gte: filterValue.from, lte: filterValue.to } },
    };
  }

  return {
    simple_query_string: {
      query: getFilterValue(filterValue),
      fields: [`${key}.value`],
    },
  };
};

const metadataFilters = (query: SearchQuery) =>
  Object.keys(query.filter || {})
    .filter(filter => filter.startsWith('metadata.'))
    .map(buildPropertyFilter(query));

const fullTextSearch = (
  searchString: string | undefined,
  query: SearchQuery,
  searchMethod: string | undefined
) =>
  searchString && searchMethod
    ? [
        {
          has_child: {
            type: 'fullText',
            score_mode: 'max',
            inner_hits: {
              _source: {
                excludes: ['fullText*'],
              },
              ...snippetsHighlight(query, [{ 'fullText_*': {} }]),
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

const languageFilter = (language: string) => [{ term: { language } }];

const textSearch = (
  searchString: string | undefined,
  searchMethod: string | undefined,
  properties: string[] = []
) =>
  searchString && searchMethod
    ? [{ [searchMethod]: { query: searchString, fields: properties } }]
    : [];

const termsFilter = (query: SearchQuery, propertyName: string) =>
  query.filter?.[propertyName] ? [{ terms: { [propertyName]: [query.filter[propertyName]] } }] : [];

const defaultFields = ['title', 'template', 'sharedId'];

const buildSortQuery = (query: SearchQuery) => {
  if (!query.sort) {
    return [];
  }

  const isDescending = query.sort.startsWith('-');
  const order = isDescending ? 'desc' : 'asc';
  const sortProp = isDescending ? query.sort.substring(1) : query.sort;

  if (sortProp.startsWith('metadata.')) {
    const labelPriority = { [`${sortProp}.label.sort`]: { unmapped_type: 'keyword', order } };
    const valuePriority = { [`${sortProp}.value.sort`]: { order } };
    return [labelPriority, valuePriority];
  }

  return [{ [`${sortProp}.sort`]: order }];
};

export const buildQuery = async (query: SearchQuery, language: string): Promise<RequestBody> => {
  const searchParams = await extractSearchParams(query);

  return {
    _source: {
      includes: query.fields || defaultFields,
    },

    query: {
      bool: {
        filter: [
          ...metadataFilters(query),
          ...permissionsFilters(query),
          ...languageFilter(language),
          ...termsFilter(query, 'template'),
          ...termsFilter(query, 'sharedId'),
        ],
        must: [
          {
            bool: {
              should: [
                ...fullTextSearch(
                  searchParams.fullText?.string,
                  query,
                  searchParams.fullText?.method
                ),
                ...textSearch(
                  searchParams.search?.string,
                  searchParams.search?.method,
                  searchParams.search?.properties
                ),
              ],
            },
          },
        ],
      },
    },
    ...snippetsHighlight(
      query,
      searchParams.search?.properties?.map(property => ({ [property]: {} }))
    ),
    sort: buildSortQuery(query),
    from: query.page?.offset || 0,
    size: query.page?.limit || 30,
  };
};
