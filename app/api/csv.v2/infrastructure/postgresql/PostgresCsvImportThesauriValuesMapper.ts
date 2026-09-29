import { CsvImportThesauriValues } from '../../domain/CsvImportThesauriValues.js';
import { CsvThesauriPendingEntry } from '../../domain/CsvThesauriPendingValues.js';

export type CsvImportThesauriValuesRow = {
  _id: string;
  import_id: string;
  thesaurus_id: string;
  entries: CsvThesauriPendingEntry[];
  created_at: number;
  applied_at?: number;
  applied_values?: CsvImportThesauriValues['appliedValues'];
  stats?: CsvImportThesauriValues['stats'];
};

export class PostgresCsvImportThesauriValuesMapper {
  static toDomain(row: CsvImportThesauriValuesRow): CsvImportThesauriValues {
    return CsvImportThesauriValues.create({
      id: row._id,
      importId: row.import_id,
      thesaurusId: row.thesaurus_id,
      entries: row.entries,
      createdAt: Number(row.created_at),
      appliedAt: row.applied_at === undefined ? undefined : Number(row.applied_at),
      appliedValues: row.applied_values,
      stats: row.stats,
    });
  }

  static toRow(pending: CsvImportThesauriValues): CsvImportThesauriValuesRow {
    const obj = pending.toObject();
    return {
      _id: obj.id,
      import_id: obj.importId,
      thesaurus_id: obj.thesaurusId,
      entries: obj.entries,
      created_at: obj.createdAt,
      applied_at: obj.appliedAt,
      applied_values: obj.appliedValues,
      stats: obj.stats,
    };
  }
}
