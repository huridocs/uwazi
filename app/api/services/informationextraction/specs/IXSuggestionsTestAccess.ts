import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { IXSuggestionType } from '#shared/types/suggestionType.js';
import { Suggestion } from '#api/suggestions/domain/IXSuggestionsDataSource.js';

/** Which suggestions a test means; every field present must match. */
type SuggestionFilter = {
  extractorId?: ObjectIdSchema;
  entityId?: string;
  fileId?: ObjectIdSchema;
  language?: string;
  status?: IXSuggestionType['status'];
  propertyName?: string;
};

/** The fields tests set directly; each backend translates nested ones to its own storage. */
type SuggestionPatch = {
  useForTraining?: boolean;
  trainingSample?: boolean;
  date?: number;
  obsolete?: boolean;
  error?: boolean;
  suggestionsRunTimestamp?: number;
};

/**
 * Test-only, filter-shaped access to stored suggestions, with one implementation per backend.
 * **Not for production code**: everything production needs is a named operation on the port.
 */
interface IXSuggestionsTestAccess {
  find(filter: SuggestionFilter): Promise<Suggestion[]>;
  deleteMany(filter: SuggestionFilter): Promise<void>;
  setOnMany(filter: SuggestionFilter, patch: SuggestionPatch): Promise<void>;
}

const definedOnly = <T extends object>(values: T) =>
  Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined)
  ) as Partial<T>;

export type { IXSuggestionsTestAccess, SuggestionFilter, SuggestionPatch };
export { definedOnly };
