import { Transactional } from 'api/common.v2/contracts/Transactional';
import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { EntitiesDataSource } from 'api/entities.v2/contracts/EntitiesDataSource';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { RelationshipProperty } from 'api/templates.v2/model/RelationshipProperty';
import { RelationshipsDataSource } from '../contracts/RelationshipsDataSource';
import { MatchQueryNode } from '../model/MatchQueryNode';

export class DenormalizationService implements Transactional {
  private relationshipsDS: RelationshipsDataSource;

  private entitiesDS: EntitiesDataSource;

  private templatesDS: TemplatesDataSource;

  private transactionManager: TransactionManager;

  private transactionContext?: unknown;

  constructor(
    relationshipsDS: RelationshipsDataSource,
    entitiesDS: EntitiesDataSource,
    templatesDS: TemplatesDataSource,
    transactionManager: TransactionManager
  ) {
    this.relationshipsDS = relationshipsDS;
    this.entitiesDS = entitiesDS;
    this.templatesDS = templatesDS;
    this.transactionManager = transactionManager;
  }

  setTransactionContext(context: unknown): void {
    this.transactionContext = context;
  }

  clearTransactionContext(): void {
    this.transactionContext = undefined;
  }

  private async inTransaction<T>(callback: () => Promise<T>) {
    return this.transactionManager.run<T>(
      callback,
      [this.relationshipsDS, this.entitiesDS, this.templatesDS],
      this.transactionContext
    );
  }

  private async getCandidateEntities(
    invertQueryCallback: (property: RelationshipProperty) => MatchQueryNode[]
  ) {
    const properties = await this.templatesDS.getAllRelationshipProperties().all();

    const entities: any[] = [];
    await Promise.all(
      properties.map(async property =>
        Promise.all(
          invertQueryCallback(property).map(async query => {
            const result = this.relationshipsDS.getByQuery(query);
            const leafEntities = (await result.all()).map(path => path[path.length - 1]);
            leafEntities.forEach(entity =>
              entities.push({
                ...entity,
                propertiesToBeMarked: [property.name],
              })
            );
          })
        )
      )
    );
    return entities;
  }

  async getCandidateEntitiesForRelationship(_id: string): Promise<any[]> {
    return this.inTransaction(async () => {
      const [relationship] = await this.relationshipsDS.getById([_id]).all();

      const relatedEntities = await this.entitiesDS
        .getByIds([relationship.from, relationship.to])
        .all();

      return this.getCandidateEntities(property =>
        property.buildQueryInvertedFromRelationship(relationship, relatedEntities)
      );
    });
  }

  async getCandidateEntitiesForEntity(sharedId: string): Promise<any[]> {
    return this.inTransaction(async () => {
      const [entity] = await this.entitiesDS.getByIds([sharedId]).all();
      return this.getCandidateEntities(property => property.buildQueryInvertedFromEntity(entity));
    });
  }
}
