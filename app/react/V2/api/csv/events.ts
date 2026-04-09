const csvImportEvents = {
  importStart: 'csvImport:import:start',
  importProgress: 'csvImport:import:progress',
  importSuccess: 'csvImport:import:success',
  importError: 'csvImport:import:error',
} as const;

type CsvImportEventPayloads = {
  [csvImportEvents.importStart]: {
    importId: string;
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
