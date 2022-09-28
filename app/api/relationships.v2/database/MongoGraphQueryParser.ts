import { EdgeQuery, InternalNodeQuery, RelationshipsQuery } from '../contracts/RelationshipsQuery';
import { MatchQueryNode } from './graphs/MatchQueryNode';
import { TraversalQueryNode } from './graphs/TraversalQueryNode';

export class MongoGraphQueryParser {
  private parseMatch(subquery: InternalNodeQuery): MatchQueryNode {
    return new MatchQueryNode(
      { templates: subquery.templates, sharedId: subquery.sharedId },
      subquery.traverse?.map(traversal => this.parseTraversal(traversal))
    );
  }

  private parseTraversal(subquery: EdgeQuery): TraversalQueryNode {
    return new TraversalQueryNode(
      subquery.direction,
      { types: subquery.types },
      subquery.match?.map(match => this.parseMatch(match))
    );
  }

  parseRoot(query: RelationshipsQuery): MatchQueryNode {
    return this.parseMatch(query);
  }

  parse(query: RelationshipsQuery) {
    return this.parseRoot(query);
  }
}
