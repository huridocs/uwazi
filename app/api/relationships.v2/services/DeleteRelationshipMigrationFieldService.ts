import { TransactionManager } from '#api/core/application/contracts/TransactionManager.js';
import { RelationshipMigrationFieldsDataSource } from '../contracts/RelationshipMigrationFieldsDataSource.js';
import { RelationshipMigrationFieldUniqueId } from '../model/RelationshipMigrationField.js';

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

  async delete(
    sourceTemplate: string,
    relationType: string,
    targetTemplate?: string
  ): Promise<void> {
    const fieldId = new RelationshipMigrationFieldUniqueId(
      sourceTemplate,
      relationType,
      targetTemplate
    );
    await this.transactionManager.run(async () => {
      await this.fieldDS.delete(fieldId);
    });
  }
}

export { DeleteRelationshipMigrationFieldService };
