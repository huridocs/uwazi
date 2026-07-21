import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { DeprecatedEntitiesDataSource } from '#api/entities.v2/contracts/DeprecatedEntitiesDataSource.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { RelationshipProperty } from '../model/RelationshipProperty.js';
import { DeprecatedEntity } from '#api/entities.v2/model/Entity.js';
import { RelationshipsDataSource } from '../contracts/RelationshipsDataSource.js';
import { MatchQueryNode } from '../model/MatchQueryNode.js';
import { RelationshipPropertyUpdateStrategy } from './propertyUpdateStrategies/RelationshipPropertyUpdateStrategy.js';

interface IndexEntitiesCallback {
  (sharedIds: string[]): Promise<void>;
}

export class DenormalizationService {
  private relationshipsDS: RelationshipsDataSource;

  private entitiesDS: DeprecatedEntitiesDataSource;

  private settingsDS: SettingsDataSource;

  private transactionManager: TransactionManager;

  private indexEntities: IndexEntitiesCallback;

  private updateStrategy: RelationshipPropertyUpdateStrategy;

  constructor(
    relationshipsDS: RelationshipsDataSource,
    entitiesDS: DeprecatedEntitiesDataSource,
    settingsDS: SettingsDataSource,
    transactionManager: TransactionManager,
    indexEntitiesCallback: IndexEntitiesCallback,
    updateStrategy: RelationshipPropertyUpdateStrategy
  ) {
    this.relationshipsDS = relationshipsDS;
    this.entitiesDS = entitiesDS;
    this.settingsDS = settingsDS;
    this.transactionManager = transactionManager;
    this.indexEntities = indexEntitiesCallback;
    this.updateStrategy = updateStrategy;
  }

  private async getCandidateEntities(
    invertQueryCallback: (property: RelationshipProperty) => MatchQueryNode[],
    language: string,
    relatedEntities: DeprecatedEntity[] = []
  ) {
    // this method was removed from templatesDS since its only used here and this module is deprecated and not used
    // const properties = await this.templatesDS.getAllRelationshipProperties();
    const properties: RelationshipProperty[] = [];
    const entities: { sharedId: string; property: string }[] = [];
    await Promise.all(
      properties.map(async property => {
        relatedEntities.forEach(re => {
          if (property.template === re.template) {
            entities.push({
              sharedId: re.sharedId,
              property: property.name,
            });
          }
        });

        return Promise.all(
          invertQueryCallback(property).map(async query => {
            await this.relationshipsDS.getByQuery(query, language).forEach(async entity => {
              entities.push({
                sharedId: entity.sharedId,
                property: property.name,
              });
            });
          })
        );
      })
    );

    return entities;
  }

  private async getCandidateEntitiesForRelationship(_id: string, language: string) {
    const relationship = await this.relationshipsDS.getById([_id]).first();

    if (!relationship) throw new Error('missing relationship');

    const relatedEntities = await this.entitiesDS
      .getByIds([relationship.from.entity, relationship.to.entity])
      .all();

    return this.getCandidateEntities(
      property => property.buildQueryInvertedFromRelationship(relationship, relatedEntities),
      language,
      relatedEntities
    );
  }

  private async getCandidateEntitiesForEntity(sharedId: string, language: string) {
    const entity = await this.entitiesDS.getByIds([sharedId]).first();
    if (!entity) throw new Error('missing entity');
    return this.getCandidateEntities(
      property => property.buildQueryInvertedFromEntity(entity),
      language
    );
  }

  private async getCandidateEntitiesForTemplate(templateId: string, propertyNames: string[]) {
    const entities = await this.entitiesDS.getIdsByTemplate(templateId).all();
    return entities.map(entity => ({ sharedId: entity, properties: propertyNames }));
  }

  private async invalidateMetadataCacheForTemplate(templateIds: string[], propertyNames: string[]) {
    return this.entitiesDS.markMetadataAsChanged(
      templateIds.map(templateId => ({ template: templateId, properties: propertyNames }))
    );
  }

