import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { V1RelationshipProperty } from 'api/templates.v2/model/V1RelationshipProperty';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { RelationshipMigrationFieldsDataSource } from '../contracts/RelationshipMigrationFieldsDataSource';
import {
  RelationshipMigrationField,
  RelationshipMigrationFieldInfo,
} from '../model/RelationshipMigrationField';

class GetRelationshipMigrationFieldService {
  private transactionManager: TransactionManager;

  private fieldDS: RelationshipMigrationFieldsDataSource;

  private templatesDS: TemplatesDataSource;

  constructor(
    transactionManager: TransactionManager,
    fieldDS: RelationshipMigrationFieldsDataSource,
    templatesDS: TemplatesDataSource
  ) {
    this.transactionManager = transactionManager;
    this.fieldDS = fieldDS;
    this.templatesDS = templatesDS;
  }

  async getAll(): Promise<RelationshipMigrationField[]> {
    let fields: RelationshipMigrationField[] = [];
    await this.transactionManager.run(async () => {
      fields = await this.fieldDS.getAll().all();
    });
    return fields;
  }

  async getAllCombinedWithInferred() {
    const allV1Properties = (await this.templatesDS.getAllProperties().all()).filter(
      p => p instanceof V1RelationshipProperty
    ) as V1RelationshipProperty[];
    const allV1Info = allV1Properties.map(
      p => new RelationshipMigrationFieldInfo(p.template, p.relationType, p.content, false, true)
    );
    const indexed = objectIndex(
      allV1Info,
      i => i.stringHash,
      i => i
    );

    const fieldsInDb = await this.getAll();
    fieldsInDb.forEach(f => {
      if (f.stringHash in indexed) {
        indexed[f.stringHash].ignored = f.ignored;
      } else {
        indexed[f.stringHash] = f;
      }
    });
    return Object.values(indexed);
  }
}

export { GetRelationshipMigrationFieldService };
