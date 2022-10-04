import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';

export class RelationshipProperty {
  readonly type = 'newRelationship';

  readonly name: string;

  readonly label: string;

  readonly query: MatchQueryNode['traversals'];

  constructor(name: string, label: string, query: MatchQueryNode['traversals']) {
    this.name = name;
    this.label = label;
    this.query = query;
  }
}
