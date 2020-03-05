/* eslint-disable camelcase, max-lines */

import filterToMatch, { multiselectFilter } from './metadataMatchers';
import propertyToAggregation from './metadataAggregations';

export default function() {
  const baseQuery = {
    explain: true,
    _source: {
      include: [
        'title',
        'icon',
        'processed',
        'creationDate',
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
      ],
    },
    from: 0,
    size: 30,
    query: {
      bool: {
        must: [{ bool: { should: [] } }],
        must_not: [],
        filter: [{ term: { published: true } }],
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
              size: 9999,
            },
            aggregations: {
              filtered: {
                filter: {
                  bool: {
                    must: [{ bool: { should: [] } }],
                    filter: [{ match: { published: true } }],
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

  return {
    query() {
      return baseQuery;
    },

    includeUnpublished() {
      const matchPublished = baseQuery.query.bool.filter.find(i => i.term && i.term.published);
      if (matchPublished) {
        baseQuery.query.bool.filter.splice(baseQuery.query.bool.filter.indexOf(matchPublished), 1);
      }
      return this;
    },

    fullTextSearch( // eslint-disable-line max-params
      term,
      fieldsToSearch = ['title', 'fullText'],
      number_of_fragments = 1,
      type = 'fvh',
      fragment_size = 300
    ) {
      if (!term) {
        return this;
      }
      const should = [];
      const includeFullText = fieldsToSearch.includes('fullText');
      const fields = fieldsToSearch.filter(field => field !== 'fullText');
      if (fields.length) {
        should.push({
          query_string: {
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
              query_string: {
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

    language(language) {
      const match = { term: { language } };
      baseQuery.query.bool.filter.push(match);
      aggregations._types.aggregations.filtered.filter.bool.must.push(match);
      return this;
    },

    unpublished() {
      baseQuery.query.bool.filter[0].term.published = false;
      aggregations._types.aggregations.filtered.filter.bool.filter[0].match.published = false;
      return this;
    },

    owner(user) {
      const match = { match: { user: user._id } };
      baseQuery.query.bool.must.push(match);
      return this;
    },

    sort(property, order = 'desc') {
      if (property === '_score') {
        return baseQuery.sort.push('_score');
      }
      const sort = {};

      const sortKey = property.includes('metadata') ? `${property}.value.sort` : `${property}.sort`;

      sort[sortKey] = { order, unmapped_type: 'boolean' };

      baseQuery.sort.push(sort);
      return this;
    },

    sortByForeignKey(property, keys, order = 'desc') {
      const sort = {};
      sort._script = {
        order,
        type: 'string',
        script: {
          params: { keys },
          source: `try {params.keys[doc['${property}.sort'].value] != null ?
          params.keys[doc['${property}.sort'].value] : '|'}catch(Exception e){'|'}`,
        },
      };
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

    filterMetadata(filters = []) {
      filters.forEach(filter => {
        const match = filterToMatch(filter, filter.suggested ? 'suggestedMetadata' : 'metadata');
        if (match) {
          addFilter(match);
        }
      });
      return this;
    },

    aggregations(properties, dictionaries) {
      properties.forEach(property => {
        baseQuery.aggregations.all.aggregations[property.name] = propertyToAggregation(
          property,
          dictionaries,
          baseQuery
        );
      });
      // suggested has an implied '_' as a prefix
      properties
        .filter(
          p => (dictionaries.find(d => p.content === d._id.toString()) || {}).enable_classification
        )
        .forEach(property => {
          baseQuery.aggregations.all.aggregations[`_${property.name}`] = propertyToAggregation(
            property,
            dictionaries,
            baseQuery,
            true
          );
        });
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
  };
}
