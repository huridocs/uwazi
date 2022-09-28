import { EdgeQuery, InternalNodeQuery, RelationshipsQuery } from '../contracts/RelationshipsQuery';
import { MatchQueryNode } from './graphs/MatchQueryNode';
import { RootQueryNode } from './graphs/RootQueryNode';
import { TraversalQueryNode } from './graphs/TraversalQueryNode';

export class MongoGraphQueryParser {
  private parseMatch(subquery: InternalNodeQuery): MatchQueryNode {
    return new MatchQueryNode(
      { templates: subquery.templates || [] },
      subquery.traverse?.map(traversal => this.parseTraversal(traversal))
    );
  }

  private parseTraversal(subquery: EdgeQuery): TraversalQueryNode {
    return new TraversalQueryNode(
      subquery.direction,
      { types: subquery.types || [] },
      subquery.match?.map(match => this.parseMatch(match))
    );
  }

  parseRoot(query: RelationshipsQuery): RootQueryNode {
    return new RootQueryNode(
      { sharedId: query.sharedId },
      query.traverse?.map(traversal => this.parseTraversal(traversal))
    );
  }

  parse(query: RelationshipsQuery) {
    return this.parseRoot(query);
  }
}
