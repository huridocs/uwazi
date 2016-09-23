
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

    nestedFilter(filters, property) {
      let match = {
        nested: {
          path: `doc.metadata.${property}`,
          filter: {
            bool: {}
          }
        }
      };
      let value = filters[property].value;
      let strictSearch = value.strict;
      let properties = value.properties || [];

      let keys = Object.keys(properties).filter((key) => {
        return properties[key].any ||
               properties[key].values;
      });

      if (strictSearch) {
        match.nested.filter.bool.must = [];
        keys.forEach((key) => {
          if (properties[key].any) {
            match.nested.filter.bool.must.push({exists: {field: `doc.metadata.${property}.${key}`}});
            return;
          }

          properties[key].values.forEach((val) => {
            let term = {term: {}};
            term.term[`doc.metadata.${property}.${key}`] = {value: val};
            match.nested.filter.bool.must.push(term);
          });
        });
      }

      if (!strictSearch) {
        match.nested.filter.bool.should = keys.map((key) => {
          if (properties[key].any) {
            return {exists: {field: `doc.metadata.${property}.${key}`}};
          }

          let terms = {terms: {}};
          terms.terms[`doc.metadata.${property}.${key}`] = properties[key].values;
          return terms;
        });
      }

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

        if (filters[property].type === 'nested') {
          match = this.nestedFilter(filters, property);
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

    nestedAggregation(property, filters) {
      let nestedAggregation = baseQuery.aggregations[property.name] = {
        nested: {
          path: `doc.metadata.${property.name}`
        },
        aggregations: {}
      };

      property.nestedProperties.forEach((prop) => {
        let nestedFilters = baseQuery.filter.bool.must.filter((match) => {
          return match.nested && !match.nested.filter.bool.should;
        })
        .map((nestedFilter) => nestedFilter.nested.filter.bool.must)
        .reduce((result, propFilters) => {
          return result.concat(propFilters);
        }, []);

        nestedAggregation.aggregations[prop.key] = {
          terms: {
            field: `doc.metadata.${property.name}.${prop.key}.raw`,
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
        pre_tags : ['<b>'],
        post_tags : ['</b>']
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
