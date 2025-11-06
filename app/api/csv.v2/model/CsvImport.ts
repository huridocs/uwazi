export type CsvImportStatus =
  | 'queued'
  | 'validating'
  | 'extracting files'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

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
    templateId: string;
    file: CsvImportFile;
    createdBy: string;
  }): Omit<CsvImport, 'id'> {
    const now = Date.now();
    const { templateId, file, createdBy } = input;

    if (!templateId) throw new Error('templateId is required');
    if (!file?.originalName || !file?.mimeType || !Number.isFinite(file?.size)) {
      throw new Error('file metadata is invalid');
    }

    return {
      templateId,
      file,
      status: 'queued',
      createdBy,
      createdAt: now,
      updatedAt: now,
    };
  }
}
