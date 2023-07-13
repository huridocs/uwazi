import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { RelationshipMigrationFieldsDataSource } from '../contracts/RelationshipMigrationFieldsDataSource';
import {
  RelationshipMigrationField,
  RelationshipMigrationFieldInfo,
} from '../model/RelationshipMigrationField';

class CreateRelationshipMigrationFieldService {
  private transactionManager: TransactionManager;

  private fieldDS: RelationshipMigrationFieldsDataSource;

  constructor(
    transactionManager: TransactionManager,
    fieldDS: RelationshipMigrationFieldsDataSource
  ) {
    this.transactionManager = transactionManager;
    this.fieldDS = fieldDS;
  }

  async create(
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
    let saved: RelationshipMigrationField | null = null;
    await this.transactionManager.run(async () => {
      await this.fieldDS.create(fieldInfo);
      saved = await this.fieldDS.get(fieldInfo);
    });
    return saved;
  }
}

export { CreateRelationshipMigrationFieldService };
