
export default function () {
  let baseQuery = {
    _source: {
      include: [ 'doc.title', 'doc.processed', 'doc.creationDate', 'doc.template', 'doc.metadata', 'doc.type']
    },
    from: 0,
    size: 12,
    query: {
      bool: {
        must: [
          {match: {'doc.published': true}}
        ]
      }
    },
    filter: {
      bool: {
        must: []
      }
    },
    sort: [],
    aggregations: {
      types: {
        terms: {
          field: 'doc.template.raw',
          size: 0
        },
        aggregations: {
          filtered: {
            filter: {
              bool: {
                must: []
              }
            }
          }
        }
      }
    }
  };

  return {
    query() {
      return baseQuery;
    },

    fullTextSearch(term, fieldsToSearch = ['doc.fullText', 'doc.title']) {
      if (term) {
        baseQuery.query.bool.must.push({
          multi_match: {
            query: term,
            type: 'phrase_prefix',
            fields: fieldsToSearch
          }
        });
      }
      return this;
    },

    sort(property, order = 'desc') {
      let sort = {};
      sort[`doc.${property}`] = {order, ignore_unmapped: true};
      baseQuery.sort.push(sort);
      return this;
    },

    textFilter(filters, property) {
      let match = {match: {}};
      match.match[`doc.metadata.${property}`] = filters[property].value;
      return match;
    },

    rangeFilter(filters, property) {
      let match = {range: {}};
      match.range[`doc.metadata.${property}`] = {gte: filters[property].value.from, lte: filters[property].value.to};
      return match;
    },

    multiselectFilter(filters, property) {
      let values = filters[property].value;
      let match = {terms: {}};
      match.terms[`doc.metadata.${property}.raw`] = values;
      return match;
    },

    nestedrangeFilter(filters, property) {
      let match = {
        nested: {
          path: `doc.metadata.${property}`,
          filter: {
            bool: {
              should: []
            }
          }
        }
      };
      let fromMatch = {range: {}};
      fromMatch.range[`doc.metadata.${property}.from`] = {gte: filters[property].value.from, lte: filters[property].value.to};
      let toMatch = {range: {}};
      toMatch.range[`doc.metadata.${property}.to`] = {gte: filters[property].value.from, lte: filters[property].value.to};

      match.nested.filter.bool.should.push(fromMatch);
      match.nested.filter.bool.should.push(toMatch);
      return match;
    },

    strictNestedFilter(filters, property) {
      let match = {
        nested: {
          path: `doc.metadata.${property}`,
          filter: {
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
          match.nested.filter.bool.must.push({exists: {field: `doc.metadata.${property}.${key}`}});
          return;
        }

        properties[key].values.forEach((val) => {
          let term = {term: {}};
          term.term[`doc.metadata.${property}.${key}.raw`] = {value: val};
          match.nested.filter.bool.must.push(term);
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
            path: `doc.metadata.${property}`,
            filter: {
              bool: {
                must: [
                ]
              }
            }
          }
        };

        if (properties[key].any) {
          nestedmatch.nested.filter.bool.must[0] = {exists: {field: `doc.metadata.${property}.${key}`}};
          return nestedmatch;
        }

        let terms = {terms: {}};
        terms.terms[`doc.metadata.${property}.${key}.raw`] = properties[key].values;
        nestedmatch.nested.filter.bool.must[0] = terms;
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

        baseQuery.filter.bool.must.push(match);
        baseQuery.aggregations.types.aggregations.filtered.filter.bool.must.push(match);
      });
      return this;
    },

    aggregation(key, filters) {
      return {
        terms: {
          field: key,
          size: 0
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
          path: `doc.metadata.${property.name}`
        },
        aggregations: {}
      };

      property.nestedProperties.forEach((prop) => {
        let nestedFilters = readOnlyFilters.filter((match) => match.nested)
        .map((nestedFilter) => nestedFilter.nested.filter.bool.must)
        .reduce((result, propFilters) => {
          return result.concat(propFilters);
        }, []);

        let path = `doc.metadata.${property.name}.${prop.key}.raw`;
        let filters = JSON.parse(JSON.stringify(readOnlyFilters)).map((match) => {
          if (match.bool && match.bool.must) {
            match.bool.must = match.bool.must.filter((nestedMatcher) => {
              return !nestedMatcher.nested.filter.bool.must[0].terms || !nestedMatcher.nested.filter.bool.must[0].terms[path];
            });

            if (!match.bool.must.length) {
              return;
            }
          }

          return match;
        });

        nestedAggregation.aggregations[prop.key] = {
          terms: {
            field: path,
            size: 0
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
        let path = `doc.metadata.${property.name}.raw`;
        let filters = baseQuery.filter.bool.must.filter((match) => {
          return !match.terms ||
                 match.terms && !match.terms[path];
        });

        if (property.nested) {
          return baseQuery.aggregations[property.name] = this.nestedAggregation(property, filters);
        }

        baseQuery.aggregations[property.name] = this.aggregation(path, filters);
      });
      return this;
    },

    filterByTemplate(templates = []) {
      if (templates.length) {
        let match = {terms: {'doc.template.raw': templates}};
        baseQuery.filter.bool.must.push(match);
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
