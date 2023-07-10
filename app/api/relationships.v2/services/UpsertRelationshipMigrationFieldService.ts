import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { RelationshipMigrationFieldsDataSource } from '../contracts/RelationshipMigrationFieldsDataSource';
import { RelationshipMigrationField } from '../model/RelationshipMigrationField';

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
    id: string,
    sourceTemplate: string,
    relationType: string,
    targetTemplate: string,
    ignored: boolean = false
  ) {
    const field = new RelationshipMigrationField(
      id,
      sourceTemplate,
      relationType,
      targetTemplate,
      ignored
    );
    let upsertedField: RelationshipMigrationField = field;
    await this.transactionManager.run(async () => {
      await this.fieldDS.upsert(field);
      upsertedField = await this.fieldDS.get(sourceTemplate, relationType, targetTemplate);
    });
    return upsertedField;
  }
}

export { UpsertRelationshipMigrationFieldService };
