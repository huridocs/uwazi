// @ts-expect-error TS(2307): Cannot find module '../relationships.v2/model/Matc... Remove this comment to see the full error message
import { MatchQueryNode } from '../relationships.v2/model/MatchQueryNode.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Template... Remove this comment to see the full error message
import { Template } from 'api/templates.v2/model/Template.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/Relation... Remove this comment to see the full error message
import { RelationshipProperty } from 'api/templates.v2/model/RelationshipProperty.js';
// @ts-expect-error TS(2307): Cannot find module '../relationships.v2/contracts/... Remove this comment to see the full error message
import { RelationshipsDataSource } from '../relationships.v2/contracts/RelationshipsDataSource.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/contracts/Temp... Remove this comment to see the full error message
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource.js';
import { Entity, EntityMetadata } from '../model/Entity';
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
  ): Promise<EntityMetadata[]> {
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
    // @ts-expect-error TS(7006): Parameter 'entity' implicitly has an 'any' type.
    await this.entitiesDataSource.getByIds(sharedIds).forEach(async entity => {
      template = await this.findTemplate(template, entity.template);

      const metadataToUpdate: Record<string, EntityMetadata[]> = {};

      await Promise.all(
        // @ts-expect-error TS(7006): Parameter 'property' implicitly has an 'any' type.
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
