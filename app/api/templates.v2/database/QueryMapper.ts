import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';
import { TraversalQueryNode } from 'api/relationships.v2/model/TraversalQueryNode';
import {
  AndFilterOperatorNode,
  FilterNode,
  IdFilterCriteriaNode,
  SelectFilterCriteriaNode,
  TemplateFilterCriteriaNode,
  VoidFilterNode,
} from 'api/relationships.v2/model/FilterOperatorNodes';
import { FilterDBO, MatchQueryDBO, TraverseQueryDBO } from './schemas/RelationshipsQueryDBO';

const QueryMapperToModel = {
  parseFilter(query: FilterDBO): FilterNode {
    switch (query.type) {
      case 'and':
        return new AndFilterOperatorNode(query.value.map(QueryMapperToModel.parseFilter));
      case 'template':
        return new TemplateFilterCriteriaNode(query.value.map(MongoIdHandler.mapToApp));
      case 'id':
        return new IdFilterCriteriaNode(query.value);
      case 'select':
        return new SelectFilterCriteriaNode(query.property, query.value);
      case 'void':
        return new VoidFilterNode();
      default:
        throw new Error(`Unknown filter ${JSON.stringify(query)}`);
    }
  },

  parseMatch(query: MatchQueryDBO): MatchQueryNode {
    return new MatchQueryNode(
      QueryMapperToModel.parseFilter(query.filter),
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
  // eslint-disable-next-line max-statements
  parseFilter(filter: FilterNode): FilterDBO {
    if (filter instanceof AndFilterOperatorNode) {
      return {
        type: 'and',
        value: filter.getOperands().map(QueryMapperToDBO.parseFilter),
      };
    }

    if (filter instanceof TemplateFilterCriteriaNode) {
      return {
        type: 'template',
        value: filter.getTemplates().map(MongoIdHandler.mapToDb),
      };
    }

    if (filter instanceof IdFilterCriteriaNode) {
      return {
        type: 'id',
        value: filter.getSharedId(),
      };
    }

    if (filter instanceof SelectFilterCriteriaNode) {
      return {
        type: 'select',
        property: filter.getPropertyName(),
        value: filter.getThesauri(),
      };
    }

    if (filter instanceof VoidFilterNode) {
      return { type: 'void' };
    }

    throw new Error(`Unknown FilterNode ${filter}`);
  },

  parseMatch(query: MatchQueryNode): MatchQueryDBO {
    return {
      filter: QueryMapperToDBO.parseFilter(query.getFilters()),
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
