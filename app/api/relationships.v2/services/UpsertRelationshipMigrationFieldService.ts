import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { RelationshipMigrationFieldsDataSource } from '#api/relationships.v2/contracts/RelationshipMigrationFieldsDataSource.js';
import {
  RelationshipMigrationFieldUniqueId,
  RelationshipMigrationField,
} from '#api/relationships.v2/model/RelationshipMigrationField.js';

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
