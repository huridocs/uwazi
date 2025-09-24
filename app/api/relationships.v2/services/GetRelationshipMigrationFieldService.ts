// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/Transac... Remove this comment to see the full error message
import { TransactionManager } from '../common.v2/contracts/TransactionManager.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/contracts/Temp... Remove this comment to see the full error message
import { TemplatesDataSource } from 'api/templates.v2/contracts/TemplatesDataSource.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.v2/model/V1Relati... Remove this comment to see the full error message
import { V1RelationshipProperty } from 'api/templates.v2/model/V1RelationshipProperty.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/data_utils/object... Remove this comment to see the full error message
import { objectIndex } from 'shared/data_utils/objectIndex.js';
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
      // @ts-expect-error TS(7006): Parameter 'p' implicitly has an 'any' type.
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
      // @ts-expect-error TS(7006): Parameter 'i' implicitly has an 'any' type.
      i => i.id.stringHash,
      // @ts-expect-error TS(7006): Parameter 'i' implicitly has an 'any' type.
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
    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    return Object.values(indexed).map(f => f.flatten());
  }
}

export { GetRelationshipMigrationFieldService };
