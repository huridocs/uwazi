import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';
import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { RelationshipMigrationFieldsDataSource } from '../contracts/RelationshipMigrationFieldsDataSource';
import { RelationshipMigrationField } from '../model/RelationshipMigrationField';

class UpsertRelationshipMigrationFieldService {
  private transactionManager: TransactionManager;

  private fieldDS: RelationshipMigrationFieldsDataSource;

  private idGenerator: IdGenerator;

  constructor(
    transactionManager: TransactionManager,
    fieldDS: RelationshipMigrationFieldsDataSource,
    idGenerator: IdGenerator
  ) {
    this.transactionManager = transactionManager;
    this.fieldDS = fieldDS;
    this.idGenerator = idGenerator;
  }

  async upsert(
    id: string | undefined,
    sourceTemplate: string,
    relationType: string,
    targetTemplate: string,
    ignored: boolean = false
  ) {
    const field = new RelationshipMigrationField(
      id || this.idGenerator.generate(),
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
