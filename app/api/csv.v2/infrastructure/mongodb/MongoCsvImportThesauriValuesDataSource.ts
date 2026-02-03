import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import {
  CsvImportThesauriAppliedValue,
  CsvImportThesauriValues,
} from '../../domain/CsvImportThesauriValues.js';
import { CsvImportThesauriValuesDataSource } from '../../application/contracts/CsvImportThesauriValuesDataSource.js';
import { CsvImportThesauriValuesDBO } from '../schemas/CsvImportThesauriValuesTypes.js';

export class MongoCsvImportThesauriValuesDataSource
  extends MongoDataSource<CsvImportThesauriValuesDBO>
  implements CsvImportThesauriValuesDataSource
{
  protected collectionName = 'csv_import_thesauri_values';

  async replacePendingValues(
    importId: string,
    pendingValues: CsvImportThesauriValues[]
  ): Promise<void> {
    await this.deleteByImport(importId);
    if (!pendingValues.length) {
      return;
    }
    const docs: CsvImportThesauriValuesDBO[] = pendingValues.map(pendingDoc =>
      pendingDoc.toObject()
    );
    await this.getCollection().insertMany(docs);
  }

  async getByImport(importId: string): Promise<CsvImportThesauriValues[]> {
    const docs = await this.getCollection().find({ importId }).toArray();
    return docs.map(doc =>
      CsvImportThesauriValues.create({
        importId: doc.importId,
        thesaurusId: doc.thesaurusId,
        createdAt: doc.createdAt,
        entries: doc.entries,
        appliedAt: doc.appliedAt,
        appliedValues: doc.appliedValues,
        stats: doc.stats,
      })
    );
  }

  async deleteByImport(importId: string): Promise<void> {
    await this.getCollection().deleteMany({ importId });
  }

  async markAsApplied(input: {
    importId: string;
    thesaurusId: string;
    appliedAt: number;
    appliedValues: CsvImportThesauriAppliedValue[];
    stats: { valuesObserved: number; valuesCreated: number };
  }): Promise<void> {
    const { importId, thesaurusId, appliedAt, appliedValues, stats } = input;
    await this.getCollection().updateOne(
      { importId, thesaurusId },
      {
        $set: {
          appliedAt,
          appliedValues,
          stats,
        },
      }
    );
  }
}
