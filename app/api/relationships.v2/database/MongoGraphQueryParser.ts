import { EdgeQuery, InternalNodeQuery } from '../contracts/RelationshipsQuery';
import { MatchQueryNode } from '../model/MatchQueryNode';
import { TraversalQueryNode } from '../model/TraversalQueryNode';

export const MongoGraphQueryParser = {
  parseMatch(subquery: InternalNodeQuery): MatchQueryNode {
    return new MatchQueryNode(
      { templates: subquery.templates, sharedId: subquery.sharedId },
      subquery.traverse?.map(traversal => this.parseTraversal(traversal))
    );
  },

  parseTraversal(subquery: EdgeQuery): TraversalQueryNode {
    return new TraversalQueryNode(
      subquery.direction,
      { types: subquery.types },
      subquery.match?.map(match => this.parseMatch(match))
    );
  },
};
