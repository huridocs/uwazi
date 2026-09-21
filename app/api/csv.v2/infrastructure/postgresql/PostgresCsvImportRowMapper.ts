import { CsvImportRow } from '../../domain/CsvImportRow.js';

export type CsvImportRowRow = {
  _id: string;
  import_id: string;
  row_index: number;
  headers: string[];
  values: string[];
};

export class PostgresCsvImportRowMapper {
  static toDomain(row: CsvImportRowRow): CsvImportRow {
    return CsvImportRow.fromObject({
      id: row._id,
      importId: row.import_id,
      rowIndex: row.row_index,
      headers: row.headers,
      values: row.values,
    });
  }

  static toRow(row: CsvImportRow): CsvImportRowRow {
    return {
      _id: row.id,
      import_id: row.importId,
      row_index: row.rowIndex,
      headers: row.headers,
      values: row.values,
    };
  }
}
