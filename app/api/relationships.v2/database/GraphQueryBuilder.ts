/* eslint-disable import/exports-last */
import { ObjectId } from 'mongodb';
import { EdgeQuery, InternalNodeQuery, RelationshipsQuery } from '../services/RelationshipsQuery';
import { MatchQueryNode } from './graphs/MatchQueryNode';
import { QueryNode } from './graphs/QueryNode';
import { RootQueryNode } from './graphs/RootQueryNode';
import { TraversalQueryNode } from './graphs/TraversalQueryNode';

function parseMatch(subquery: InternalNodeQuery, field: 'to' | 'from') {
  const templates = subquery.templates?.map(template => new ObjectId(template)) || [];
  const node = new MatchQueryNode(field, templates);
  if (subquery.traverse) {
    subquery.traverse.forEach(traversal => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      node.addTraversal(parseTraversal(traversal));
    });
  }
  return node;
}

function parseTraversal(subquery: EdgeQuery) {
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
    node.addMatch(parseMatch(match, nextField));
  });
  return node;
}

export function parseRelationshipQuery(query: RelationshipsQuery): QueryNode {
  const node = new RootQueryNode(query.sharedId);
  if (query.traverse) {
    query.traverse.forEach(subquery => {
      node.addTraversal(parseTraversal(subquery));
    });
  }
  return node;
}
