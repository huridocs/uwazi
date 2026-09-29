import {
  CsvImport,
  CsvImportDomain,
  CsvImportExtraction,
  CsvImportFailure,
  CsvImportFile,
  CsvImportFilesCleanup,
  CsvImportProgress,
  CsvImportStats,
  CsvImportStatus,
  CsvImportStorage,
} from '../../domain/CsvImport.js';

export type CsvImportRow = {
  _id: string;
  template_id: string;
  status: CsvImportStatus;
  created_by: string;
  created_at: number;
  updated_at: number;
  files_cleanup?: CsvImportFilesCleanup;
  file: CsvImportFile;
  storage?: CsvImportStorage;
  stats?: CsvImportStats;
  progress?: CsvImportProgress;
  extraction?: CsvImportExtraction;
  failure?: CsvImportFailure;
  row_errors?: unknown;
};

export class PostgresCsvImportMapper {
  static toDomain(row: CsvImportRow): CsvImport {
    return CsvImportDomain.from({
      id: row._id,
      templateId: row.template_id,
      status: row.status,
      createdBy: row.created_by,
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at),
      filesCleanup: row.files_cleanup,
      file: row.file,
      storage: row.storage,
      stats: row.stats,
      progress: row.progress,
      extraction: row.extraction,
      failure: row.failure,
      rowErrors: row.row_errors,
    });
  }

  static toRow(doc: CsvImport): CsvImportRow {
    const obj = doc.toObject();
    return {
      _id: obj.id,
      template_id: obj.templateId,
      status: obj.status,
      created_by: obj.createdBy,
      created_at: obj.createdAt,
      updated_at: obj.updatedAt,
      files_cleanup: obj.filesCleanup,
      file: obj.file,
      storage: obj.storage,
      stats: obj.stats,
      progress: obj.progress,
      extraction: obj.extraction,
      failure: obj.failure,
      row_errors: obj.rowErrors,
    };
  }
}
