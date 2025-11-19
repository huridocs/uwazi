import { MongoDataSource } from 'api/core/infrastructure/mongodb/common/MongoDataSource';
import { CsvThesauriPlanEntry } from '../../domain/CsvThesauriPlan';
import { CsvImportThesauriValues } from '../../domain/CsvImportThesauriValues';
import { CsvImportThesauriValuesDataSource } from '../../application/contracts/CsvImportThesauriValuesDataSource';
import { CsvImportThesauriValuesDBO } from '../schemas/CsvImportThesauriValuesTypes';

type GroupedPlan = {
  importId: string;
  thesaurusId: string;
  createdAt: number;
  entries: CsvThesauriPlanEntry[];
};

export class MongoCsvImportThesauriValuesDataSource
  extends MongoDataSource<CsvImportThesauriValuesDBO>
  implements CsvImportThesauriValuesDataSource
{
  protected collectionName = 'csv_import_thesauri_values';

  private static groupByThesaurus(
    importId: string,
    entries: CsvThesauriPlanEntry[],
    createdAt: number
  ): GroupedPlan[] {
    const grouped = new Map<string, CsvThesauriPlanEntry[]>();
    entries.forEach(entry => {
      const list = grouped.get(entry.thesaurusId) || [];
      list.push(entry);
      grouped.set(entry.thesaurusId, list);
    });

    return Array.from(grouped.entries()).map(([thesaurusId, groupedEntries]) => ({
      importId,
      thesaurusId,
      createdAt,
      entries: groupedEntries,
    }));
  }

  async replacePlan(
    importId: string,
    planEntries: CsvThesauriPlanEntry[],
    createdAt: number
  ): Promise<void> {
    await this.deleteByImport(importId);
    const grouped = MongoCsvImportThesauriValuesDataSource.groupByThesaurus(
      importId,
      planEntries,
      createdAt
    );
    if (!grouped.length) {
      return;
    }
    await this.getCollection().insertMany(grouped);
  }

  async getByImport(importId: string): Promise<CsvImportThesauriValues[]> {
    const docs = await this.getCollection()
      .find({ importId })
      .toArray();
    return docs.map(doc => ({
      importId: doc.importId,
      thesaurusId: doc.thesaurusId,
      createdAt: doc.createdAt,
      entries: doc.entries,
    }));
  }

  async deleteByImport(importId: string): Promise<void> {
    await this.getCollection().deleteMany({ importId });
  }
}

