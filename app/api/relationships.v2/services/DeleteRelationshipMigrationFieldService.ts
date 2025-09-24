// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/Transac... Remove this comment to see the full error message
import { TransactionManager } from '../common.v2/contracts/TransactionManager.js';
import { RelationshipMigrationFieldsDataSource } from '../contracts/RelationshipMigrationFieldsDataSource';
import { RelationshipMigrationFieldUniqueId } from '../model/RelationshipMigrationField';

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
