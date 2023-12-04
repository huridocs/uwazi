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

  private async findTemplate(currentTemplate: Template | undefined, id: string) {
    if (currentTemplate?.id === id) return currentTemplate;

    const foundTemplate = await this.templatesDataSource.getById(id);
    if (!foundTemplate) {
      throw new Error('Template does not exist');
    }
    return foundTemplate;
  }

  async update(sharedIds: string[]) {
    let template: Template | undefined;
    await this.entitiesDataSource.getByIds(sharedIds).forEach(async entity => {
      template = await this.findTemplate(template, entity.template);

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

            console.trace({ results });

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
