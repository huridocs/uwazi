import { MatchQueryNode } from 'api/relationships.v2/database/graphs/MatchQueryNode';

export class RelationshipProperty {
  readonly type = 'newRelationship';

  readonly name: string;

  readonly label: string;

  readonly query: MatchQueryNode;

  constructor(name: string, label: string, query: MatchQueryNode) {
    this.name = name;
    this.label = label;
    this.query = query;
  }
}
