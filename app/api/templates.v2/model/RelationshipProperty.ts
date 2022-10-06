import { Entity } from 'api/entities.v2/model/Entity';
import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';
import { Relationship } from 'api/relationships.v2/model/Relationship';

export class RelationshipProperty {
  readonly type = 'newRelationship';

  readonly name: string;

  readonly label: string;

  readonly query: MatchQueryNode['traversals'];

  readonly template: string;

  constructor(name: string, label: string, query: MatchQueryNode['traversals'], template: string) {
    this.name = name;
    this.label = label;
    this.query = query;
    this.template = template;
  }

  buildQueryRootedInTemplate() {
    return new MatchQueryNode({ templates: [this.template] }, this.query);
  }

  buildQueryInvertedFromRelationship(relationship: Relationship, entities: Entity[]) {
    return this.buildQueryRootedInTemplate().invertFromRelationship(relationship, entities);
  }
}
