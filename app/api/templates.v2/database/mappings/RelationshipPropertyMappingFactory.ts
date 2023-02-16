import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { PropertyTypes } from 'api/templates.v2/model/Property';

type MappedPropertyTypes = Exclude<PropertyTypes, 'preview'>;

type PropertyMappings = { [key in MappedPropertyTypes]: () => unknown };

export class RelationshipPropertyMappingFactory {
  private templateDS: TemplatesDataSource;

  private propertyMappings: PropertyMappings;

  constructor(templateDS: TemplatesDataSource, propertyMappings: PropertyMappings) {
    this.templateDS = templateDS;
    this.propertyMappings = propertyMappings;
  }

  private async getDenormalizedType(denormalizedPropertyName?: string) {
    if (!denormalizedPropertyName) {
      return 'text'; //Title
    }

    const denormalizedProperty = await this.templateDS.getPropertyByName(denormalizedPropertyName);

    return denormalizedProperty.type as MappedPropertyTypes;
  }

  async create(denormalizedPropertyName?: string) {
    return this.propertyMappings[await this.getDenormalizedType(denormalizedPropertyName)]();
  }
}
