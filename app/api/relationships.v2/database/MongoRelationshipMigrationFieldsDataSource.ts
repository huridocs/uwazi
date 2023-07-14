import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { RelationshipMigrationFieldsDataSource } from '../contracts/RelationshipMigrationFieldsDataSource';
import {
  RelationShipMigrationFieldUniqueId,
  RelationshipMigrationField,
} from '../model/RelationshipMigrationField';
import { mapFieldIdToDBO, mapFieldToApp, mapFieldToDBO } from './RelationshipMigrationFieldMappers';
import { RelationshipMigrationFieldDBO } from './schemas/relationshipMigrationFieldTypes';

class MongoRelationshipMigrationFieldsDataSource
  extends MongoDataSource<RelationshipMigrationFieldDBO>
  implements RelationshipMigrationFieldsDataSource
{
  protected collectionName = 'relationshipMigrationFields';

  async get(fieldId: RelationShipMigrationFieldUniqueId): Promise<RelationshipMigrationField> {
    const dbo = await this.getCollection().findOne({ ...mapFieldIdToDBO(fieldId) });
    if (!dbo) {
      throw new Error(`Field with id ${fieldId} not found`);
    }
    return mapFieldToApp(dbo);
  }

  getAll(): MongoResultSet<RelationshipMigrationFieldDBO, RelationshipMigrationField> {
    const cursor = this.getCollection().find();
    return new MongoResultSet<RelationshipMigrationFieldDBO, RelationshipMigrationField>(
      cursor,
      mapFieldToApp
    );
  }

  async delete(fieldId: RelationShipMigrationFieldUniqueId): Promise<void> {
    await this.getCollection().deleteOne({ ...mapFieldIdToDBO(fieldId) });
  }

  async create(field: RelationshipMigrationField): Promise<void> {
    const mapped = mapFieldToDBO(field);
    await this.getCollection().insertOne(mapped);
  }

  async upsert(field: RelationshipMigrationField): Promise<void> {
    const mapped = mapFieldToDBO(field);
    await this.getCollection().updateOne(
      {
        sourceTemplate: mapped.sourceTemplate,
        relationType: mapped.relationType,
        targetTemplate: mapped.targetTemplate,
      },
      {
        $set: {
          sourceTemplate: mapped.sourceTemplate,
          relationType: mapped.relationType,
          targetTemplate: mapped.targetTemplate,
          ignored: mapped.ignored,
        },
      },
      { upsert: true }
    );
  }
}

export { MongoRelationshipMigrationFieldsDataSource };
