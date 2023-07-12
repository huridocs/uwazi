import { IdGenerator } from 'api/common.v2/contracts/IdGenerator';
import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { RelationshipMigrationFieldsDataSource } from '../contracts/RelationshipMigrationFieldsDataSource';
import {
  RelationshipMigrationField,
  RelationshipMigrationFieldInfo,
} from '../model/RelationshipMigrationField';

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
    sourceTemplate: string,
    relationType: string,
    targetTemplate?: string,
    ignored: boolean = false
  ) {
    const fieldInfo = new RelationshipMigrationFieldInfo(
      sourceTemplate,
      relationType,
      targetTemplate,
      ignored
    );
    let upsertedField: RelationshipMigrationField | null = null;
    await this.transactionManager.run(async () => {
      await this.fieldDS.upsert(fieldInfo);
      upsertedField = await this.fieldDS.get(fieldInfo);
    });
    return upsertedField;
  }
}

export { UpsertRelationshipMigrationFieldService };
