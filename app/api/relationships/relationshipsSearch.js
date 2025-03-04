import entities from 'api/entities/entities';

import { ObjectId } from 'mongodb';
import { search } from '../search';
import model from './model';

const getMatchingHubsCount = async (entitySharedId, searchResultIds, filteredConnections) => {
  const [countResult] = await model.db.aggregate([
    { $match: { entity: entitySharedId } },
    {
      $lookup: {
        from: 'connections',
        localField: 'hub',
        foreignField: 'hub',
        as: 'connections',
      },
    },
    {
      $match: {
        ...(filteredConnections.length
          ? { 'connections._id': { $in: filteredConnections } }
          : { 'connections.entity': { $in: searchResultIds } }),
      },
    },
    { $group: { _id: '$hub' } },
    { $count: 'total' },
  ]);

  return countResult?.total || 0;
};

const processFilterCombinations = query => {
  const combinations = Object.entries(query.filter || {}).reduce(
    (acc, [relationTypeId, templateAndRelationTypeCombo]) => {
      if (!templateAndRelationTypeCombo.length) return acc;
      return [
        ...acc,
        ...templateAndRelationTypeCombo.map(combo => ({
          relationTypeId: relationTypeId === 'null' ? null : new ObjectId(relationTypeId),
          entityTemplateId: combo.replace(relationTypeId, ''),
        })),
      ];
    },
    []
  );

  return {
    relationTypeFilter: [...new Set(combinations.map(c => c.relationTypeId))],
    entityTemplateFilter: [...new Set(combinations.map(c => c.entityTemplateId))],
    filterCombinations: combinations,
  };
};

const filterMatchingConnections = (connections, searchResults, filterCombinations) =>
  connections.filter(connection => {
    const matchingEntity = searchResults.rows.find(r => r.sharedId === connection.entity);
    if (!matchingEntity) return false;

    return filterCombinations.some(
      combo =>
        (connection.template?.equals(combo.relationTypeId) ||
          (combo.relationTypeId === null && !connection.template)) &&
        combo.entityTemplateId === matchingEntity.template?.toString()
    );
  });

const destructureHubsIntoEntities = async (entitySharedId, hubs, searchResults, language) => {
  const leftSideEntity = await entities.getById(entitySharedId, language);
  let foundEntities = searchResults.rows;
  if (leftSideEntity) {
    foundEntities = foundEntities.concat([leftSideEntity]);
  }
  const entityMap = new Map(foundEntities.map(entity => [entity.sharedId, entity]));
  const connectionsPerEntity = hubs.reduce((memo, row) => {
    row.connections.forEach(connection => {
      // eslint-disable-next-line no-param-reassign
      if (!memo[connection.entity]) memo[connection.entity] = [];
      // eslint-disable-next-line no-param-reassign
      connection.entityData = entityMap.get(connection.entity);
      memo[connection.entity].push(connection);
    });
    return memo;
  }, {});

  return entities
    .get({ sharedId: { $in: Object.keys(connectionsPerEntity) }, language })
    .then(entitiesInvolved => {
      entitiesInvolved.forEach(e => {
        e.connections = connectionsPerEntity[e.sharedId].reduce((unique, connection) => {
          if (!unique.some(existingConn => existingConn._id.equals(connection._id))) {
            unique.push(connection);
          }
          return unique;
        }, []);
      });
      return entitiesInvolved;
    });
};

const getHubs = async (entitySharedId, filteredConnections, filteredSharedIds, limit) =>
  model.db.aggregate([
    { $match: { entity: entitySharedId } },
    { $project: { hub: 1 } },
    {
      $lookup: {
        from: 'connections',
        localField: 'hub',
        foreignField: 'hub',
        as: 'connections',
      },
    },
    {
      $project: {
        hub: 1,
        connections: {
          $filter: {
            input: '$connections',
            as: 'conn',
            cond: {
              $and: [
                {
                  $or: [
                    { $eq: ['$$conn.entity', entitySharedId] },
                    ...(filteredConnections.length
                      ? [{ $in: ['$$conn._id', filteredConnections] }]
                      : [{ $in: ['$$conn.entity', filteredSharedIds] }]),
                  ],
                },
              ],
            },
          },
        },
      },
    },
    {
      $match: {
        'connections.entity': { $in: filteredSharedIds },
      },
    },
    {
      $addFields: {
        sortValue: {
          $min: {
            $map: {
              input: '$connections',
              as: 'conn',
              in: {
                $cond: {
                  if: { $ne: ['$$conn.entity', entitySharedId] },
                  then: {
                    $indexOfArray: [filteredSharedIds, '$$conn.entity'],
                  },
                  else: 999999,
                },
              },
            },
          },
        },
      },
    },
    { $sort: { sortValue: 1 } },
    { $limit: limit },
  ]);

const sortBySearchResultOrder = (entitiesWithConnections, entitySharedId, searchResult) =>
  entitiesWithConnections.sort((a, b) => {
    if (a.sharedId === entitySharedId) return 1;
    if (b.sharedId === entitySharedId) return -1;
    const indexA = searchResult.rows.findIndex(r => r.sharedId === a.sharedId);
    const indexB = searchResult.rows.findIndex(r => r.sharedId === b.sharedId);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

const getRightSideConnections = async (entitySharedId, relationTypeFilter) => {
  const hubsIds = (await model.get({ entity: entitySharedId }, 'hub')).map(r => r.hub);

  const rightSideConnections = await model.get(
    {
      hub: { $in: hubsIds },
      entity: { $ne: entitySharedId },
      ...(relationTypeFilter.length ? { template: { $in: relationTypeFilter } } : {}),
    },
    { entity: 1, template: 1 }
  );
  return rightSideConnections;
};

export const relationshipsSearch = async (entitySharedId, query, language, user) => {
  const { relationTypeFilter, entityTemplateFilter, filterCombinations } =
    processFilterCombinations(query);

  const rightSideConnections = await getRightSideConnections(entitySharedId, relationTypeFilter);

  const searchResult = await search.search(
    {
      ...query,
      performAggregations: false,
      ids: rightSideConnections.length ? rightSideConnections.map(r => r.entity) : ['no_results'],
      includeUnpublished: true,
      limit: 9999,
      filter: undefined,
      types: entityTemplateFilter,
    },
    language,
    user
  );

  const filteredSharedIds = searchResult.rows.map(r => r.sharedId);

  const matchingConnections = filterMatchingConnections(
    rightSideConnections,
    searchResult,
    filterCombinations
  );
  const filteredConnections = matchingConnections.map(r => r._id);

  const totalHubs = await getMatchingHubsCount(
    entitySharedId,
    filteredSharedIds,
    filteredConnections
  );

  const limit = Number(query.limit) || 10;

  const entitiesWithConnections = await destructureHubsIntoEntities(
    entitySharedId,
    await getHubs(entitySharedId, filteredConnections, filteredSharedIds, limit),
    searchResult,
    language
  );

  return {
    totalRows: new Set(matchingConnections.map(r => r.entity)).size || searchResult.totalRows,
    requestedHubs: limit,
    totalHubs,
    rows: sortBySearchResultOrder(entitiesWithConnections, entitySharedId, searchResult),
  };
};
