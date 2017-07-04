/* eslint-disable camelcase */
export default function () {
  let baseQuery = {
    _source: {
      include: [
        'title', 'icon', 'processed', 'creationDate', 'template',
        'metadata', 'type', 'sharedId', 'toc', 'attachments',
        'language', 'file', 'uploaded', 'published'
      ]
    },
    from: 0,
    size: 30,
    query: {
      bool: {
        must: [{match: {published: true}}]
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
                    must: [{match: {published: true}}]
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  const aggregations = baseQuery.aggregations.all.aggregations;

  return {
    query() {
      return baseQuery;
    },

    includeUnpublished() {
      const matchPulished = baseQuery.query.bool.must.find(i => i.match && i.match.published);
      if (matchPulished) {
        baseQuery.query.bool.must.splice(baseQuery.query.bool.must.indexOf(matchPulished), 1);
      }
      return this;
    },

    fullTextSearch(term, fieldsToSearch = ['title'], includeFullText = true, number_of_fragments = 1, type = 'fvh') {
      if (term) {
        let should = [];

        if (fieldsToSearch.length) {
          should.push({
            multi_match: {
              query: term,
              type: 'phrase_prefix',
              fields: fieldsToSearch
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
                      'fullText_*': {number_of_fragments, type}
                    }
                  }
                },
                query: {
                  bool: {
                    must: {
                      multi_match: {
                        query: term,
                        type: 'best_fields',
                        fuzziness: 1,
                        fields: ['fullText*']
                      }
                    },
                    should: {
                      multi_match: {
                        query: term,
                        type: 'phrase',
                        fields: ['fullText*']
                      }
                    }
                  }
                }
              }
            }
          );
        }

        baseQuery.query.bool.must.push({bool: {should}});
      }
      return this;
    },

    language(language) {
      let match = {match: {language: language}};
      baseQuery.query.bool.must.push(match);
      aggregations.types.aggregations.filtered.filter.bool.must.push(match);
      return this;
    },

    unpublished() {
      baseQuery.query.bool.must[0].match.published = false;
      baseQuery.aggregations.all.aggregations.types.aggregations.filtered.filter.bool.must[0].match.published = false;
      return this;
    },

    owner(user) {
      let match = {match: {user: user._id}};
      baseQuery.query.bool.must.push(match);
      return this;
    },

    sort(property, order = 'desc') {
      let sort = {};
      sort[`${property}.raw`] = {order, unmapped_type: 'boolean'};
      baseQuery.sort.push(sort);
      return this;
    },

    textFilter(filters, property) {
      let match = {match: {}};
      match.match[`metadata.${property}`] = filters[property].value;
      return match;
    },

    rangeFilter(filters, property) {
      let match = {range: {}};
      match.range[`metadata.${property}`] = {gte: filters[property].value.from, lte: filters[property].value.to};
      return match;
    },

    multiselectFilter(filters, property) {
      let values = filters[property].value;
      let match = {terms: {}};
      match.terms[`metadata.${property}.raw`] = values;
      return match;
    },

    nestedrangeFilter(filters, property) {
      let match = {
        nested: {
          path: `metadata.${property}`,
          query: {
            bool: {
              should: []
            }
          }
        }
      };
      let fromMatch = {range: {}};
      fromMatch.range[`metadata.${property}.from`] = {gte: filters[property].value.from, lte: filters[property].value.to};
      let toMatch = {range: {}};
      toMatch.range[`metadata.${property}.to`] = {gte: filters[property].value.from, lte: filters[property].value.to};

      match.nested.query.bool.should.push(fromMatch);
      match.nested.query.bool.should.push(toMatch);
      return match;
    },

    strictNestedFilter(filters, property) {
      let match = {
        nested: {
          path: `metadata.${property}`,
          query: {
            bool: {
              must: []
            }
          }
        }
      };

      let value = filters[property].value;
      let properties = value.properties;
      let keys = Object.keys(properties).filter((key) => {
        return properties[key].any ||
          properties[key].values;
      });

      keys.forEach((key) => {
        if (properties[key].any) {
          match.nested.query.bool.must.push({exists: {field: `metadata.${property}.${key}`}});
          return;
        }

        properties[key].values.forEach((val) => {
          let term = {term: {}};
          term.term[`metadata.${property}.${key}.raw`] = {value: val};
          match.nested.query.bool.must.push(term);
        });
      });

      return match;
    },

    nestedFilter(filters, property) {
      let match = {
        bool: {
          must: []
        }
      };
      let value = filters[property].value;
      let properties = value.properties;

      let keys = Object.keys(properties).filter((key) => {
        return properties[key].any ||
          properties[key].values && properties[key].values.length;
      });

      match.bool.must = keys.map((key) => {
        let nestedmatch = {
          nested: {
            path: `metadata.${property}`,
            query: {
              bool: {
                must: [
                ]
              }
            }
          }
        };

        if (properties[key].any) {
          nestedmatch.nested.query.bool.must[0] = {exists: {field: `metadata.${property}.${key}`}};
          return nestedmatch;
        }

        let terms = {terms: {}};
        terms.terms[`metadata.${property}.${key}.raw`] = properties[key].values;
        nestedmatch.nested.query.bool.must[0] = terms;
        return nestedmatch;
      });

      return match;
    },

    filterMetadata(filters = {}) {
      Object.keys(filters).forEach((property) => {
        let match;
        if (filters[property].type === 'text') {
          match = this.textFilter(filters, property);
        }

        if (filters[property].type === 'range') {
          match = this.rangeFilter(filters, property);
        }

        if (filters[property].type === 'multiselect') {
          match = this.multiselectFilter(filters, property);
        }

        if (filters[property].type === 'nested' && filters[property].value.strict) {
          match = this.strictNestedFilter(filters, property);
        }

        if (filters[property].type === 'nested' && !filters[property].value.strict) {
          match = this.nestedFilter(filters, property);
        }

        if (filters[property].type === 'nestedrange') {
          match = this.nestedrangeFilter(filters, property);
        }

        baseQuery.query.bool.must.push(match);
        baseQuery.aggregations.all.aggregations.types.aggregations.filtered.filter.bool.must.push(match);
      });
      return this;
    },

    aggregation(key, filters) {
      return {
        terms: {
          field: key,
          size: 9999
        },
        aggregations: {
          filtered: {
            filter: {
              bool: {
                must: filters
              }
            }
          }
        }
      };
    },

    nestedAggregation(property, readOnlyFilters) {
      let nestedAggregation = baseQuery.aggregations[property.name] = {
        nested: {
          path: `metadata.${property.name}`
        },
        aggregations: {}
      };

      property.nestedProperties.forEach((prop) => {
        let nestedFilters = readOnlyFilters.filter((match) => match.nested)
        .map((nestedFilter) => nestedFilter.nested.query.bool.must)
        .reduce((result, propFilters) => {
          return result.concat(propFilters);
        }, []);

        let path = `metadata.${property.name}.${prop.key}.raw`;
        let filters = JSON.parse(JSON.stringify(readOnlyFilters)).map((match) => {
          if (match.bool && match.bool.must) {
            match.bool.must = match.bool.must.filter((nestedMatcher) => {
              return !nestedMatcher.nested.query.bool.must[0].terms || !nestedMatcher.nested.query.bool.must[0].terms[path];
            });

            if (!match.bool.must.length) {
              return;
            }
          }

          return match;
        }).filter((f) => f);

        nestedAggregation.aggregations[prop.key] = {
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
        let path = `metadata.${property.name}.raw`;
        let filters = baseQuery.query.bool.must.filter((match) => {
          return !match.terms || match.terms && !match.terms[path];
        });

        if (property.nested) {
          return baseQuery.aggregations.all.aggregations[property.name] = this.nestedAggregation(property, filters);
        }

        baseQuery.aggregations.all.aggregations[property.name] = this.aggregation(path, filters);
      });
      return this;
    },

    filterByTemplate(templates = []) {
      if (templates.includes('missing')) {
        let _templates = templates.filter((t) => t !== 'missing');
        let match = {
          or: {
            filters: [
              {missing: {field: 'template'}},
              {terms: {template: _templates}}
            ]
          }};
        baseQuery.query.bool.must.push(match);
        return this;
      }

      if (templates.length) {
        let match = {terms: {template: templates}};
        baseQuery.query.bool.must.push(match);
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
        let match = {terms: {'sharedId.raw': _ids}};
        baseQuery.query.bool.must.push(match);
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
