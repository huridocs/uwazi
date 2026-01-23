import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';

import { MongoResultSet } from '#api/core/infrastructure/mongodb/common/MongoResultSet.js';
import { RelationshipMigrationFieldsDataSource } from '#api/relationships.v2/contracts/RelationshipMigrationFieldsDataSource.js';
import {
  RelationshipMigrationFieldUniqueId,
  RelationshipMigrationField,
} from '#api/relationships.v2/model/RelationshipMigrationField.js';
import {
  mapFieldIdToDBO,
  mapFieldToApp,
  mapFieldToDBO,
} from '#api/relationships.v2/database/RelationshipMigrationFieldMappers.js';
import { RelationshipMigrationFieldDBO } from '#api/relationships.v2/database/schemas/relationshipMigrationFieldTypes.js';

class MongoRelationshipMigrationFieldsDataSource
  extends MongoDataSource<RelationshipMigrationFieldDBO>
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

  async delete(fieldId: RelationshipMigrationFieldUniqueId): Promise<void> {
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
