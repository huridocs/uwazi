import { CsvImportRowError, RowErrorCode } from '../../domain/CsvImportRowError.js';

export type CsvImportRowErrorRow = {
  _id: string;
  import_id: string;
  row_index: number;
  message: string;
  code: RowErrorCode;
  property?: string;
  raw_value?: string;
  details?: Record<string, unknown>;
  created_at: number;
};

export class PostgresCsvImportRowErrorMapper {
  static toDomain(row: CsvImportRowErrorRow): CsvImportRowError {
    return CsvImportRowError.fromObject({
      id: row._id,
      importId: row.import_id,
      rowIndex: row.row_index,
      message: row.message,
      code: row.code,
      property: row.property,
      rawValue: row.raw_value,
      details: row.details,
      createdAt: Number(row.created_at),
    });
  }

  static toRow(error: CsvImportRowError): CsvImportRowErrorRow {
    return {
      _id: error.id,
      import_id: error.importId,
      row_index: error.rowIndex,
      message: error.message,
      code: error.code,
      property: error.property,
      raw_value: error.rawValue,
      details: error.details,
      created_at: error.createdAt,
    };
  }
}
