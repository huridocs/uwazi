import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { RelationshipProperty } from 'api/templates.v2/model/RelationshipProperty';
import { RelationshipsDataSource } from '../contracts/RelationshipsDataSource';
import { MatchQueryNode } from '../model/MatchQueryNode';

export class DenormalizationService {
  private relationshipsDS: RelationshipsDataSource;

  private entitiesDS: EntitiesDataSource;

  private templatesDS: TemplatesDataSource;

  constructor(
    relationshipsDS: RelationshipsDataSource,
    entitiesDS: EntitiesDataSource,
    templatesDS: TemplatesDataSource
  ) {
    this.relationshipsDS = relationshipsDS;
    this.entitiesDS = entitiesDS;
    this.templatesDS = templatesDS;
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
}
