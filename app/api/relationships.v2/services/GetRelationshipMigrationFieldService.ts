import { TransactionManager } from 'api/common.v2/contracts/TransactionManager';
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource';
import { V1RelationshipProperty } from 'api/templates.v2/model/V1RelationshipProperty';
import { objectIndex } from 'shared/data_utils/objectIndex';
import { RelationshipMigrationFieldsDataSource } from '../contracts/RelationshipMigrationFieldsDataSource';
import {
  RelationshipMigrationFieldUniqueId,
  RelationshipMigrationField,
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
    fields = await this.fieldDS.getAll().all();
    return fields;
  }

  async getAllCombinedWithInferred() {
    const allV1Properties = (await this.templatesDS.getAllProperties().all()).filter(
      p => p instanceof V1RelationshipProperty
    ) as V1RelationshipProperty[];
    const allV1Info = allV1Properties.map(
      p =>
        new RelationshipMigrationField(
          new RelationshipMigrationFieldUniqueId(p.template, p.relationType, p.content),
          false,
          true
        )
    );
    const indexed = objectIndex(
      allV1Info,
      i => i.id.stringHash,
      i => i
    );

    const fieldsInDb = await this.getAll();
    fieldsInDb.forEach(f => {
      if (f.id.stringHash in indexed) {
        indexed[f.id.stringHash].ignored = f.ignored;
      } else {
        indexed[f.id.stringHash] = f;
      }
    });
    return Object.values(indexed).map(f => f.flatten());
  }
}

export { GetRelationshipMigrationFieldService };
