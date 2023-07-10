import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { RelationshipMigrationFieldsDataSource } from '../contracts/RelationshipMigrationFieldsDataSource';
import { RelationshipMigrationField } from '../model/RelationshipMigrationField';

class GetRelationshipMigrationFieldService {
  private transactionManager: TransactionManager;

  private fieldDS: RelationshipMigrationFieldsDataSource;

  constructor(
    transactionManager: TransactionManager,
    fieldDS: RelationshipMigrationFieldsDataSource
  ) {
    this.transactionManager = transactionManager;
    this.fieldDS = fieldDS;
  }

  async getAll(): Promise<RelationshipMigrationField[]> {
    let fields: RelationshipMigrationField[] = [];
    await this.transactionManager.run(async () => {
      fields = await this.fieldDS.getAll().all();
    });
    return fields;
  }
}

export { GetRelationshipMigrationFieldService };
