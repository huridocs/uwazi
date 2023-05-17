import { MatchQueryNode } from 'api/relationships.v2/model/MatchQueryNode';
import { Template } from 'api/templates.v2/model/Template';
import { RelationshipProperty } from 'api/templates.v2/model/RelationshipProperty';
import { RelationshipsDataSource } from 'api/relationships.v2/contracts/RelationshipsDataSource';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { Entity, MetadataValue } from '../model/Entity';
import { EntitiesDataSource } from '../contracts/EntitiesDataSource';

export class EntityRelationshipsUpdateService {
  private entitiesDataSource: EntitiesDataSource;

  private templatesDataSource: TemplatesDataSource;

  private relationshipsDataSource: RelationshipsDataSource;

  constructor(
    entitiesDataSource: EntitiesDataSource,
    templatesDataSource: TemplatesDataSource,
    relatioshipsDataSource: RelationshipsDataSource
  ) {
    this.entitiesDataSource = entitiesDataSource;
    this.templatesDataSource = templatesDataSource;
    this.relationshipsDataSource = relatioshipsDataSource;
  }

  private async buildInheritedInformation(property: RelationshipProperty, entity: Entity) {
    if (property.denormalizedProperty) {
      const denormalizedProperty = await this.templatesDataSource.getPropertyByName(
        property.denormalizedProperty
      );

      return {
        inheritedValue: entity.metadata[denormalizedProperty.name] ?? [],
        inheritedType: denormalizedProperty.type,
      };
    }
    return {};
  }

  private async transformToDenormalizedData(
    property: RelationshipProperty,
    queryResult: Entity[]
  ): Promise<MetadataValue[]> {
    return Promise.all(
      queryResult.map(async entity => ({
        value: entity.sharedId,
        label: entity.title,
        ...(await this.buildInheritedInformation(property, entity)),
      }))
    );
  }

  async update(sharedId: string) {
    let template: Template;
    await this.entitiesDataSource.getByIds([sharedId]).forEach(async entity => {
      if (!template) {
        const foundTemplate = await this.templatesDataSource.getById(entity.template);
        if (!foundTemplate) {
          throw new Error('Template does not exist');
        }
        template = foundTemplate;
      }

      const metadataToUpdate: Record<string, MetadataValue[]> = {};

      await Promise.all(
        template.properties.map(async property => {
          if (
            property instanceof RelationshipProperty &&
            entity.obsoleteMetadata.includes(property.name)
          ) {
            const results = await this.relationshipsDataSource
              .getByQuery(
                new MatchQueryNode({ sharedId: entity.sharedId }, property.query),
                entity.language
              )
              .all();

            metadataToUpdate[property.name] = await this.transformToDenormalizedData(
              property,
              results
            );
          }
        })
      );

      await this.entitiesDataSource.updateObsoleteMetadataValues(entity._id, metadataToUpdate);
    });
  }
}
