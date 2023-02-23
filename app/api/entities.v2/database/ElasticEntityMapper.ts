import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
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
      if (property?.type === 'newRelationship') {
        metadata[propertyName] = (entity.metadata?.[propertyName] || [])
          .map(value => value.inheritedValue)
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
