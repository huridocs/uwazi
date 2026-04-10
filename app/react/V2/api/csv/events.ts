const csvImportEvents = {
  importStart: 'csvImport:import:start',
  extractStart: 'csvImport:extract:start',
  extractProgress: 'csvImport:extract:progress',
  extractSuccess: 'csvImport:extract:success',
  extractError: 'csvImport:extract:error',
  preflightScanStart: 'csvImport:preflight:scan:start',
  preflightScanProgress: 'csvImport:preflight:scan:progress',
  preflightScanSuccess: 'csvImport:preflight:scan:success',
  preflightScanError: 'csvImport:preflight:scan:error',
  preflightThesauriCreateStart: 'csvImport:preflight:thesauri:create:start',
  preflightThesauriCreateProgress: 'csvImport:preflight:thesauri:create:progress',
  preflightThesauriCreateSuccess: 'csvImport:preflight:thesauri:create:success',
  preflightThesauriCreateError: 'csvImport:preflight:thesauri:create:error',
  preflightRelationshipsCreateStart: 'csvImport:preflight:relationships:create:start',
  preflightRelationshipsCreateProgress: 'csvImport:preflight:relationships:create:progress',
  preflightRelationshipsCreateSuccess: 'csvImport:preflight:relationships:create:success',
  preflightRelationshipsCreateError: 'csvImport:preflight:relationships:create:error',
  importProgress: 'csvImport:import:progress',
  importSuccess: 'csvImport:import:success',
  importError: 'csvImport:import:error',
} as const;

type CsvImportEventPayloads = {
  [csvImportEvents.importStart]: {
    importId: string;
  };
  [csvImportEvents.extractStart]: {
    importId: string;
  };
  [csvImportEvents.extractProgress]:
    | {
        importId: string;
        stage: 'files';
        processedFiles: number;
      }
    | {
        importId: string;
        stage: 'rows';
        stagedRows: number;
      };
  [csvImportEvents.extractSuccess]: {
    importId: string;
  };
  [csvImportEvents.extractError]: {
    importId: string;
    message: string;
  };
  [csvImportEvents.preflightScanStart]: {
    importId: string;
  };
  [csvImportEvents.preflightScanProgress]: {
    importId: string;
    processedRows: number;
    totalRows: number;
  };
  [csvImportEvents.preflightScanSuccess]: {
    importId: string;
  };
  [csvImportEvents.preflightScanError]: {
    importId: string;
    message: string;
  };
  [csvImportEvents.preflightThesauriCreateStart]: {
    importId: string;
  };
  [csvImportEvents.preflightThesauriCreateProgress]: {
    importId: string;
    thesaurusId: string;
    processedThesauri: number;
    totalThesauri: number;
    createdValues: number;
  };
  [csvImportEvents.preflightThesauriCreateSuccess]: {
    importId: string;
  };
  [csvImportEvents.preflightThesauriCreateError]: {
    importId: string;
    message: string;
  };
  [csvImportEvents.preflightRelationshipsCreateStart]: {
    importId: string;
  };
  [csvImportEvents.preflightRelationshipsCreateProgress]: {
    importId: string;
    processedTemplates: number;
    totalTemplates: number;
    createdEntities: number;
  };
  [csvImportEvents.preflightRelationshipsCreateSuccess]: {
    importId: string;
  };
  [csvImportEvents.preflightRelationshipsCreateError]: {
    importId: string;
    message: string;
  };
  [csvImportEvents.importProgress]: {
    importId: string;
    processedRows: number;
    totalRows: number;
    batchIndex: number;
    batchCount: number;
    entitiesCreatedInBatch: number;
  };
  [csvImportEvents.importSuccess]: {
    importId: string;
  };
  [csvImportEvents.importError]: {
    importId: string;
    message: string;
  };
};

export { csvImportEvents };
export type { CsvImportEventPayloads };
