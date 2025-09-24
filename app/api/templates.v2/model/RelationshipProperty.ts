// @ts-expect-error TS(2307): Cannot find module '../entities.v2/model/Entity.js... Remove this comment to see the full error message
import { Entity } from '../entities.v2/model/Entity.js';
// @ts-expect-error TS(2307): Cannot find module '../relationships.v2/model/Matc... Remove this comment to see the full error message
import { MatchQueryNode } from '../relationships.v2/model/MatchQueryNode.js';
// @ts-expect-error TS(2307): Cannot find module '../relationships.v2/model/Rela... Remove this comment to see the full error message
import { Relationship } from '../relationships.v2/model/Relationship.js';
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
    super({
      id,
      type: 'newRelationship',
      name,
      label,
      template,
    });
    this.query = query;
    this.denormalizedProperty = denormalizedProperty;
  }

  buildQueryRootedInTemplate() {
    return new MatchQueryNode({ templates: [this.template] }, this.query);
  }

  buildQueryRootedInEntity(sharedId: Entity['sharedId']) {
    return MatchQueryNode.forEntity(sharedId, this.query);
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
      // @ts-expect-error TS(7006): Parameter 'q' implicitly has an 'any' type.
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
    // @ts-expect-error TS(7006): Parameter 'traversal' implicitly has an 'any' type... Remove this comment to see the full error message
    return this.query.some(traversal => traversal.usesTemplate(templateId));
  }

  queryUsesRelationType(typeId: string): boolean {
    // @ts-expect-error TS(7006): Parameter 'traversal' implicitly has an 'any' type... Remove this comment to see the full error message
    return this.query.some(traversal => traversal.usesType(typeId));
  }
}

export { RelationshipProperty };
