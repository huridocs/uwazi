import { IXModelType } from '#shared/types/IXModelType.js';

/**
 * One `ix_models` row: the Mongo `ixmodels` document with its ids as hex strings and
 * `processRun` as JSONB. Absent optional fields are NULL.
 */
type IXModelsRow = {
  _id: string;
  extractorId: string;
  creationDate: number | null;
  status: string;
  findingSuggestions: boolean;
  maxSuggestionsToFind: number | null;
  totalSuggestionsToFind: number | null;
  processRun: IXModelType['processRun'] | null;
};

export type { IXModelsRow };
