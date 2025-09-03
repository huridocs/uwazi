import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { Property, PropertyTypes } from 'api/templates.v2/model/Property';
import { objectIndex } from 'shared/data_utils/objectIndex';

type MappedPropertyTypes = Exclude<PropertyTypes, 'preview' | 'newRelationship'>;

type PropertyMappings = { [key in MappedPropertyTypes]: () => unknown };

export class RelationshipPropertyMappingFactory {
  private templateDS: TemplatesDataSource;

  private propertyMappings: PropertyMappings;

  private propertiesCache?: Record<string, Property>;

  constructor(templateDS: TemplatesDataSource, propertyMappings: PropertyMappings) {
    this.templateDS = templateDS;
    this.propertyMappings = propertyMappings;
  }

  private async getCachedProperty(name: string) {
    if (!this.propertiesCache) {
      const properties = await this.templateDS.getAllProperties().all();
      this.propertiesCache = objectIndex(
        properties,
        p => p.name,
        p => p
      );
    }

    return this.propertiesCache[name];
  }

  private async getDenormalizedType(denormalizedPropertyName?: string) {
    if (!denormalizedPropertyName) {
      return 'select'; //Title
    }

    const denormalizedProperty = await this.getCachedProperty(denormalizedPropertyName);

    return denormalizedProperty.type as MappedPropertyTypes;
  }

  async create(property: { denormalizedProperty?: string }) {
    const denormalizedPropertyType = await this.getDenormalizedType(property.denormalizedProperty);
    return this.propertyMappings[denormalizedPropertyType]();
  }
}
