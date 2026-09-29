import { CsvImportRelationshipPendingValues } from '../../domain/CsvImportRelationshipPendingValues.js';

export type CsvImportRelationshipPendingValuesRow = {
  _id: string;
  import_id: string;
  template_id: string;
  titles: string[];
  created_at: number;
};

export class PostgresCsvImportRelationshipPendingValuesMapper {
  static toDomain(row: CsvImportRelationshipPendingValuesRow): CsvImportRelationshipPendingValues {
    return CsvImportRelationshipPendingValues.create({
      id: row._id,
      importId: row.import_id,
      templateId: row.template_id,
      titles: row.titles,
      createdAt: Number(row.created_at),
    });
  }

  static toRow(pending: CsvImportRelationshipPendingValues): CsvImportRelationshipPendingValuesRow {
    const obj = pending.toPersistence();
    return {
      _id: obj.id,
      import_id: obj.importId,
      template_id: obj.templateId,
      titles: obj.titles,
      created_at: obj.createdAt,
    };
  }
}
