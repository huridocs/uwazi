import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { RelationshipMigrationFieldsDataSource } from '../contracts/RelationshipMigrationFieldsDataSource';
import {
  RelationshipMigrationFieldUniqueId,
  RelationshipMigrationField,
} from '../model/RelationshipMigrationField';

class UpsertRelationshipMigrationFieldService {
  private transactionManager: TransactionManager;

  private fieldDS: RelationshipMigrationFieldsDataSource;

  constructor(
    transactionManager: TransactionManager,
    fieldDS: RelationshipMigrationFieldsDataSource
  ) {
    this.transactionManager = transactionManager;
    this.fieldDS = fieldDS;
  }

  async upsert(
    sourceTemplate: string,
    relationType: string,
    targetTemplate?: string,
    ignored: boolean = false
  ) {
    const field = new RelationshipMigrationField(
      new RelationshipMigrationFieldUniqueId(sourceTemplate, relationType, targetTemplate),
      ignored
    );
    await this.transactionManager.run(async () => {
      await this.fieldDS.upsert(field);
    });
    return field.flatten();
  }
}

export { UpsertRelationshipMigrationFieldService };
