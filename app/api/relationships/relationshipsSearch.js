import entities from '#api/entities/entities.js';

import { ObjectId } from 'mongodb';
import { search } from '../search/index.js';
import { RelationshipsV1DataSourceFactory } from '#api/core/infrastructure/factories/RelationshipsV1DataSourceFactory.js';
import { RelationshipsHubSelection } from './RelationshipsHubSelection.js';

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

/** The selected hubs, in order, each with the entity's own connections and the candidates. */
const getHubs = async (entitySharedId, hubIds, candidates) => {
  if (!hubIds.length) return [];

  const candidateIds = new Set(candidates.map(connection => connection._id.toString()));
  const connections = await RelationshipsV1DataSourceFactory.default().find({ hub: hubIds });

  const connectionsByHub = new Map(hubIds.map(hub => [hub, []]));
  connections
    .filter(c => c.entity === entitySharedId || candidateIds.has(c._id.toString()))
    .forEach(connection => connectionsByHub.get(connection.hub.toString()).push(connection));

  return hubIds.map(hub => ({ hub, connections: connectionsByHub.get(hub) }));
};

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
  const all =
    await RelationshipsV1DataSourceFactory.default().getRightSideConnections(entitySharedId);
  return {
    all,
    ofRelationTypes: RelationshipsHubSelection.byRelationType(all, relationTypeFilter),
  };
};

export const relationshipsSearch = async (entitySharedId, query, language, user) => {
  const { relationTypeFilter, entityTemplateFilter, filterCombinations } =
    processFilterCombinations(query);

  const { all: allRightSideConnections, ofRelationTypes: rightSideConnections } =
    await getRightSideConnections(entitySharedId, relationTypeFilter);

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

  const rows = RelationshipsHubSelection.indexSearchRows(searchResult.rows);
  const matchingConnections = RelationshipsHubSelection.matchingConnections(
    rightSideConnections,
    rows,
    filterCombinations
  );
  const candidates = RelationshipsHubSelection.candidateConnections(
    matchingConnections,
    allRightSideConnections,
    rows
  );
  const limit = Number(query.limit) || 10;

  const entitiesWithConnections = await destructureHubsIntoEntities(
    entitySharedId,
    await getHubs(
      entitySharedId,
      RelationshipsHubSelection.topHubIds(candidates, rows, limit),
      candidates
    ),
    searchResult,
    language
  );

  return {
    totalRows: new Set(matchingConnections.map(r => r.entity)).size || searchResult.totalRows,
    requestedHubs: limit,
    totalHubs: RelationshipsHubSelection.countHubs(candidates),
    rows: sortBySearchResultOrder(entitiesWithConnections, entitySharedId, searchResult),
  };
};
