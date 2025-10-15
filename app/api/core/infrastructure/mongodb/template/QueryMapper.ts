import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';
import { TraversalQueryNode } from 'api/relationships.v2/model/TraversalQueryNode';
import { MatchQueryDBO, TraverseQueryDBO } from './schemas/RelationshipsQueryDBO';

const QueryMapperToModel = {
  parseMatch(query: MatchQueryDBO): MatchQueryNode {
    return new MatchQueryNode(
      {
        templates: query.templates?.map(MongoIdHandler.mapToApp),
        sharedId: query.sharedId,
      },
      query.traverse?.map(traversal => QueryMapperToModel.parseTraversal(traversal))
    );
  },

  parseTraversal(query: TraverseQueryDBO): TraversalQueryNode {
    return new TraversalQueryNode(
      query.direction,
      { types: query.types?.map(MongoIdHandler.mapToApp) },
      query.match?.map(match => QueryMapperToModel.parseMatch(match))
    );
  },
};

const mapPropertyQuery = (query: TraverseQueryDBO[]) =>
  query.map(QueryMapperToModel.parseTraversal);

const QueryMapperToDBO = {
  parseMatch(query: MatchQueryNode): MatchQueryDBO {
    return {
      templates: query.getFilters().templates?.map(MongoIdHandler.mapToDb),
      traverse: query.getTraversals().map(QueryMapperToDBO.parseTraversal),
    };
  },

  parseTraversal(query: TraversalQueryNode): TraverseQueryDBO {
    return {
      types: query.getFilters().types?.map(MongoIdHandler.mapToDb),
      direction: query.getDirection(),
      match: query.getMatches().map(QueryMapperToDBO.parseMatch),
    };
  },
};

const mapPropertyQueryToDBO = (query: readonly TraversalQueryNode[]) =>
  query.map(QueryMapperToDBO.parseTraversal);

const QueryMapper = {
  toModel: mapPropertyQuery,
  toDBO: mapPropertyQueryToDBO,
};

export { mapPropertyQuery, QueryMapper };
