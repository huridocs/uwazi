import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { RelationshipMigrationFieldsDataSource } from '../contracts/RelationshipMigrationFieldsDataSource';

class DeleteRelationshipMigrationFieldService {
  private transactionManager: TransactionManager;

  private fieldDS: RelationshipMigrationFieldsDataSource;

  constructor(
    transactionManager: TransactionManager,
    fieldDS: RelationshipMigrationFieldsDataSource
  ) {
    this.transactionManager = transactionManager;
    this.fieldDS = fieldDS;
  }

  async delete(id: string): Promise<void> {
    await this.transactionManager.run(async () => {
      await this.fieldDS.delete(id);
    });
  }
}

export { DeleteRelationshipMigrationFieldService };
