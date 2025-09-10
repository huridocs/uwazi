import { Property, PropertyUpdateInfo } from './Property';

class V1RelationshipProperty extends Property {
  readonly relationType: string;

  readonly content?: string;

  readonly inheritedPropertyId?: string;

  constructor(
    id: string,
    name: string,
    label: string,
    relationType: string,
    template: string,
    content?: string,
    inheritedPropertyId?: string
  ) {
    super({ id, type: 'relationship', name, label, template });
    this.content = content;
    this.relationType = relationType;
    this.inheritedPropertyId = inheritedPropertyId;
  }

  override updatedAttributes(other: Property): PropertyUpdateInfo {
    if (!(other instanceof V1RelationshipProperty)) {
      throw new Error('Can only compare with another V1RelationshipProperty');
    }

    const updateInfo = super.updatedAttributes(other);

    if (this.relationType !== other.relationType) {
      updateInfo.updatedAttributes.push('relationType');
    }
    if (this.content !== other.content) {
      updateInfo.updatedAttributes.push('content');
    }
    if (this.inheritedPropertyId !== other.inheritedPropertyId) {
      updateInfo.updatedAttributes.push('inheritedPropertyId');
    }

    return updateInfo;
  }
}

export { V1RelationshipProperty };
