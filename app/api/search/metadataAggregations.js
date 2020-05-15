import { preloadOptionsSearch } from 'shared/config';

const aggregation = (key, should, filters) => ({
  terms: {
    field: key,
    missing: 'missing',
    size: preloadOptionsSearch,
  },
  aggregations: {
    filtered: {
      filter: {
        bool: {
          should,
          filter: filters,
        },
      },
    },
  },
});

const aggregationWithGroupsOfOptions = (key, should, filters, dictionary) => {
  const agg = {
    filters: { filters: {} },
    aggregations: {
      filtered: {
        filter: {
          bool: {
            should,
            filter: filters,
          },
        },
      },
    },
  };
  const addMatch = value => {
    const match = { terms: {} };
    match.terms[key] = value.values ? value.values.map(v => v.id) : [value.id];
    agg.filters.filters[value.id.toString()] = match;
    if (value.values) {
      value.values.forEach(addMatch);
    }
  };
  dictionary.values.forEach(addMatch);

  const missingMatch = { bool: { must_not: { exists: { field: key } } } };
  agg.filters.filters.missing = missingMatch;

  return agg;
};

const nestedMatcherIsAggregationProperty = (nestedMatcher, nestedPropPath) =>
  !nestedMatcher.nested ||
  !nestedMatcher.nested.query.bool.must ||
  !nestedMatcher.nested.query.bool.must[0].terms ||
  !nestedMatcher.nested.query.bool.must[0].terms[nestedPropPath] ||
  !nestedMatcher.nested.query.bool.must_not ||
  !nestedMatcher.nested.query.bool.must_not[0].exists ||
  !nestedMatcher.nested.query.bool.must[0].exists.field[nestedPropPath];

const nestedAggregation = (property, should, readOnlyFilters, path, missing = false) => {
  const nestedPath = path || `metadata.${property.name}`;
  const agg = {
    nested: {
      path: nestedPath,
    },
    aggregations: {},
  };
  let nestedFilters = readOnlyFilters
    .filter(match => match.nested && match.nested.path === nestedPath)
    .map(nestedFilter => nestedFilter.nested.query.bool.must)
    .reduce((result, propFilters) => result.concat(propFilters), []);

  property.nestedProperties.forEach(prop => {
    const nestedPropPath = path
      ? `${path}.metadata.${prop}.raw`
      : `metadata.${property.name}.${prop}.raw`;
    const filters = readOnlyFilters
      .map(match => {
        if (match.bool && match.bool.must && match.bool.must[0] && match.bool.must[0].nested) {
          match.bool.must = match.bool.must.filter(nestedMatcher =>
            nestedMatcherIsAggregationProperty(nestedMatcher, nestedPropPath)
          );

          if (!match.bool.must.length) {
            return;
          }
        }
        if (match.nested) {
          return;
        }
        return match;
      })
      .filter(f => f);

    nestedFilters = nestedFilters.filter(filter => !filter.terms || !filter.terms[nestedPropPath]);

    agg.aggregations[prop] = {
      terms: {
        field: nestedPropPath,
        missing: missing ? 'missing' : undefined,
        size: preloadOptionsSearch,
      },
      aggregations: {
        filtered: {
          filter: {
            bool: {
              must: nestedFilters,
            },
          },
          aggregations: {
            total: {
              reverse_nested: {},
              aggregations: {
                filtered: {
                  filter: {
                    bool: {
                      should,
                      must: filters,
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
  });

  return agg;
};

const extractFilters = (baseQuery, path) => {
  let filters = baseQuery.query.bool.filter.filter(
    match =>
      match &&
      (!match.terms || (match.terms && !match.terms[path])) &&
      (!match.bool ||
        !match.bool.should ||
        !match.bool.should[1].terms ||
        !match.bool.should[1].terms[path])
  );
  filters = filters.concat(baseQuery.query.bool.must);
  return filters;
};

const getpath = (property, suggested) =>
  suggested ? `suggestedMetadata.${property.name}.raw` : `metadata.${property.name}.raw`;

export const propertyToAggregation = (property, dictionaries, baseQuery, suggested = false) => {
  const path = getpath(property, suggested);
  const filters = extractFilters(baseQuery, path);
  const { should } = baseQuery.query.bool;

  if (property.type === 'nested') {
    return nestedAggregation(property, should, filters);
  }

  const dictionary = property.content
    ? dictionaries.find(d => property.content.toString() === d._id.toString())
    : null;

  const isADictionaryWithGroups = dictionary && dictionary.values.find(v => v.values);
  if (isADictionaryWithGroups) {
    return aggregationWithGroupsOfOptions(path, should, filters, dictionary);
  }

  return aggregation(path, should, filters);
};