  private async runQueriesAndInvalidateMetadataCaches<Id>(
    ids: Id[],
    findCandidatesCallback: (id: Id) => Promise<
      (
        | {
            sharedId: string;
            property: string;
          }
        | {
            sharedId: string;
            properties: string[];
          }
      )[]
    >,
    invalidateMetadataCacheCallback?: (id: Id[]) => Promise<void>,
    updatePropertiesCallback?: (id: Id[]) => Promise<void>
  ) {
    const candidates = (await Promise.all(ids.map(async id => findCandidatesCallback(id)))).flat();

    if (invalidateMetadataCacheCallback) {
      await invalidateMetadataCacheCallback(ids);
    } else {
      await this.entitiesDS.markMetadataAsChanged(candidates);
    }

    this.transactionManager.onCommitted(async () => {
      if (updatePropertiesCallback) {
        await updatePropertiesCallback(ids);
      } else {
        await this.updateStrategy.update(candidates.map(c => c.sharedId));
      }
    });
  }

  private async updateDenormalizedMetadataDirectly(changedEntityIds: string[], language: string) {
    // this method was removed from templatesDS since its only used here and this module is deprecated and not used
    // const relationshipProperties = await this.templatesDataSource.getAllRelationshipProperties();
    const relationshipProperties: RelationshipProperty[] = [];
    const relationshipPropertyNames = relationshipProperties.map(property => property.name);

    await this.entitiesDS.getByIds(changedEntityIds, language).forEach(async entity => {
      const newValuesForProperties = relationshipProperties.map(property => ({
        propertyName: property.name,
        ...(property.denormalizedProperty
          ? { value: entity.metadata[property.denormalizedProperty] }
          : {}),
      }));

      await this.entitiesDS.updateDenormalizedMetadataValues(
        entity.sharedId,
        language,
        entity.title,
        newValuesForProperties
      );
    });

    const affectedEntities = await this.entitiesDS
      .getByDenormalizedId(relationshipPropertyNames, changedEntityIds)
      .all();

    this.transactionManager.onCommitted(async () => {
      await this.indexEntities(affectedEntities);
    });
  }

  async denormalizeAfterCreatingRelationships(relationshipIds: string[]) {
    const defaultLanguage = await this.settingsDS.getDefaultLanguageKey();
    return this.runQueriesAndInvalidateMetadataCaches(relationshipIds, async id =>
      this.getCandidateEntitiesForRelationship(id, defaultLanguage)
    );
  }

  async denormalizeAfterUpdatingEntities(entityIds: string[], language: string) {
    return this.updateDenormalizedMetadataDirectly(entityIds, language);
  }

  async denormalizeBeforeDeletingFiles(fileIds: string[]) {
    const defaultLanguage = await this.settingsDS.getDefaultLanguageKey();
    const relationships = await this.relationshipsDS.getByFiles(fileIds).all();
    return this.runQueriesAndInvalidateMetadataCaches(
      relationships.map(r => r._id),
      async id => this.getCandidateEntitiesForRelationship(id, defaultLanguage)
    );
  }

  async denormalizeBeforeDeletingRelationships(relationshipIds: string[]) {
    const defaultLanguage = await this.settingsDS.getDefaultLanguageKey();
    return this.runQueriesAndInvalidateMetadataCaches(relationshipIds, async id =>
      this.getCandidateEntitiesForRelationship(id, defaultLanguage)
    );
  }

  async denormalizeAfterCreatingEntities(entityIds: string[], language: string) {
    return this.runQueriesAndInvalidateMetadataCaches(entityIds, async id =>
      this.getCandidateEntitiesForEntity(id, language)
    );
  }

  async denormalizeAfterCreatingOrUpdatingProperty(templateId: string, propertyNames: string[]) {
    return this.runQueriesAndInvalidateMetadataCaches(
      [templateId],
      async id => this.getCandidateEntitiesForTemplate(id, propertyNames),
      async () => this.invalidateMetadataCacheForTemplate([templateId], propertyNames),
      async () => this.updateStrategy.updateByTemplate(templateId)
    );
  }
}
