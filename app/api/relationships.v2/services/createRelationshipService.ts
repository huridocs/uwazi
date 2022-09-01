import { EntitiesDataSource } from '../database/EntitiesDataSource';
import { RelationshipsDataSource } from '../database/RelationshipsDataSource';
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
    return this.transactionManager.run(async () => {
      if (!(await this.entitiesDS.entitiesExist([from, to]))) {
        throw new Error('Must provide sharedIds from existing entities');
      }

      return this.relationshipsDS.insert({ from, to });
    });
  }
}
