import { Entity } from 'api/entities.v2/model/Entity';
import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';
import { Relationship } from 'api/relationships.v2/model/Relationship';
import { propertyTypes } from 'shared/propertyTypes';
import { Property } from './Property';

class RelationshipProperty extends Property {
  readonly query: MatchQueryNode['traversals'];

  readonly denormalizedProperty?: string;

  constructor(
    name: string,
    label: string,
    query: MatchQueryNode['traversals'],
    template: string,
    denormalizedProperty?: string
  ) {
    super('newRelationship', name, label, template);
    this.query = query;
    this.denormalizedProperty = denormalizedProperty;
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

  static isRelationshipProperty(property: Property | undefined): property is RelationshipProperty {
    return property !== undefined && property.type === propertyTypes.newRelationship;
  }

  get inherits() {
    return this.denormalizedProperty !== undefined;
  }
}

export { RelationshipProperty };
