import { MongoDataSource } from 'api/core/infrastructure/mongodb/common/MongoDataSource';
import { MongoTransactionManager } from 'api/core/infrastructure/mongodb/common/MongoTransactionManager';
import { Db } from 'mongodb';
import { CsvImportRelationshipPendingValuesDataSource } from '../../application/contracts/CsvImportRelationshipPendingValuesDataSource';
import { CsvImportRelationshipPendingValues } from '../../domain/CsvImportRelationshipPendingValues';

type RelationshipPendingValuesDBO = {
  importId: string;
  templateId: string;
  titles: string[];
  createdAt: number;
};

class MongoCsvImportRelationshipPendingValuesDataSource
  extends MongoDataSource<RelationshipPendingValuesDBO>
  implements CsvImportRelationshipPendingValuesDataSource
{
  protected collectionName = 'csv_import_relationships_pending_values';

  constructor(db: Db, transactionManager: MongoTransactionManager) {
    super(db, transactionManager);
  }

  async replacePendingValues(
    importId: string,
    docs: CsvImportRelationshipPendingValues[]
  ): Promise<void> {
    await this.getCollection().deleteMany({ importId });
    if (!docs.length) {
      return;
    }
    await this.getCollection().insertMany(docs.map(doc => doc.toPersistence()));
  }

  async getByImport(importId: string): Promise<CsvImportRelationshipPendingValues[]> {
    const docs = await this.getCollection().find({ importId }).toArray();
    return docs.map(doc =>
      CsvImportRelationshipPendingValues.create({
        importId: doc.importId,
        templateId: doc.templateId,
        titles: doc.titles,
        createdAt: doc.createdAt,
      })
    );
  }
}

export { MongoCsvImportRelationshipPendingValuesDataSource };
