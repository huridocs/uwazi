import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { RelationshipMigrationFieldsDataSource } from '../contracts/RelationshipMigrationFieldsDataSource';
import { RelationShipMigrationFieldUniqueId } from '../model/RelationshipMigrationField';

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
    targetTemplate: string
  ): Promise<void> {
    await this.transactionManager.run(async () => {
      const fieldId = new RelationShipMigrationFieldUniqueId(
        sourceTemplate,
        relationType,
        targetTemplate
      );
      await this.fieldDS.delete(fieldId);
    });
  }
}

export { DeleteRelationshipMigrationFieldService };
