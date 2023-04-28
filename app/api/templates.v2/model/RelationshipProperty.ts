import { Entity } from 'api/entities.v2/model/Entity';
import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';
import { Relationship } from 'api/relationships.v2/model/Relationship';
import { Property, PropertyUpdateInfo } from './Property';

class RelationshipProperty extends Property {
  readonly query: MatchQueryNode['traversals'];

  readonly denormalizedProperty?: string;

  constructor(
    id: string,
    name: string,
    label: string,
    query: MatchQueryNode['traversals'],
    template: string,
    denormalizedProperty?: string
  ) {
    super(id, 'newRelationship', name, label, template);
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

  get inherits() {
    return this.denormalizedProperty !== undefined;
  }

  hasSameQuery(other: RelationshipProperty) {
    return (
      this.query.length === other.query.length &&
      this.query.every((q, i) => q.isSame(other.query[i]))
    );
  }

  updatedAttributes(other: RelationshipProperty): PropertyUpdateInfo {
    const info = super.updatedAttributes(other);
    if (!this.hasSameQuery(other)) info.updatedAttributes.push('query');
    if (this.denormalizedProperty !== other.denormalizedProperty) {
      info.updatedAttributes.push('denormalizedProperty');
    }
    return info;
  }

  queryUsesTemplate(templateId: string) {
    return this.query.some(traversal => traversal.usesTemplate(templateId));
  }

  queryUsesRelationType(typeId: string): boolean {
    return this.query.some(traversal => traversal.usesType(typeId));
  }
}

export { RelationshipProperty };
