import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { Db } from 'mongodb';
import { CsvImportRelationshipValuesDataSource } from '../../application/contracts/CsvImportRelationshipValuesDataSource.js';
import { CsvImportRelationshipValues } from '../../domain/CsvImportRelationshipValues.js';

type RelationshipValuesDBO = {
  importId: string;
  templateId: string;
  values: Array<{ label: string; matches: Array<{ sharedId: string; templateId: string }> }>;
  createdAt: number;
};

class MongoCsvImportRelationshipValuesDataSource
  extends MongoDataSource<RelationshipValuesDBO>
  implements CsvImportRelationshipValuesDataSource
{
  protected collectionName = 'csv_import_relationships_values';

  constructor(db: Db, transactionManager: MongoTransactionManager) {
    super(db, transactionManager);
  }

  async replaceValues(importId: string, docs: CsvImportRelationshipValues[]): Promise<void> {
    await this.getCollection().deleteMany({ importId });
    if (!docs.length) {
      return;
    }
    await this.getCollection().insertMany(docs.map(doc => doc.toPersistence()));
  }

  async getByImport(importId: string): Promise<CsvImportRelationshipValues[]> {
    const docs = await this.getCollection().find({ importId }).toArray();
    return docs.map(doc =>
      CsvImportRelationshipValues.create({
        importId: doc.importId,
        templateId: doc.templateId,
        values: doc.values,
        createdAt: doc.createdAt,
      })
    );
  }
}

export { MongoCsvImportRelationshipValuesDataSource };
