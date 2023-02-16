import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { PropertySchema } from 'shared/types/commonTypes';

type PropertyMappings = Omit<
  {
    [key in PropertySchema['type']]: () => unknown;
  },
  'preview'
>;

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

    return denormalizedProperty.type as keyof PropertyMappings;
  }

  async create(denormalizedPropertyName?: string) {
    return this.propertyMappings[await this.getDenormalizedType(denormalizedPropertyName)]();
  }
}
