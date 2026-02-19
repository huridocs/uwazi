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
  const getEntityStart = performance.now();
  const leftSideEntity = await entities.getById(entitySharedId, language);
  console.log(
    '[PERF][RelationshipsSearch] destructureHubsIntoEntities - getById:',
    (performance.now() - getEntityStart).toFixed(2),
    'ms'
  );

  const buildMapStart = performance.now();
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
  console.log(
    '[PERF][RelationshipsSearch] destructureHubsIntoEntities - build entityMap:',
    (performance.now() - buildMapStart).toFixed(2),
    'ms',
    '- Entities in map:',
    Object.keys(connectionsPerEntity).length
  );

  const getEntitiesStart = performance.now();
  return entities
    .get({ sharedId: { $in: Object.keys(connectionsPerEntity) }, language })
    .then(entitiesInvolved => {
      console.log(
        '[PERF][RelationshipsSearch] destructureHubsIntoEntities - entities.get:',
        (performance.now() - getEntitiesStart).toFixed(2),
        'ms',
        '- Entities:',
        entitiesInvolved.length
      );
      const processStart = performance.now();
      entitiesInvolved.forEach(e => {
        e.connections = connectionsPerEntity[e.sharedId].reduce((unique, connection) => {
          if (!unique.some(existingConn => existingConn._id.equals(connection._id))) {
            unique.push(connection);
          }
          return unique;
        }, []);
      });
      console.log(
        '[PERF][RelationshipsSearch] destructureHubsIntoEntities - process connections:',
        (performance.now() - processStart).toFixed(2),
        'ms'
      );
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
  const hubsQueryStart = performance.now();
  const hubsIds = (await model.get({ entity: entitySharedId }, 'hub')).map(r => r.hub);
  console.log(
    '[PERF][RelationshipsSearch] getRightSideConnections - hubsIds query:',
    (performance.now() - hubsQueryStart).toFixed(2),
    'ms',
    '- Hubs:',
    hubsIds.length
  );

  const connectionsQueryStart = performance.now();
  const rightSideConnections = await model.get(
    {
      hub: { $in: hubsIds },
      entity: { $ne: entitySharedId },
      ...(relationTypeFilter.length ? { template: { $in: relationTypeFilter } } : {}),
    },
    { entity: 1, template: 1 }
  );
  console.log(
    '[PERF][RelationshipsSearch] getRightSideConnections - connections query:',
    (performance.now() - connectionsQueryStart).toFixed(2),
    'ms',
    '- Connections:',
    rightSideConnections.length
  );
  return rightSideConnections;
};

export const relationshipsSearch = async (entitySharedId, query, language, user) => {
  const searchStart = performance.now();
  console.log('[PERF][RelationshipsSearch] START - entitySharedId:', entitySharedId);

  const filterStart = performance.now();
  const { relationTypeFilter, entityTemplateFilter, filterCombinations } =
    processFilterCombinations(query);
  console.log(
    '[PERF][RelationshipsSearch] processFilterCombinations:',
    (performance.now() - filterStart).toFixed(2),
    'ms'
  );

  const rightSideStart = performance.now();
  const rightSideConnections = await getRightSideConnections(entitySharedId, relationTypeFilter);
  console.log(
    '[PERF][RelationshipsSearch] getRightSideConnections:',
    (performance.now() - rightSideStart).toFixed(2),
    'ms',
    '- Connections:',
    rightSideConnections.length
  );

  const elasticSearchStart = performance.now();
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
  console.log(
    '[PERF][RelationshipsSearch] ElasticSearch search.search:',
    (performance.now() - elasticSearchStart).toFixed(2),
    'ms',
    '- Results:',
    searchResult.rows?.length || 0
  );

  const mapStart = performance.now();
  const filteredSharedIds = searchResult.rows.map(r => r.sharedId);
  console.log(
    '[PERF][RelationshipsSearch] map filteredSharedIds:',
    (performance.now() - mapStart).toFixed(2),
    'ms'
  );

  const filterConnStart = performance.now();
  const matchingConnections = filterMatchingConnections(
    rightSideConnections,
    searchResult,
    filterCombinations
  );
  const filteredConnections = matchingConnections.map(r => r._id);
  console.log(
    '[PERF][RelationshipsSearch] filterMatchingConnections:',
    (performance.now() - filterConnStart).toFixed(2),
    'ms',
    '- Matching:',
    matchingConnections.length
  );

  const countStart = performance.now();
  const totalHubs = await getMatchingHubsCount(
    entitySharedId,
    filteredSharedIds,
    filteredConnections
  );
  console.log(
    '[PERF][RelationshipsSearch] getMatchingHubsCount:',
    (performance.now() - countStart).toFixed(2),
    'ms',
    '- Total hubs:',
    totalHubs
  );

  const limit = Number(query.limit) || 10;

  const hubsStart = performance.now();
  const hubs = await getHubs(entitySharedId, filteredConnections, filteredSharedIds, limit);
  console.log(
    '[PERF][RelationshipsSearch] getHubs:',
    (performance.now() - hubsStart).toFixed(2),
    'ms',
    '- Hubs:',
    hubs.length
  );

  const destructureStart = performance.now();
  const entitiesWithConnections = await destructureHubsIntoEntities(
    entitySharedId,
    hubs,
    searchResult,
    language
  );
  console.log(
    '[PERF][RelationshipsSearch] destructureHubsIntoEntities:',
    (performance.now() - destructureStart).toFixed(2),
    'ms',
    '- Entities:',
    entitiesWithConnections.length
  );

  const sortStart = performance.now();
  const sortedRows = sortBySearchResultOrder(entitiesWithConnections, entitySharedId, searchResult);
  console.log(
    '[PERF][RelationshipsSearch] sortBySearchResultOrder:',
    (performance.now() - sortStart).toFixed(2),
    'ms'
  );

  console.log(
    '[PERF][RelationshipsSearch] TOTAL:',
    (performance.now() - searchStart).toFixed(2),
    'ms'
  );

  return {
    totalRows: new Set(matchingConnections.map(r => r.entity)).size || searchResult.totalRows,
    requestedHubs: limit,
    totalHubs,
    rows: sortedRows,
  };
};
