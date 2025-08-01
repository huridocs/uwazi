import { objectIndex } from 'shared/data_utils/objectIndex';
import { Property, PropertyTypes, PropertyUpdateInfo } from './Property';
import { V1RelationshipProperty } from './V1RelationshipProperty';
import { CommonProperty } from './CommonProperty';

type TemplateProperty = Property | V1RelationshipProperty;

class Template {
  readonly id: string;

  readonly name: string;

  readonly properties: TemplateProperty[] = [];

  readonly commonProperties: CommonProperty[] = [];

  constructor(
    id: string,
    name: string,
    properties: Property[] = [],
    commonProperties: Property[] = []
  ) {
    this.id = id;
    this.name = name;
    this.properties = properties;
    this.commonProperties = commonProperties;
  }

  selectNewProperties(newTemplate: Template): Property[] {
    const oldIdSet = new Set(this.properties.map(p => p.id));
    return newTemplate.properties.filter(p => !oldIdSet.has(p.id));
  }

  selectUpdatedProperties(newTemplate: Template): PropertyUpdateInfo[] {
    const oldPropertiesById = objectIndex(
      this.properties,
      p => p.id,
      p => p
    );
    const newProperties = newTemplate.properties.filter(p => p.id in oldPropertiesById);
    const newPropertiesById = objectIndex(
      newProperties,
      p => p.id,
      p => p
    );
    const updateInfo = Object.entries(newPropertiesById)
      .map(([id, newProperty]) => {
        const oldProperty = oldPropertiesById[id];
        return oldProperty.updatedAttributes(newProperty);
      })
      .filter(info => info.updatedAttributes.length > 0);
    return updateInfo;
  }

  selectRelationshipPropsWithRelationshipChanges(newTemplate: Template): PropertyUpdateInfo[] {
    const v1Props = ['relationType', 'content', 'inheritedPropertyId'];
    return this.selectUpdatedProperties(newTemplate).filter(update =>
      update.updatedAttributes.some(attr => v1Props.includes(attr))
    );
  }

  selectPropertiesWhereNameHasChanged(newTemplate: Template): PropertyUpdateInfo[] {
    return this.selectUpdatedProperties(newTemplate).filter(update =>
      update.updatedAttributes.includes('name')
    );
  }

  selectDeletedProperties(newTemplate: Template): Property[] {
    const newPropertyIds = new Set(newTemplate.properties.map(p => p.id));
    return this.properties.filter(p => !newPropertyIds.has(p.id));
  }

  getPropertyById(propertyId: string) {
    const property = this.properties.find(p => p.id === propertyId);
    if (property) {
      return property;
    }

    const commonProperty = this.commonProperties.find(p => p.id === propertyId);
    if (commonProperty) {
      return commonProperty;
    }

    return null;
  }

  getPropertiesByType(type: PropertyTypes) {
    return this.properties.filter(p => p.type === type);
  }

  getRelationshipProperties(): V1RelationshipProperty[] {
    return this.properties.filter((p): p is V1RelationshipProperty => p.type === 'relationship');
  }
}

export type { TemplateProperty };
export { Template };
