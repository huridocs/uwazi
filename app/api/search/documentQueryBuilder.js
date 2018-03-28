/* eslint-disable camelcase */
export default function () {
  const baseQuery = {
    _source: {
      include: [
        'title', 'icon', 'processed', 'creationDate', 'template',
        'metadata', 'type', 'sharedId', 'toc', 'attachments',
        'language', 'file', 'uploaded', 'published', 'relationships'
      ]
    },
    from: 0,
    size: 30,
    query: {
      bool: {
        must: [{ bool: { should: [] } }],
        must_not: [],
        filter: [
          { term: { published: true } }
        ]
      }
    },
    sort: [],
    aggregations: {
      all: {
        global: {},
        aggregations: {
          types: {
            terms: {
              field: 'template.raw',
              missing: 'missing',
              size: 9999
            },
            aggregations: {
              filtered: {
                filter: {
                  bool: {
                    must: [{ bool: { should: [] } }],
                    filter: [
                      { match: { published: true } }
                    ]
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  const { aggregations } = baseQuery.aggregations.all;
  const fullTextBool = baseQuery.query.bool.must[0];
  const aggregationsFullTextBool = aggregations.types.aggregations.filtered.filter.bool.must[0];
  function addFullTextFilter(filter) {
    fullTextBool.bool.should.push(filter);
    aggregationsFullTextBool.bool.should.push(filter);
  }

  function addFilter(filter) {
    baseQuery.query.bool.filter.push(filter);
    baseQuery.aggregations.all.aggregations.types.aggregations.filtered.filter.bool.filter.push(filter);
  }

  return {
    query() {
      return baseQuery;
    },

    includeUnpublished() {
      const matchPulished = baseQuery.query.bool.filter.find(i => i.term && i.term.published);
      if (matchPulished) {
        baseQuery.query.bool.filter.splice(baseQuery.query.bool.filter.indexOf(matchPulished), 1);
      }
      return this;
    },

    fullTextSearch(term, fieldsToSearch = ['title', 'fullText'], number_of_fragments = 1, type = 'fvh', fragment_size = 200) {
      if (term) {
        const should = [];

        const includeFullText = fieldsToSearch.find(field => field === 'fullText');
        const fields = fieldsToSearch.filter(field => field !== 'fullText');

        if (fields.length) {
          should.push({
            multi_match: {
              query: term,
              type: 'phrase_prefix',
              fields,
              boost: 6
            }
          });
        }

        if (includeFullText) {
          should.unshift(
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
                    fields: {
                      'fullText_*': { number_of_fragments, type, fragment_size, fragmenter: 'span' }
                    }
                  }
                },
                query: {
                  bool: {
                    should: [
                      {
                        multi_match: {
                          query: term,
                          type: 'best_fields',
                          fuzziness: 0,
                          fields: ['fullText*']
                        }
                      },
                      {
                        multi_match: {
                          query: term,
                          type: 'phrase_prefix',
                          fields: ['fullText*'],
                          boost: 3
                        }
                      }
                    ]
                  }
                }
              }
            }
          );
        }

        addFullTextFilter({ bool: { should } });
      }
      return this;
    },

    language(language) {
      const match = { term: { language } };
      baseQuery.query.bool.filter.push(match);
      aggregations.types.aggregations.filtered.filter.bool.must.push(match);
      return this;
    },

    unpublished() {
      baseQuery.query.bool.filter[0].term.published = false;
      aggregations.types.aggregations.filtered.filter.bool.filter[0].match.published = false;
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
      sort[`${property}.sort`] = { order, unmapped_type: 'boolean' };
      baseQuery.sort.push(sort);
      return this;
    },

    textFilter(filter) {
      const match = { match: {} };
      match.match[`metadata.${filter.name}`] = filter.value;
      return match;
    },

    rangeFilter(filter) {
      const match = { range: {} };
      match.range[`metadata.${filter.name}`] = { gte: filter.value.from, lte: filter.value.to };
      return match;
    },

    multiselectFilter(filter) {
      const filterValue = filter.value;
      const values = filterValue.values;
      let match = { terms: {} };
      match.terms[`metadata.${filter.name}.raw`] = values;

      if (filterValue.and) {
        match = { bool: { must: [] } };
        match.bool.must = values.map((value) => {
          const m = { term: {} };
          m.term[`metadata.${filter.name}.raw`] = value;
          return m;
        });
      }

      return match;
    },

    nestedrangeFilter(filter) {
      const match = {
        nested: {
          path: `metadata.${filter.name}`,
          query: {
            bool: {
              should: []
            }
          }
        }
      };
      const fromMatch = { range: {} };
      fromMatch.range[`metadata.${filter.name}.from`] = { gte: filter.value.from, lte: filter.value.to };
      const toMatch = { range: {} };
      toMatch.range[`metadata.${filter.name}.to`] = { gte: filter.value.from, lte: filter.value.to };

      match.nested.query.bool.should.push(fromMatch);
      match.nested.query.bool.should.push(toMatch);
      return match;
    },

    strictNestedFilter(filter) {
      const match = {
        nested: {
          path: `metadata.${filter.name}`,
          query: {
            bool: {
              must: []
            }
          }
        }
      };

      const { properties } = filter.value;
      if (!properties) {
        return;
      }
      const keys = Object.keys(properties).filter(key => properties[key].any ||
          properties[key].values);

      keys.forEach((key) => {
        if (properties[key].any) {
          match.nested.query.bool.must.push({ exists: { field: `metadata.${filter.name}.${key}` } });
          return;
        }

        properties[key].values.forEach((val) => {
          const term = { term: {} };
          term.term[`metadata.${filter.name}.${key}.raw`] = { value: val };
          match.nested.query.bool.must.push(term);
        });
      });

      return match;
    },

    nestedFilter(filter) {
      const match = {
        bool: {
          must: []
        }
      };

      const { properties } = filter.value;

      const keys = Object.keys(properties).filter(key => properties[key].any ||
          properties[key].values && properties[key].values.length);

      match.bool.must = keys.map((key) => {
        let nestedmatch;
        if (properties[key].any) {
          nestedmatch = {
            nested: {
              path: `metadata.${filter.name}`,
              query: {
                bool: {
                  must: [
                  ]
                }
              }
            }
          };

          nestedmatch.nested.query.bool.must[0] = { exists: { field: `metadata.${filter.name}.${key}` } };
          return nestedmatch;
        }


        nestedmatch = { bool: { must: [] } };

        nestedmatch.bool.must = properties[key].values.map((val) => {
          const _match = {
            nested: {
              path: `metadata.${filter.name}`,
              query: {
                bool: {
                  must: [
                    { term: {} }
                  ]
                }
              }
            }
          };
          _match.nested.query.bool.must[0].term[`metadata.${filter.name}.${key}.raw`] = val;
          return _match;
        });
        return nestedmatch;
      });

      return match;
    },

    filterMetadataByFullText(filters = []) {
      const match = {
        bool: {
          minimum_should_match: 1,
          should: [
          ]
        }
      };
      filters.forEach((filter) => {
        let _match;
        _match = this.multiselectFilter(filter);
        if (_match) {
          match.bool.should.push(_match);
        }
      });

      if (match.bool.should.length) {
        addFullTextFilter(match);
      }
    },

    filterMetadata(filters = []) {
      filters.forEach((filter) => {
        let match;
        if (filter.type === 'text') {
          match = this.textFilter(filter);
        }

        if (filter.type === 'range') {
          match = this.rangeFilter(filter);
        }

        if (filter.type === 'multiselect' || filters.type === 'relationship') {
          match = this.multiselectFilter(filter);
        }

        if (filter.type === 'nested' && filter.value.strict) {
          match = this.strictNestedFilter(filter);
        }

        if (filter.type === 'nested' && !filter.value.strict) {
          match = this.nestedFilter(filter);
        }

        if (filter.type === 'nestedrange') {
          match = this.nestedrangeFilter(filter);
        }

        if (match) {
          addFilter(match);
        }
      });
      return this;
    },

    aggregation(key, should, filters) {
      return {
        terms: {
          field: key,
          size: 9999
        },
        aggregations: {
          filtered: {
            filter: {
              bool: {
                should,
                filter: filters
              }
            }
          }
        }
      };
    },

    nestedAggregation(property, should, readOnlyFilters) {
      const nestedAggregation = {
        nested: {
          path: `metadata.${property.name}`
        },
        aggregations: {}
      };
      baseQuery.aggregations[property.name] = nestedAggregation;

      property.nestedProperties.forEach((prop) => {
        const nestedFilters = readOnlyFilters.filter(match => match.nested)
        .map(nestedFilter => nestedFilter.nested.query.bool.must)
        .reduce((result, propFilters) => result.concat(propFilters), []);

        const path = `metadata.${property.name}.${prop}.raw`;
        const filters = JSON.parse(JSON.stringify(readOnlyFilters)).map((match) => {
          if (match.bool && match.bool.must && match.bool.must[0] && match.bool.must[0].nested) {
            match.bool.must = match.bool.must.filter(nestedMatcher => !nestedMatcher.nested ||
              !nestedMatcher.nested.query.bool.must[0].terms ||
              !nestedMatcher.nested.query.bool.must[0].terms[path]);

            if (!match.bool.must.length) {
              return;
            }
          }
          return match;
        }).filter(f => f);

        nestedAggregation.aggregations[prop] = {
          terms: {
            field: path,
            size: 9999
          },
          aggregations: {
            filtered: {
              filter: {
                bool: {
                  must: nestedFilters
                }
              },
              aggregations: {
                total: {
                  reverse_nested: {},
                  aggregations: {
                    filtered: {
                      filter: {
                        bool: {
                          should,
                          must: filters
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        };
      });

      return nestedAggregation;
    },

    aggregations(properties) {
      properties.forEach((property) => {
        const path = `metadata.${property.name}.raw`;
        let filters = baseQuery.query.bool.filter.filter(match => match && (!match.terms || match.terms && !match.terms[path]));
        filters = filters.concat(baseQuery.query.bool.must);

        const { should } = baseQuery.query.bool;
        if (property.nested) {
          baseQuery.aggregations.all.aggregations[property.name] = this.nestedAggregation(property, should, filters);
          return;
        }

        baseQuery.aggregations.all.aggregations[property.name] = this.aggregation(path, should, filters);
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
                        field: 'template'
                      }
                    }
                  ]
                }
              },
              {
                terms: {
                  template: _templates
                }
              }
            ]
          }
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
        post_tags: ['</b>']
      };
      baseQuery.highlight.fields = {};
      fields.forEach((field) => {
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
    }
  };
}
