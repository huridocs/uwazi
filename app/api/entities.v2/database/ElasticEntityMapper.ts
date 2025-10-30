import { TemplatesDataSource } from 'api/core/application/contracts/TemplatesDataSource';
import { RelationshipProperty } from 'api/core/domain/template/RelationshipProperty';
import { EntitySchema } from 'shared/types/entityType';

export class ElasticEntityMapper {
  private templateDS: TemplatesDataSource;

  constructor(templateDS: TemplatesDataSource) {
    this.templateDS = templateDS;
  }

  async toElastic(entity: EntitySchema) {
    const properties = await this.templateDS.getAllProperties().all();
    const metadata: { [propertyName: string]: any } = {};

    Object.entries(entity.metadata || {}).forEach(([propertyName, values]) => {
      const property = properties.find(p => p.name === propertyName);
      if (property instanceof RelationshipProperty && property.inherits) {
        metadata[propertyName] = (entity.metadata?.[propertyName] || [])
          .map(({ inheritedValue, ...originalValue }) =>
            inheritedValue!.map(denormalized => ({
              ...denormalized,
              originalValue,
            }))
          )
          .flat();
      } else {
        metadata[propertyName] = values;
      }
    });

    return {
      ...entity,
      metadata,
    };
  }
}
