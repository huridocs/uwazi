const textFilter = (filter) => {
  const match = { match: {} };
  match.match[`metadata.${filter.name}`] = filter.value;
  return match;
};

const rangeFilter = (filter) => {
  const match = { range: {} };
  match.range[`metadata.${filter.name}`] = { gte: filter.value.from, lte: filter.value.to };
  return match;
};

const multiselectFilter = (filter) => {
  const filterValue = filter.value;
  const { values } = filterValue;
  let match;
  if (values.includes('missing') && !filterValue.and) {
    const _values = values.filter(v => v !== 'missing');
    match = {
      bool: {
        should: [
          {
            bool: {
              must_not: [
                {
                  exists: {
                    field: `metadata.${filter.name}.raw`
                  }
                }
              ]
            }
          },
          {
            terms: {
            }
          }
        ]
      }
    };
    match.bool.should[1].terms[`metadata.${filter.name}.raw`] = _values;
    return match;
  }
  if (!values.includes('missing') && !filterValue.and) {
    match = { terms: {} };
    match.terms[`metadata.${filter.name}.raw`] = values;
  }

  if (filterValue.and) {
    match = { bool: { must: [] } };
    match.bool.must = values.map((value) => {
      const m = { term: {} };
      m.term[`metadata.${filter.name}.raw`] = value;
      return m;
    });
  }
  return match;
};

const nestedrangeFilter = (filter) => {
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
};

const strictNestedFilter = (filter) => {
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
};

const nestedFilter = (filter) => {
  const match = {
    bool: {
      must: []
    }
  };

  const { properties } = filter.value;

  const keys = Object.keys(properties).filter(key => properties[key].any ||
      properties[key].values && properties[key].values.length);
  const nestedMatchers = keys.map((key) => {
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

    const matchers = properties[key].values
    .filter(val => val !== 'missing')
    .map((val) => {
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

    if (properties[key].values.includes('missing')) {
      matchers.push({
        nested: {
          path: `metadata.${filter.name}`,
          query: {
            bool: {
              must_not: [
                {
                  exists: {
                    field: `metadata.${filter.name}.${key}.raw`
                  }
                }
              ]
            }
          }
        }
      });
    }

    return matchers;
  });

  match.bool.must = nestedMatchers.reduce((result, matchers) => result.concat(matchers), []);
  return match;
};

const relationshipfilter = (filter) => {
  const match = {
    has_child: {
      type: 'relationship',
      score_mode: 'max',
      inner_hits: {
        _source: false
      },
      query: {
        bool: {
          filter: filter.filters.map((fil) => {
            fil.value = filter.value[fil.name];
            if (fil.value) {
              return filterToMatch(fil);
            }
          }).filter(m => m)
        }
      }
    }
  };

  return match;
};

const filterToMatch = (filter) => {
  let match;
  if (filter.type === 'text') {
    match = textFilter(filter);
  }

  if (filter.type === 'range') {
    match = rangeFilter(filter);
  }

  if (filter.type === 'multiselect' || filter.type === 'relationship') {
    match = multiselectFilter(filter);
  }

  if (filter.type === 'nested' && filter.value.strict) {
    match = strictNestedFilter(filter);
  }

  if (filter.type === 'nested' && !filter.value.strict) {
    match = nestedFilter(filter);
  }

  if (filter.type === 'nestedrange') {
    match = nestedrangeFilter(filter);
  }

  if (filter.type === 'relationshipfilter') {
    match = relationshipfilter(filter);
  }

  return match;
};

export default filterToMatch;

export {
  textFilter,
  rangeFilter,
  multiselectFilter,
  nestedrangeFilter,
  strictNestedFilter,
  nestedFilter,
  relationshipfilter
};
