import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { RelationshipMigrationFieldsDataSource } from '../contracts/RelationshipMigrationFieldsDataSource';
import {
  RelationShipMigrationFieldUniqueId,
  RelationshipMigrationField,
  RelationshipMigrationFieldInfo,
} from '../model/RelationshipMigrationField';
import {
  mapFieldIdToDBO,
  mapFieldInfoToDBO,
  mapFieldToApp,
} from './RelationshipMigrationFieldMappers';
import { RelationshipMigrationFieldDBO } from './schemas/relationshipMigrationFieldTypes';

class MongoRelationshipMigrationFieldsDataSource
  extends MongoDataSource
  implements RelationshipMigrationFieldsDataSource
{
  protected collectionName = 'relationshipMigrationFields';

  async get(
    sourceTemplate: string,
    relationType: string,
    targetTemplate: string
  ): Promise<RelationshipMigrationField> {
    const dbo = await this.getCollection().findOne({
      sourceTemplate: MongoIdHandler.mapToDb(sourceTemplate),
      relationType: MongoIdHandler.mapToDb(relationType),
      targetTemplate: MongoIdHandler.mapToDb(targetTemplate),
    });
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

  async upsert(field: RelationshipMigrationFieldInfo): Promise<void> {
    const mapped = mapFieldInfoToDBO(field);
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
