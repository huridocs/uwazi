enum CsvImportStatus {
  Queued = 'queued',
  Validating = 'validating',
  ExtractingFiles = 'extracting files',
  ExtractingFilesDone = 'extracting files:done',
  PreflightThesauri = 'preflight:thesauri',
  PreflightThesauriDone = 'preflight:thesauri:done',
  PreflightThesauriCreate = 'preflight:thesauri:create',
  PreflightThesauriCreateDone = 'preflight:thesauri:create:done',
  ImportEntities = 'import:entities',
  ImportEntitiesDone = 'import:entities:done',
  Retrying = 'retrying',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

type CsvImportStorage = {
  path: string;
  provider?: string;
  etag?: string;
  checksum?: string;
};

type CsvImportFile = {
  originalName: string;
  mimeType: string;
  size: number;
};

type CsvImportToCreate = {
  templateId: string;
  file: CsvImportFile;
  status: CsvImportStatus;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
};

type CsvImportFailureIssue = {
  reason: string;
  message: string;
  property?: string;
  columns?: string[];
};

type CsvImportStats = {
  thesaurusValuesObserved?: number;
  thesaurusValuesCreated?: number;
  thesauriTouched?: number;
  entitiesCreated?: number;
};

type CsvImportFailure = {
  message: string;
  retryable: boolean;
  at: number;
  stage: string;
  code?: string;
  issues?: CsvImportFailureIssue[];
};

type CsvImportProps = CsvImportToCreate & {
  id: string;
  storage?: CsvImportStorage;
  rowErrors?: any;
  stats?: CsvImportStats;
  failure?: CsvImportFailure;
};

class CsvImportDomain {
  readonly id!: string;

  readonly templateId!: string;

  readonly file!: CsvImportFile;

  readonly status!: CsvImportStatus;

  readonly createdBy!: string;

  readonly createdAt!: number;

  readonly updatedAt!: number;

  readonly storage?: CsvImportStorage;

  readonly rowErrors?: any;

  readonly stats?: CsvImportStats;

  readonly failure?: CsvImportFailure;

  private constructor(props: CsvImportProps) {
    Object.assign(this, props);
  }

  static create(input: { id: string; templateId: string; file: CsvImportFile; createdBy: string }) {
    const now = Date.now();

    if (!input.templateId) {
      throw new Error('templateId is required');
    }
    if (!input.file?.originalName || !input.file?.mimeType || !Number.isFinite(input.file?.size)) {
      throw new Error('file metadata is invalid');
    }

    return new CsvImportDomain({
      ...input,
      status: CsvImportStatus.Queued,
      createdAt: now,
      updatedAt: now,
    });
  }

  static from(existing: CsvImportProps) {
    return new CsvImportDomain(existing);
  }

  withStorage(path: string) {
    return this.clone({
      storage: { path },
      updatedAt: Date.now(),
    });
  }

  withStatus(status: CsvImportStatus) {
    return this.clone({
      status,
      updatedAt: Date.now(),
    });
  }

  withStats(stats: CsvImportStats) {
    return this.clone({
      stats,
      updatedAt: Date.now(),
    });
  }

  withFailure(failure: CsvImportFailure) {
    return this.clone({
      failure,
      updatedAt: Date.now(),
    });
  }

  clearFailure() {
    return this.clone({
      failure: undefined,
      updatedAt: Date.now(),
    });
  }

  toObject() {
    return {
      id: this.id,
      templateId: this.templateId,
      file: this.file,
      status: this.status,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      storage: this.storage,
      rowErrors: this.rowErrors,
      stats: this.stats,
      failure: this.failure,
    };
  }

  private clone(overrides: Partial<CsvImportProps>) {
    return new CsvImportDomain({
      ...this.toObject(),
      ...overrides,
    });
  }

  static withStorage(csvImport: CsvImport | CsvImportDomain, path: string) {
    return CsvImportDomain.toDomain(csvImport).withStorage(path);
  }

  static withStatus(csvImport: CsvImport | CsvImportDomain, status: CsvImportStatus) {
    return CsvImportDomain.toDomain(csvImport).withStatus(status);
  }

  static withFailure(csvImport: CsvImport | CsvImportDomain, failure: CsvImportFailure) {
    return CsvImportDomain.toDomain(csvImport).withFailure(failure);
  }

  static clearFailure(csvImport: CsvImport | CsvImportDomain) {
    return CsvImportDomain.toDomain(csvImport).clearFailure();
  }

  private static toDomain(csvImport: CsvImport | CsvImportDomain) {
    return csvImport instanceof CsvImportDomain ? csvImport : CsvImportDomain.from(csvImport);
  }
}

type CsvImport = CsvImportDomain;

export { CsvImportStatus, CsvImportDomain };
export type {
  CsvImport,
  CsvImportStorage,
  CsvImportFile,
  CsvImportToCreate,
  CsvImportFailureIssue,
  CsvImportStats,
  CsvImportFailure,
};
