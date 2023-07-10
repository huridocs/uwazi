import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';
import { RelationshipMigrationFieldsDataSource } from '../contracts/RelationshipMigrationFieldsDataSource';
import { RelationshipMigrationField } from '../model/RelationshipMigrationField';
import { mapFieldToApp, mapFieldToDBO } from './RelationshipMigrationFieldMappers';
import { RelationshipMigrationFieldDBO } from './schemas/relationshipMigrationFieldTypes';

class MongoRelationshipMigrationFieldsDataSource
  extends MongoDataSource
  implements RelationshipMigrationFieldsDataSource
{
  protected collectionName = 'relationshipMigrationFields';

  getAll(): MongoResultSet<RelationshipMigrationFieldDBO, RelationshipMigrationField> {
    const cursor = this.getCollection().find();
    return new MongoResultSet<RelationshipMigrationFieldDBO, RelationshipMigrationField>(
      cursor,
      mapFieldToApp
    );
  }

  async delete(id: string): Promise<void> {
    await this.getCollection().deleteOne({ _id: MongoIdHandler.mapToDb(id) });
  }

  async upsert(field: RelationshipMigrationField): Promise<void> {
    const mapped = mapFieldToDBO(field);
    await this.getCollection().updateOne(
      {
        sourceTemplate: mapped.sourceTemplate,
        relationType: mapped.relationType,
        targetTemplate: mapped.targetTemplate,
      },
      { $set: { ...mapFieldToDBO(field) } },
      { upsert: true }
    );
  }
}

export { MongoRelationshipMigrationFieldsDataSource };
