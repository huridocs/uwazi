import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { Property, PropertyTypes } from 'api/templates.v2/model/Property';
import { objectIndex } from 'shared/data_utils/objectIndex';

type MappedPropertyTypes = Exclude<PropertyTypes, 'preview'>;

type PropertyMappings = { [key in MappedPropertyTypes]: () => unknown };

export class RelationshipPropertyMappingFactory {
  private templateDS: TemplatesDataSource;

  private propertyMappings: PropertyMappings;

  private _propertiesByName?: Record<string, Property>;

  constructor(templateDS: TemplatesDataSource, propertyMappings: PropertyMappings) {
    this.templateDS = templateDS;
    this.propertyMappings = propertyMappings;
    this._propertiesByName = {};
  }

  async init() {
    const properties = await this.templateDS.getAllProperties().all();
    this._propertiesByName = objectIndex(
      properties,
      p => p.name,
      p => p
    );
  }

  private getDenormalizedType(denormalizedPropertyName?: string) {
    if (!denormalizedPropertyName) {
      return 'text'; //Title
    }

    const denormalizedProperty = this._propertiesByName![denormalizedPropertyName];

    return denormalizedProperty.type as MappedPropertyTypes;
  }

  async create(denormalizedPropertyName?: string) {
    return this.propertyMappings[this.getDenormalizedType(denormalizedPropertyName)]();
  }
}
