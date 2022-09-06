import { EntitiesDataSource } from '../database/EntitiesDataSource';
import { RelationshipsDataSource } from '../database/RelationshipsDataSource';
import { RelationshipTypesDataSource } from '../database/RelationshipTypesDataSource';
import { Relationship } from '../model/Relationship';
import { TransactionManager } from './TransactionManager';

export class CreateRelationshipService {
  private relationshipsDS: RelationshipsDataSource;

  private entitiesDS: EntitiesDataSource;

  private transactionManager: TransactionManager;

  private relationshipTypesDS: RelationshipTypesDataSource;

  constructor(
    relationshipsDS: RelationshipsDataSource,
    relationshipTypesDS: RelationshipTypesDataSource,
    entitiesDS: EntitiesDataSource,
    transactionManager: TransactionManager
  ) {
    this.relationshipsDS = relationshipsDS;
    this.relationshipTypesDS = relationshipTypesDS;
    this.entitiesDS = entitiesDS;
    this.transactionManager = transactionManager;
  }

  async create(from: string, to: string, type: string) {
    return this.transactionManager.run(
      async (entitiesDS, relationshipsDS, relationshipTypesDS) => {
        if (from === to) {
          throw new Error('Cannot create relationship to itself');
        }
        if (!(await relationshipTypesDS.typesExist([type]))) {
          throw new Error('Must provide id for existing relationship type');
        }
        if (!(await entitiesDS.entitiesExist([from, to]))) {
          throw new Error('Must provide sharedIds from existing entities');
        }

        return relationshipsDS.insert(new Relationship(from, to, type));
      },
      this.entitiesDS,
      this.relationshipsDS,
      this.relationshipTypesDS
    );
  }
}
