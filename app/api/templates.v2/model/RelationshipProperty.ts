import { Entity } from 'api/entities.v2/model/Entity';
import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';
import { Relationship } from 'api/relationships.v2/model/Relationship';

export class RelationshipProperty {
  readonly type = 'newRelationship';

  readonly name: string;

  readonly label: string;

  readonly query: MatchQueryNode['traversals'];

  readonly denormalizedProperty: string;

  readonly template: string;

  constructor(
    name: string,
    label: string,
    query: MatchQueryNode['traversals'],
    denormalizedProperty: string,
    template: string
  ) {
    this.name = name;
    this.label = label;
    this.query = query;
    this.denormalizedProperty = denormalizedProperty;
    this.template = template;
  }

  buildQueryRootedInTemplate() {
    return new MatchQueryNode({ templates: [this.template] }, this.query);
  }

  buildQueryInvertedFromRelationship(relationship: Relationship, entities: Entity[]) {
    return this.buildQueryRootedInTemplate().invertFromRelationship(relationship, entities);
  }

  buildQueryInvertedFromEntity(entity: Entity) {
    return this.buildQueryRootedInTemplate().invertFromEntity(entity);
  }
}
