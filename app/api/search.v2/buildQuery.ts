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

const oneFullTextQuery = (
  searchString: string | undefined,
  query: SearchQuery,
  searchMethod: string
) => ({
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
});

const fullTextSearch = (
  searchString: string | undefined,
  query: SearchQuery,
  searchMethod: string
) => (searchString ? [oneFullTextQuery(searchString, query, searchMethod)] : []);

const languageFilter = (language: string) => [{ term: { language } }];

const textSearch = (searchString: string | undefined, query: SearchQuery, searchMethod: string) =>
  searchString
    ? [
        {
          bool: {
            should: [
              { [searchMethod]: { query: searchString } },
              oneFullTextQuery(searchString, query, searchMethod),
            ],
          },
        },
      ]
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
  const { searchString, fullTextSearchString, searchMethod } = await extractSearchParams(query);

  console.log(searchString);
  console.log(fullTextSearchString);
  console.log(searchMethod);

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
          ...fullTextSearch(fullTextSearchString, query, searchMethod),
          ...textSearch(searchString, query, searchMethod),
        ],
      },
    },
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
        title: {},
        'metadata.*': {},
      },
    },
    sort: buildSortQuery(query),
    from: query.page?.offset || 0,
    size: query.page?.limit || 30,
  };
};
