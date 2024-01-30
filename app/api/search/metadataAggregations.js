import { preloadOptionsSearch } from 'shared/config';
import { permissionsContext } from 'api/permissions/permissionsContext';
import commonProperties from 'shared/commonProperties';

const aggregation = (key, should, filters, nestedAggregationName, nestedAggregation) => {
  const agg = {
    terms: {
      field: key,
      missing: 'missing',
      size: preloadOptionsSearch(),
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
  };

  if (nestedAggregationName && nestedAggregation) {
    agg.aggregations[nestedAggregationName] = nestedAggregation;
  }

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
        size: preloadOptionsSearch(),
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
        !match.bool.should[1] ||
        !match.bool.should[1].terms ||
        !match.bool.should[1].terms[path])
  );
  filters = filters.concat(baseQuery.query.bool.must);
  return filters;
};

const getpath = (property, suggested) =>
  suggested ? `suggestedMetadata.${property.name}` : `metadata.${property.name}`;

const getSelectParentPath = path => {
  const parentPathSplit = path.split('.');
  parentPathSplit[parentPathSplit.length - 1] = 'parent';
  parentPathSplit.push('value');
  const parentPath = parentPathSplit.join('.');
  return parentPath;
};

const selectAggregation = (path, should, filters) => {
  const parentPath = getSelectParentPath(path);
  return {
    filter: { match_all: {} },
    aggregations: {
      self: aggregation(path, should, filters),
      parent: aggregation(parentPath, should, filters),
    },
  };
};

export const propertyToAggregation = (property, baseQuery, suggested = false) => {
  const path = getpath(property, suggested);
  const filters = extractFilters(baseQuery, path);
  const { should } = baseQuery.query.bool;

  if (property.type === 'nested') {
    return nestedAggregation(property, should, filters);
  }

  if (commonProperties.isOrInheritsSelect(property)) {
    return selectAggregation(path, should, filters);
  }

  return aggregation(path, should, filters);
};

export const generatedTocAggregations = baseQuery => {
  const path = 'generatedToc';
  const filters = extractFilters(baseQuery, path);
  const { should } = baseQuery.query.bool;
  return aggregation(path, should, filters);
};

const permissionsAggregations = (baseQuery, path, terms) => {
  const filters = extractFilters(baseQuery, path);
  const { should } = baseQuery.query.bool;

  const baseFilters = filters.filter(
    f =>
      !(
        (f.nested && f.nested.path === 'permissions') ||
        f?.bool?.should?.find(i => i?.nested?.path === 'permissions')
      )
  );

  return {
    filter: {
      bool: {
        should,
        filter: baseFilters,
      },
    },
    aggregations: {
      nestedPermissions: {
        nested: { path: 'permissions' },
        aggregations: {
          filtered: {
            terms: {
              field: path,
              size: preloadOptionsSearch(),
            },
            aggregations: {
              filteredByUser: {
                filter: {
                  bool: {
                    filter: [
                      {
                        terms,
                      },
                    ],
                  },
                },
                aggregations: {
                  uniqueEntities: {
                    reverse_nested: {},
                  },
                },
              },
            },
          },
        },
      },
    },
  };
};

export const permissionsLevelAgreggations = baseQuery =>
  permissionsAggregations(baseQuery, 'permissions.level', {
    'permissions.refId': permissionsContext.permissionsRefIds(),
  });

export const permissionsUsersAgreggations = (baseQuery, level) =>
  permissionsAggregations(baseQuery, 'permissions.refId', {
    'permissions.level': [level],
  });

export const publishingStatusAgreggations = baseQuery => {
  const path = 'published';
  const filters = extractFilters(baseQuery, path);
  const { should } = baseQuery.query.bool;
  const user = permissionsContext.getUserInContext();
  const needsPermissions = user && !['admin', 'editor'].includes(user.role);

  const baseFilters = filters.filter(
    f => !((f?.bool?.must || f?.bool?.should)?.[0]?.term?.published !== undefined)
  );

  if (needsPermissions) {
    baseFilters.push({
      bool: {
        should: [
          {
            term: {
              published: true,
            },
          },
          {
            bool: {
              must: [
                {
                  term: {
                    published: false,
                  },
                },
                {
                  nested: {
                    path: 'permissions',
                    query: {
                      bool: {
                        must: [
                          {
                            terms: {
                              'permissions.refId': permissionsContext.permissionsRefIds(),
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    });
  }

  return {
    filter: {
      bool: {
        should,
        filter: baseFilters,
      },
    },
    aggregations: {
      filtered: {
        terms: {
          field: path,
          missing: 'false',
          size: preloadOptionsSearch(),
        },
      },
    },
  };
};
