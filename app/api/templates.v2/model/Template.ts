import { objectIndex } from 'shared/data_utils/objectIndex';
import { Property, PropertyUpdateInfo } from './Property';

class Template {
  readonly id: string;

  readonly name: string;

  readonly properties: Property[] = [];

  readonly commonProperties: Property[] = [];

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

  selectUpdatedProperties = (newTemplate: Template): PropertyUpdateInfo[] => {
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
    const updateInfo = Object.entries(newPropertiesById).map(([id, newProperty]) => {
      const oldProperty = oldPropertiesById[id];
      return oldProperty.updatedAttributes(newProperty);
    });
    return updateInfo;
  };

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
}

export { Template };
