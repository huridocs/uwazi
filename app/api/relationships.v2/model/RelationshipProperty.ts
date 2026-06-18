import { DeprecatedEntity } from '#api/entities.v2/model/Entity.js';
import { MatchQueryNode } from './MatchQueryNode.js';
import { Relationship } from './Relationship.js';
import { Property, PropertyUpdateInfo } from '#api/core/domain/template/Property.js';
import { PropertyTypeEnum } from '#api/core/domain/template/PropertyType.js';
import { FilterablePropertyProps } from '#api/core/domain/template/FilterableProperty.js';

type Props = {
  type?: PropertyTypeEnum.NewRelationship;
  query: MatchQueryNode['traversals'];
  denormalizedProperty?: string;
} & Omit<FilterablePropertyProps, 'type'>;

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

  buildQueryRootedInEntity(sharedId: DeprecatedEntity['sharedId']) {
    return MatchQueryNode.forEntity(sharedId, this.query);
  }

  buildQueryInvertedFromRelationship(relationship: Relationship, entities: DeprecatedEntity[]) {
    return this.buildQueryRootedInTemplate().invertFromRelationship(relationship, entities);
  }

  buildQueryInvertedFromEntity(entity: DeprecatedEntity) {
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
export type { Props as RelationshipPropertyProps };
