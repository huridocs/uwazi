import { ObjectId } from 'mongodb';
import { EdgeQuery, InternalNodeQuery, RelationshipsQuery } from '../contracts/RelationshipsQuery';
import { MatchQueryNode } from './graphs/MatchQueryNode';
import { QueryNode } from './graphs/QueryNode';
import { RootQueryNode } from './graphs/RootQueryNode';
import { TraversalQueryNode } from './graphs/TraversalQueryNode';

export class MongoGraphQueryParser {
  private parseMatch(subquery: InternalNodeQuery, field: 'to' | 'from') {
    const templates = subquery.templates?.map(template => new ObjectId(template)) || [];
    const node = new MatchQueryNode(field, templates);
    if (subquery.traverse) {
      subquery.traverse.forEach(traversal => {
        node.addTraversal(this.parseTraversal(traversal));
      });
    }
    return node;
  }

  private parseTraversal(subquery: EdgeQuery) {
    const directionToField = {
      in: 'to',
      out: 'from',
    } as const;

    const otherField = {
      to: 'from',
      from: 'to',
    } as const;

    const field = directionToField[subquery.direction];
    const nextField = otherField[field];

    const types = subquery.types?.map(type => new ObjectId(type)) || [];

    const node = new TraversalQueryNode(field, types);
    subquery.match.forEach(match => {
      node.addMatch(this.parseMatch(match, nextField));
    });
    return node;
  }

  private parseRoot(query: RelationshipsQuery): QueryNode {
    const node = new RootQueryNode(query.sharedId);
    if (query.traverse) {
      query.traverse.forEach(subquery => {
        node.addTraversal(this.parseTraversal(subquery));
      });
    }
    return node;
  }

  parse(query: RelationshipsQuery) {
    const ast = this.parseRoot(query);
    return ast.compile(0);
  }
}
