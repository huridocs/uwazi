export enum CsvImportStatus {
  Queued = 'queued',
  Validating = 'validating',
  ExtractingFiles = 'extracting files',
  FilesExtracted = 'files extracted',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export type CsvImportStorage = {
  path: string;
  provider?: string;
  etag?: string;
  checksum?: string;
};

export type CsvImportFile = {
  originalName: string;
  mimeType: string;
  size: number;
};

export type CsvImportToCreate = {
  templateId: string;
  file: CsvImportFile;
  status: CsvImportStatus;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
};

export type CsvImport = CsvImportToCreate & {
  id: string;
  storage?: CsvImportStorage;
  rowErrors?: any; // intentionally flexible for MVP
};

export class CsvImportDomain {
  static create(input: {
    id: string;
    templateId: string;
    file: CsvImportFile;
    createdBy: string;
  }): CsvImport {
    const now = Date.now();
    const { id, templateId, file, createdBy } = input;

    if (!templateId) throw new Error('templateId is required');
    if (!file?.originalName || !file?.mimeType || !Number.isFinite(file?.size)) {
      throw new Error('file metadata is invalid');
    }

    return {
      id,
      templateId,
      file,
      status: CsvImportStatus.Queued,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };
  }

  static withStorage(csvImport: CsvImport, path: string): CsvImport {
    return {
      ...csvImport,
      storage: { path },
      updatedAt: Date.now(),
    };
  }

  static withStatus(csvImport: CsvImport, status: CsvImportStatus): CsvImport {
    return {
      ...csvImport,
      status,
      updatedAt: Date.now(),
    };
  }
}
