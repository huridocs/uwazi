// @ts-expect-error TS(2307): Cannot find module '../templates.v2/contracts/Temp... Remove this comment to see the full error message
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Property... Remove this comment to see the full error message
import { Property, PropertyTypes } from 'api/templates.v2/model/Property.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/data_utils/object... Remove this comment to see the full error message
import { objectIndex } from 'shared/data_utils/objectIndex.js';

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
        // @ts-expect-error TS(7006): Parameter 'p' implicitly has an 'any' type.
        p => p.name,
        // @ts-expect-error TS(7006): Parameter 'p' implicitly has an 'any' type.
        p => p
      );
    }

    // @ts-expect-error TS(2532): Object is possibly 'undefined'.
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
