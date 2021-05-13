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

export const buildSnippetsQuery = async (
  _id: string,
  query: SearchQuery,
  language: string,
  searchMethod: string
): Promise<RequestBody> => ({
  _source: false,
  query: {
    bool: {
      filter: [
        { term: { language } },
        ...permissionsFilters(query),
        {
          terms: {
            'sharedId.raw': [_id],
          },
        },
      ],
      must: [
        {
          bool: {
            should: [
              {
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
                      query: query.filter?.searchString,
                      fields: ['fullText_*'],
                    },
                  },
                },
              },
              {
                [searchMethod]: {
                  query: query.filter?.searchString,
                  fields: ['metadata.*.value', 'title'],
                  boost: 2,
                },
              },
            ],
          },
        },
      ].filter(cleanUp),
    },
  },
  highlight: {
    order: 'score',
    pre_tags: ['<b>'],
    post_tags: ['</b>'],
    encoder: 'html',
    fields: [
      {
        'metadata.*.value': {},
      },
      {
        title: {},
      },
    ],
  },
});
