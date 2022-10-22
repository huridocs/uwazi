import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { EventsBus } from 'api/eventsbus';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { RelationshipProperty } from 'api/templates.v2/model/RelationshipProperty';
import { RelationshipsDataSource } from '../contracts/RelationshipsDataSource';
import { RelationshipsCreatedEvent } from '../events/RelationshipsCreatedEvent';
import { MatchQueryNode } from '../model/MatchQueryNode';
import { Relationship } from '../model/Relationship';

export class DenormalizationService {
  private relationshipsDS: RelationshipsDataSource;

  private entitiesDS: EntitiesDataSource;

  private templatesDS: TemplatesDataSource;

  private transactionManager: TransactionManager;

  private eventsBus: EventsBus;

  constructor(
    relationshipsDS: RelationshipsDataSource,
    entitiesDS: EntitiesDataSource,
    templatesDS: TemplatesDataSource,
    transactionManager: TransactionManager,
    eventsBus: EventsBus
  ) {
    this.relationshipsDS = relationshipsDS;
    this.entitiesDS = entitiesDS;
    this.templatesDS = templatesDS;
    this.transactionManager = transactionManager;
    this.eventsBus = eventsBus;
  }

  private async getCandidateEntities(
    invertQueryCallback: (property: RelationshipProperty) => MatchQueryNode[],
    language: string
  ) {
    const properties = await this.templatesDS.getAllRelationshipProperties().all();

    const entities: any[] = [];
    await Promise.all(
      properties.map(async property =>
        Promise.all(
          invertQueryCallback(property).map(async query => {
            await this.relationshipsDS.getByQuery(query, language).forEach(result => {
              const entity = result.leaf() as { sharedId: string };
              return entities.push({
                ...entity,
                propertiesToBeMarked: [property.name],
              });
            });
          })
        )
      )
    );
    return entities;
  }

  async getCandidateEntitiesForRelationship(_id: string, language: string): Promise<any[]> {
    const relationship = await this.relationshipsDS.getById([_id]).first();

    if (!relationship) throw new Error('missing relationship');

    const relatedEntities = await this.entitiesDS
      .getByIds([relationship.from, relationship.to])
      .all();

    return this.getCandidateEntities(
      property => property.buildQueryInvertedFromRelationship(relationship, relatedEntities),
      language
    );
  }

  async getCandidateEntitiesForEntity(sharedId: string, language: string): Promise<any[]> {
    const entity = await this.entitiesDS.getByIds([sharedId]).first();
    if (!entity) throw new Error('missing entity');
    return this.getCandidateEntities(
      property => property.buildQueryInvertedFromEntity(entity),
      language
    );
  }

  async denormalizeForNewRelationships(relationships: Relationship[]) {
    const candidates = (
      await Promise.all(
        relationships.map(async rel =>
          this.getCandidateEntitiesForRelationship(
            rel._id,
            'en' // TODO: any language should be good in this case, could be default language as a standard
          )
        )
      )
    ).flat();

    await this.entitiesDS.markMetadataAsChanged(candidates);

    this.transactionManager.onCommitted(async () => {
      await this.eventsBus.emit(
        new RelationshipsCreatedEvent({
          relationships,
          markedEntities: candidates.map(c => c.sharedId),
        })
      );
    });
  }
}
