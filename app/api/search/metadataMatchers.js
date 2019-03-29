const textFilter = (filter, path = 'metadata') => {
  const match = { match: {} };
  match.match[`${path}.${filter.name}`] = filter.value;
  return match;
};

const rangeFilter = (filter, path = 'metadata') => {
  const match = { range: {} };
  match.range[`${path}.${filter.name}`] = { gte: filter.value.from, lte: filter.value.to };
  return match;
};

const multiselectFilter = (filter, path = 'metadata') => {
  const filterValue = filter.value;
  const { values = [] } = filterValue;
  let match;
  const fullPath = filter.relationType ? `${path}.${filter.name}.entity.raw` : `${path}.${filter.name}.raw`;
  if (values.includes('missing') && !filterValue.and) {
    const _values = values.filter(v => v !== 'missing');
    match = {
      bool: {
        should: [
          {
            terms: { [fullPath]: _values }
          },
          {
            bool: {
              must_not: [
                {
                  exists: {
                    field: fullPath
                  }
                }
              ]
            }
          }
        ]
      }
    };
    return match;
  }
  if (!values.includes('missing') && !filterValue.and) {
    match = { terms: {} };
    match.terms[fullPath] = values;
  }

  if (filterValue.and) {
    match = { bool: { must: [] } };
    match.bool.must = values.map((value) => {
      const m = { term: {} };
      m.term[fullPath] = value;
      return m;
    });
  }
  return match;
};

const nestedrangeFilter = (filter, path = 'metadata') => {
  const match = {
    nested: {
      path: `${path}.${filter.name}`,
      query: {
        bool: {
          should: []
        }
      }
    }
  };
  const fromMatch = { range: {} };
  fromMatch.range[`${path}.${filter.name}.from`] = { gte: filter.value.from, lte: filter.value.to };
  const toMatch = { range: {} };
  toMatch.range[`${path}.${filter.name}.to`] = { gte: filter.value.from, lte: filter.value.to };

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
  const condition = filter.value.and ? 'must' : 'should';
  const match = {
    bool: {
      [condition]: []
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

  match.bool[condition] = nestedMatchers.reduce((result, matchers) => result.concat(matchers), []);
  return match;
};

const relationshipfilter = (filter) => {
  const filters = filter.filters.map((fil) => {
    fil.value = filter.value[fil.name];
    if (fil.value) {
      return filterToMatch(fil, 'relationships.metadata'); //eslint-disable-line
    }
  }).filter(m => m);
  filters.push({ term: { 'relationships.template': filter.relationType } });
  const match = {
    nested: {
      path: 'relationships',
      query: {
        bool: {
          must: filters
        }
      }
    }
  };
  return match;
};

const filterToMatch = (filter, path = 'metadata') => {
  let match;
  if (filter.type === 'text' || filter.type === 'markdown') {
    match = textFilter(filter, path);
  }

  if (filter.type === 'range') {
    match = rangeFilter(filter, path);
  }

  if (filter.type === 'relationship') {
    filter.value = { and: filter.value.and, properties: { entity: filter.value } };
    match = nestedFilter(filter);
  }

  if (filter.type === 'multiselect' || filter.type === 'select') {
    match = multiselectFilter(filter, path);
  }

  if (filter.type === 'nested' && filter.value.strict) {
    filter.value.and = true;
    match = strictNestedFilter(filter);
  }

  if (filter.type === 'nested' && !filter.value.strict) {
    filter.value.and = true;
    match = nestedFilter(filter);
  }

  if (filter.type === 'nestedrange') {
    match = nestedrangeFilter(filter, path);
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
