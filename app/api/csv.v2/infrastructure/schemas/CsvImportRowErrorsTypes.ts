import { RowErrorCode } from '../../domain/CsvImportRowError.js';

export interface CsvImportRowErrorDBO {
  _id?: any;
  importId: string;
  rowIndex: number;
  message: string;
  code: RowErrorCode;
  property?: string;
  rawValue?: string;
  details?: Record<string, unknown>;
  createdAt: number;
}
