
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

    filterMetadata(filters = {}) {
      Object.keys(filters).forEach((property) => {
        let match = {};
        if (filters[property].type === 'text') {
          match.match = {};
          match.match[`doc.metadata.${property}`] = filters[property].value;
        }

        if (filters[property].type === 'range') {
          match.range = {};
          match.range[`doc.metadata.${property}`] = {gte: filters[property].value.from, lte: filters[property].value.to};
        }

        if (filters[property].type === 'multiselect') {
          let values = filters[property].value;
          match.terms = {};
          match.terms[`doc.metadata.${property}.raw`] = values;
        }

        baseQuery.filter.bool.must.push(match);
        baseQuery.aggregations.types.aggregations.filtered.filter.bool.must.push(match);
      });
      return this;
    },

    aggregations(properties) {
      properties.forEach((property) => {
        let key = `doc.metadata.${property}.raw`;
        let filters = baseQuery.filter.bool.must.filter((match) => {
          return !match.terms || (match.terms && !match.terms[key]);
        });

        baseQuery.aggregations[property] = {
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
