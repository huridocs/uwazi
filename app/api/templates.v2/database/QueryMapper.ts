import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';
import { TraversalQueryNode } from 'api/relationships.v2/model/TraversalQueryNode';
import { MatchQueryDBO, TraverseQueryDBO } from './schemas/RelationshipsQueryDBO';

const QueryMapper = {
  parseMatch(query: MatchQueryDBO): MatchQueryNode {
    return new MatchQueryNode(
      { templates: query.templates?.map(t => t.toHexString()), sharedId: query.sharedId },
      query.traverse?.map(traversal => QueryMapper.parseTraversal(traversal))
    );
  },

  parseTraversal(query: TraverseQueryDBO): TraversalQueryNode {
    return new TraversalQueryNode(
      query.direction,
      { types: query.types?.map(t => t.toHexString()) },
      query.match?.map(match => QueryMapper.parseMatch(match))
    );
  },
};

export const mapPropertyQuery = (query: TraverseQueryDBO[]) =>
  query.map(QueryMapper.parseTraversal);
