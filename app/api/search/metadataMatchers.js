const textFilter = (filter, path = 'metadata') => ({
  term: { [`${path}.${filter.name}`]: filter.value },
});

const rangeFilter = (filter, path = 'metadata') => {
  const match = { range: {} };
  match.range[`${path}.${filter.name}`] = { gte: filter.value.from, lte: filter.value.to };
  return match;
};

function missingFilter(field) {
  return {
    bool: {
      must_not: [
        {
          exists: {
            field,
          },
        },
      ],
    },
  };
}

// eslint-disable-next-line max-statements
const multiselectFilter = (filter, path = 'metadata') => {
  const filterValue = filter.value;
  const { values = [] } = filterValue;
  let match;
  if (values.includes('any')) {
    match = {
      exists: {
        field: `${path}.${filter.name}`,
      },
    };
    return match;
  }
  if (values.includes('missing') && !filterValue.and) {
    const _values = values.filter(v => v !== 'missing');
    match = {
      bool: {
        should: [
          missingFilter(`${path}.${filter.name}`),
          {
            terms: { [`${path}.${filter.name}`]: _values },
          },
        ],
      },
    };
    return match;
  }
  if (!values.includes('missing') && !filterValue.and) {
    match = { terms: { [`${path}.${filter.name}`]: values } };
  }

  if (filterValue.and) {
    match = {
      bool: {
        must: values.map(value => ({ term: { [`${path}.${filter.name}`]: value } })),
      },
    };
  }
  return match;
};

const daterange = (filter, path = 'metadata') => {
  const match = {
    bool: {
      should: [],
    },
  };
  const fromMatch = { range: {} };
  fromMatch.range[`${path}.${filter.name}.from`] = { gte: filter.value.from, lte: filter.value.to };
  const toMatch = { range: {} };
  toMatch.range[`${path}.${filter.name}.to`] = { gte: filter.value.from, lte: filter.value.to };

  match.bool.should.push(fromMatch);
  match.bool.should.push(toMatch);
  return match;
};

const strictNestedFilter = filter => {
  const match = {
    nested: {
      path: `metadata.${filter.name}`,
      query: {
        bool: {
          must: [],
        },
      },
    },
  };

  const { properties } = filter.value;
  if (!properties) {
    return;
  }
  const keys = Object.keys(properties).filter(key => properties[key].any || properties[key].values);

  keys.forEach(key => {
    if (properties[key].any) {
      match.nested.query.bool.must.push({ exists: { field: `metadata.${filter.name}.${key}` } });
      return;
    }

    properties[key].values.forEach(val => {
      const term = { term: {} };
      term.term[`metadata.${filter.name}.${key}`] = { value: val };
      match.nested.query.bool.must.push(term);
    });
  });

  return match;
};

const nestedFilter = filter => {
  const match = {
    bool: {
      must: [],
    },
  };

  const { properties } = filter.value;

  const keys = Object.keys(properties).filter(
    key => properties[key].any || (properties[key].values && properties[key].values.length)
  );
  const nestedMatchers = keys.map(key => {
    let nestedmatch;
    if (properties[key].any) {
      nestedmatch = {
        nested: {
          path: `metadata.${filter.name}`,
          query: {
            bool: {
              must: [],
            },
          },
        },
      };

      nestedmatch.nested.query.bool.must[0] = {
        exists: { field: `metadata.${filter.name}.${key}` },
      };
      return nestedmatch;
    }

    const matchers = properties[key].values
      .filter(val => val !== 'missing')
      .map(val => {
        const _match = {
          nested: {
            path: `metadata.${filter.name}`,
            query: {
              bool: {
                must: [{ term: {} }],
              },
            },
          },
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
                    field: `metadata.${filter.name}.${key}.raw`,
                  },
                },
              ],
            },
          },
        },
      });
    }

    return matchers;
  });

  match.bool.must = nestedMatchers.reduce((result, matchers) => result.concat(matchers), []);
  return match;
};

const relationshipfilter = filter => {
  const filters = filter.filters
    .filter(m => m)
    .map(fil => {
      fil.value = filter.value[fil.name];
      if (fil.value) {
        return filterToMatch(fil, 'relationships.metadata'); //eslint-disable-line
      }
    })
    .filter(m => m);
  filters.push({ term: { 'relationships.template': filter.relationType } });
  const match = {
    nested: {
      path: 'relationships',
      query: {
        bool: {
          must: filters,
        },
      },
    },
  };
  return match;
};

const filterToMatch = (filter, path = 'metadata') => {
  let match;
  if (['text', 'markdown', 'generatedid'].includes(filter.type)) {
    match = textFilter(filter, path);
  }

  if (filter.type === 'range') {
    match = rangeFilter(filter, path);
  }

  // this is what's most important for one-up review
  if (filter.type === 'multiselect' || filter.type === 'select' || filter.type === 'relationship') {
    match = multiselectFilter(filter, path);
  }

  if (filter.type === 'nested' && filter.value.strict) {
    match = strictNestedFilter(filter);
  }

  if (filter.type === 'nested' && !filter.value.strict) {
    match = nestedFilter(filter);
  }

  if (filter.type === 'daterange') {
    match = daterange(filter, path);
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
  daterange,
  strictNestedFilter,
  nestedFilter,
  relationshipfilter,
};
