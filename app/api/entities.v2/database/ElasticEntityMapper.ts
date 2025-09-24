// @ts-expect-error TS(2307): Cannot find module '../templates.v2/contracts/Temp... Remove this comment to see the full error message
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Relation... Remove this comment to see the full error message
import { RelationshipProperty } from 'api/templates.v2/model/RelationshipProperty.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/entityType.... Remove this comment to see the full error message
import { EntitySchema } from 'shared/types/entityType.js';

export class ElasticEntityMapper {
  private templateDS: TemplatesDataSource;

  constructor(templateDS: TemplatesDataSource) {
    this.templateDS = templateDS;
  }

  async toElastic(entity: EntitySchema) {
    const properties = await this.templateDS.getAllProperties().all();
    const metadata: { [propertyName: string]: any } = {};

    Object.entries(entity.metadata || {}).forEach(([propertyName, values]) => {
      // @ts-expect-error TS(7006): Parameter 'p' implicitly has an 'any' type.
      const property = properties.find(p => p.name === propertyName);
      if (property instanceof RelationshipProperty && property.inherits) {
        metadata[propertyName] = (entity.metadata?.[propertyName] || [])
          // @ts-expect-error TS(7031): Binding element 'inheritedValue' implicitly has an... Remove this comment to see the full error message
          .map(({ inheritedValue, ...originalValue }) =>
            // @ts-expect-error TS(7006): Parameter 'denormalized' implicitly has an 'any' t... Remove this comment to see the full error message
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
