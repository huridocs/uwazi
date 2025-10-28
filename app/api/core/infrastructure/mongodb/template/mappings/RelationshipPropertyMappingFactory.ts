import { TemplatesDataSource } from 'api/core/application/contracts/TemplatesDataSource';
import { Property } from 'api/core/domain/template/Property';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { PropertyType } from 'api/core/domain/template/PropertyType';

type MappedPropertyTypes = Exclude<PropertyType, 'preview' | 'newRelationship'>;

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
