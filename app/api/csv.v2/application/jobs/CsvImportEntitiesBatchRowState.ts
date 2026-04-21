import { CsvImport } from '../../domain/CsvImport.js';
import { CsvImportRow } from '../../domain/CsvImportRow.js';
import { CsvImportRowError } from '../../domain/CsvImportRowError.js';
import { CsvRowImportErrorFactory } from '../services/CsvRowImportErrorFactory.js';

type RowProcessingState = {
  created: number;
  errors: CsvImportRowError[];
  consecutiveFailures: number;
  maxConsecutiveFailures: number;
};

const createRowProcessingState = (): RowProcessingState => ({
  created: 0,
  errors: [],
  consecutiveFailures: 0,
  maxConsecutiveFailures: 0,
});

const trackImportedRow = (state: RowProcessingState) => ({
  ...state,
  created: state.created + 1,
  consecutiveFailures: 0,
});

const trackFailedRow = (params: {
  state: RowProcessingState;
  csvImport: CsvImport;
  row: CsvImportRow;
  error: unknown;
}): RowProcessingState => {
  const { state, csvImport, row, error } = params;
  const rowError = CsvRowImportErrorFactory.fromException({
    importId: csvImport.id,
    rowIndex: row.rowIndex,
    error,
  });
  const consecutiveFailures = state.consecutiveFailures + 1;
  return {
    ...state,
    errors: [...state.errors, rowError],
    consecutiveFailures,
    maxConsecutiveFailures: Math.max(state.maxConsecutiveFailures, consecutiveFailures),
  };
};

export { createRowProcessingState, trackImportedRow, trackFailedRow };
export type { RowProcessingState };
