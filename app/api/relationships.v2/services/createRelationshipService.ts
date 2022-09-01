import { EntitiesDataSource } from '../database/EntitiesDataSource';
import { RelationshipsDataSource } from '../database/RelationshipsDataSource';
import { Relationship } from '../model/Relationship';
import { TransactionManager } from './TransactionManager';

export class CreateRelationshipService {
  private relationshipsDS: RelationshipsDataSource;

  private entitiesDS: EntitiesDataSource;

  private transactionManager: TransactionManager;

  constructor(
    relationshipsDS: RelationshipsDataSource,
    entitiesDS: EntitiesDataSource,
    transactionManager: TransactionManager
  ) {
    this.relationshipsDS = relationshipsDS;
    this.entitiesDS = entitiesDS;
    this.transactionManager = transactionManager;
  }

  async create(from: string, to: string) {
    return this.transactionManager.run(
      async (entitiesDS, relationshipsDS) => {
        if (from === to) {
          throw new Error('Cannot create relationship to itself');
        }
        if (!(await entitiesDS.entitiesExist([from, to]))) {
          throw new Error('Must provide sharedIds from existing entities');
        }

        return relationshipsDS.insert(new Relationship(from, to));
      },
      this.entitiesDS,
      this.relationshipsDS
    );
  }
}
