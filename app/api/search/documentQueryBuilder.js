/* eslint-disable camelcase, max-lines */

import { preloadOptionsSearch } from 'shared/config';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { UserRole } from 'shared/types/userSchema';
import filterToMatch, { multiselectFilter } from './metadataMatchers';
import {
  propertyToAggregation,
  generatedTocAggregations,
  permissionsLevelAgreggations,
  publishingStatusAgreggations,
  permissionsUsersAgreggations,
} from './metadataAggregations';

const nested = (filters, path) => ({
  nested: {
    path,
    query: {
      bool: {
        must: filters,
      },
    },
  },
});

const matchAggregationsToFilter = (aggregations, baseQuery) => {
  const { filter } = aggregations._types.aggregations.filtered.filter.bool;
  filter.splice(0, 1, baseQuery.query.bool.filter[0]);
};

export default function () {
  const getDefaultFilter = () => [
    {
      bool: {
        should: [
          {
            term: {
              published: true,
            },
          },
        ],
      },
    },
  ];

  const baseQuery = {
    explain: false,
    _source: {
      include: [
        'title',
        'icon',
        'processed',
        'creationDate',
        'editDate',
        'template',
        'metadata',
        'type',
        'sharedId',
        'toc',
        'attachments',
        'language',
        'documents',
        'uploaded',
        'published',
        'relationships',
        'obsoleteMetadata',
      ],
      excludes: ['documents.__v'],
    },
    from: 0,
    size: 30,
    query: {
      bool: {
        must: [{ bool: { should: [] } }],
        must_not: [],
        filter: getDefaultFilter(),
      },
    },
    sort: [],
    aggregations: {
      all: {
        global: {},
        aggregations: {
          _types: {
            terms: {
              field: 'template.raw',
              missing: 'missing',
              size: preloadOptionsSearch(),
            },
            aggregations: {
              filtered: {
                filter: {
                  bool: {
                    must: [{ bool: { should: [] } }],
                    filter: getDefaultFilter(),
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  const { aggregations } = baseQuery.aggregations.all;
  const fullTextBool = baseQuery.query.bool.must[0];
  const aggregationsFullTextBool = aggregations._types.aggregations.filtered.filter.bool.must[0];
  function addFullTextFilter(filter) {
    fullTextBool.bool.should.push(filter);
    aggregationsFullTextBool.bool.should.push(filter);
  }

  function addFilter(filter) {
    baseQuery.query.bool.filter.push(filter);
    baseQuery.aggregations.all.aggregations._types.aggregations.filtered.filter.bool.filter.push(
      filter
    );
  }

  function addPermissionsAssigneeFilter(filter) {
    const user = permissionsContext.getUserInContext();
    if (!user) return;
    const ownRefIds = permissionsContext.permissionsRefIds();
    const values =
      user?.role === UserRole.ADMIN
        ? filter.values
        : filter.values.filter(v => ownRefIds.includes(v.refId));

    addFilter({
      bool: {
        [`${filter.and ? 'must' : 'should'}`]: values.map(({ refId, level }) =>
          nested(
            [{ term: { 'permissions.refId': refId } }, { term: { 'permissions.level': level } }],
            'permissions'
          )
        ),
      },
    });
  }

  return {
    query() {
      return baseQuery;
    },

    // eslint-disable-next-line max-statements
    fullTextSearch(
      term,
      fieldsToSearch = ['title', 'fullText'],
      number_of_fragments = 1,
      searchTextType = 'query_string'
    ) {
      if (!term) {
        return this;
      }
      const type = 'fvh';
      const fragment_size = 300;
      const should = [];
      const includeFullText = fieldsToSearch.includes('fullText');
      const fields = fieldsToSearch.filter(field => field !== 'fullText');
      if (fields.length) {
        should.push({
          [searchTextType]: {
            query: term,
            fields,
            boost: 2,
          },
        });

        baseQuery.highlight = {
          order: 'score',
          pre_tags: ['<b>'],
          post_tags: ['</b>'],
          encoder: 'html',
          fields: fields.map(field => ({ [field]: {} })),
        };
      }

      if (includeFullText) {
        const fullTextQuery = {
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
                fields: {
                  'fullText_*': {
                    number_of_fragments,
                    type,
                    fragment_size,
                    fragmenter: 'span',
                  },
                },
              },
            },
            query: {
              [searchTextType]: {
                query: term,
                fields: ['fullText_*'],
              },
            },
          },
        };

        should.unshift(fullTextQuery);
      }

      addFullTextFilter({ bool: { should } });
      return this;
    },

    select(fields) {
      baseQuery._source.include = fields;
      return this;
    },

    include(fields = []) {
      baseQuery._source.include = baseQuery._source.include.concat(fields);
      return this;
    },

    language(language) {
      const match = { term: { language } };
      baseQuery.query.bool.filter.push(match);
      aggregations._types.aggregations.filtered.filter.bool.must.push(match);
      return this;
    },

    onlyUnpublished() {
      baseQuery.query.bool.filter[0].bool.must = baseQuery.query.bool.filter[0].bool.should;
      baseQuery.query.bool.filter[0].bool.must[0].term.published = false;
      delete baseQuery.query.bool.filter[0].bool.should;
      matchAggregationsToFilter(aggregations, baseQuery);
      return this;
    },

    includeUnpublished() {
      const user = permissionsContext.getUserInContext();
      if (user && ['admin', 'editor'].includes(user.role)) {
        const shouldFilter = baseQuery.query.bool.filter[0].bool.should[0];
        if (shouldFilter.term && shouldFilter.term.published) {
          delete baseQuery.query.bool.filter[0].bool.should.splice(shouldFilter, 1);
        }
      }
      matchAggregationsToFilter(aggregations, baseQuery);
      return this;
    },

    publishingStatusAggregations() {
      if (permissionsContext.getUserInContext()) {
        baseQuery.aggregations.all.aggregations._published =
          publishingStatusAgreggations(baseQuery);
      }
      return this;
    },

    owner(user) {
      const match = { match: { user: user._id } };
      baseQuery.query.bool.must.push(match);
      return this;
    },

    sort(property, order = 'desc', sortByLabel = false) {
      if (property === '_score') {
        return baseQuery.sort.push('_score');
      }
      const sort = {};
      const isAMetadataProperty = property.includes('metadata');
      const sortingKey = sortByLabel ? 'label' : 'value';
      const sortKey = isAMetadataProperty ? `${property}.${sortingKey}.sort` : `${property}.sort`;
      sort[sortKey] = { order, unmapped_type: 'boolean' };

      baseQuery.sort.push(sort);
      return this;
    },

    hasMetadataProperties(fieldNames) {
      const match = { bool: { should: [] } };
      match.bool.should = fieldNames.map(field => ({ exists: { field: `metadata.${field}` } }));
      addFilter(match);
      return this;
    },

    filterMetadataByFullText(filters = []) {
      const match = {
        bool: {
          minimum_should_match: 1,
          should: [],
        },
      };
      filters.forEach(filter => {
        const _match = multiselectFilter(filter);
        if (_match) {
          match.bool.should.push(_match);
        }
      });

      if (match.bool.should.length) {
        addFullTextFilter(match);
      }
    },

    customFilters(filters = {}) {
      Object.keys(filters)
        .filter(key => filters[key].values?.length)
        .forEach(key => {
          if (key === 'permissions') {
            addPermissionsAssigneeFilter(filters[key]);
            return;
          }

          addFilter({ terms: { [key]: filters[key].values } });
        });
      return this;
    },

    filterMetadata(filters = []) {
      filters.forEach(filter => {
        const match = filterToMatch(filter, filter.suggested ? 'suggestedMetadata' : 'metadata');
        if (match) {
          addFilter(match);
        }
      });
      return this;
    },

    generatedTocAggregations() {
      baseQuery.aggregations.all.aggregations.generatedToc = generatedTocAggregations(baseQuery);
    },

    permissionsLevelAgreggations() {
      baseQuery.aggregations.all.aggregations['_permissions.self'] =
        permissionsLevelAgreggations(baseQuery);
    },

    permissionsUsersAgreggations() {
      if (!permissionsContext.getUserInContext()) return;

      baseQuery.aggregations.all.aggregations['_permissions.read'] = permissionsUsersAgreggations(
        baseQuery,
        'read'
      );
      baseQuery.aggregations.all.aggregations['_permissions.write'] = permissionsUsersAgreggations(
        baseQuery,
        'write'
      );
    },

    aggregations(properties, includeReviewAggregations) {
      properties.forEach(property => {
        baseQuery.aggregations.all.aggregations[property.name] = propertyToAggregation(
          property,
          baseQuery
        );
      });
      if (includeReviewAggregations) {
        // suggested has an implied '__' as a prefix
        properties.forEach(property => {
          baseQuery.aggregations.all.aggregations[`__${property.name}`] = propertyToAggregation(
            property,
            baseQuery,
            true
          );
        });
      }
      return this;
    },

    filterByTemplate(templates = []) {
      if (templates.includes('missing')) {
        const _templates = templates.filter(t => t !== 'missing');
        const match = {
          bool: {
            should: [
              {
                bool: {
                  must_not: [
                    {
                      exists: {
                        field: 'template',
                      },
                    },
                  ],
                },
              },
              {
                terms: {
                  template: _templates,
                },
              },
            ],
          },
        };
        baseQuery.query.bool.filter.push(match);
        return this;
      }

      if (templates.length) {
        const match = { terms: { template: templates } };
        baseQuery.query.bool.filter.push(match);
      }
      return this;
    },

    filterById(ids = []) {
      let _ids;
      if (typeof ids === 'string') {
        _ids = [ids];
      }
      if (Array.isArray(ids)) {
        _ids = ids;
      }
      if (_ids.length) {
        const match = { terms: { 'sharedId.raw': _ids } };
        baseQuery.query.bool.filter.push(match);
      }
      return this;
    },

    highlight(fields) {
      baseQuery.highlight = {
        pre_tags: ['<b>'],
        post_tags: ['</b>'],
      };
      baseQuery.highlight.fields = {};
      fields.forEach(field => {
        baseQuery.highlight.fields[field] = {};
      });
      return this;
    },

    from(from) {
      baseQuery.from = from;
      return this;
    },

    limit(size) {
      baseQuery.size = size;
      return this;
    },

    resetAggregations() {
      baseQuery.aggregations.all.aggregations = {};
      return this;
    },

    filterByPermissions(onlyPublished) {
      if (onlyPublished) {
        return this;
      }

      const user = permissionsContext.getUserInContext();
      if (user && !['admin', 'editor'].includes(user.role)) {
        const permissionsFilter = nested(
          [{ terms: { 'permissions.refId': permissionsContext.permissionsRefIds() } }],
          'permissions'
        );
        baseQuery.query.bool.filter[0].bool.should.push(permissionsFilter);
      }

      return this;
    },
  };
}
