import { MatchQueryDBO, TraverseQueryDBO } from '../contracts/RelationshipsQuery';
import { MatchQueryNode } from '../model/MatchQueryNode';
import { TraversalQueryNode } from '../model/TraversalQueryNode';

export const MongoGraphQueryParser = {
  parseMatch(query: MatchQueryDBO): MatchQueryNode {
    return new MatchQueryNode(
      { templates: query.templates?.map(t => t.toHexString()), sharedId: query.sharedId },
      query.traverse?.map(traversal => this.parseTraversal(traversal))
    );
  },

  parseTraversal(subquery: TraverseQueryDBO): TraversalQueryNode {
    return new TraversalQueryNode(
      subquery.direction,
      { types: subquery.types?.map(t => t.toHexString()) },
      subquery.match?.map(match => this.parseMatch(match))
    );
  },
};
