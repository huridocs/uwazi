export interface CsvImportRowErrorDBO {
  _id?: any;
  importId: string;
  rowIndex: number;
  message: string;
  createdAt: number;
}
