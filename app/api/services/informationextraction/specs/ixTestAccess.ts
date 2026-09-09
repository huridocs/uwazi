/**
 * Test-side access seam for the information extraction collections.
 *
 * Specs must not reach for `IXSuggestionsModel` / `IXModelsModel` directly: those mongoose
 * models are being retired in favour of a DAO (see plans/information-extraction-rewrite).
 * Everything the specs need is expressed here as a named operation over a narrow filter,
 * so when the models go away only this file changes, not the ~4,000 lines of specs that
 * use it.
 *
 * Rules for adding to this file:
 * - no mongo query objects, `$set`, or dotted paths in a parameter
 * - name the operation after what the test means, not how mongo does it
 */
import { ObjectId } from 'mongodb';
import { IXSuggestionsModel } from '#api/suggestions/IXSuggestionsModel.js';
import { IXSuggestionType } from '#shared/types/suggestionType.js';
import { IXModelType } from '#shared/types/IXModelType.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { IXExtractorsDAOFactory } from '../infrastructure/IXExtractorsDAOFactory.js';
import { IXModelsDAOFactory } from '../infrastructure/IXModelsDAOFactory.js';
import { IXModel } from '../domain/IXModelsDataSource.js';

type SuggestionFilter = {
  extractorId?: ObjectIdSchema;
  entityId?: string;
  fileId?: ObjectIdSchema;
  language?: string;
  status?: IXSuggestionType['status'];
  propertyName?: string;
};

const toQuery = (filter: SuggestionFilter) =>
  Object.fromEntries(Object.entries(filter).filter(([, value]) => value !== undefined));

/* ---------------------------------------------------------------- suggestions -- */

const readSuggestions = async (filter: SuggestionFilter = {}) =>
  IXSuggestionsModel.get(toQuery(filter));

// Returns the element type, not `T | undefined`, so these read exactly like the
// `const [x] = await Model.get(...)` destructure they replace.
const readOneSuggestion = async (filter: SuggestionFilter) => {
  const [suggestion] = await readSuggestions(filter);
  return suggestion;
};

const readSuggestionIds = async (filter: SuggestionFilter, limit?: number) => {
  const suggestions = await readSuggestions(filter);
  const selected = typeof limit === 'number' ? suggestions.slice(0, limit) : suggestions;
  return selected.map(suggestion => suggestion._id.toString());
};

const writeSuggestion = async (suggestion: Partial<IXSuggestionType>) =>
  IXSuggestionsModel.save(suggestion as IXSuggestionType);

const writeSuggestions = async (suggestions: Partial<IXSuggestionType>[]) =>
  IXSuggestionsModel.saveMultiple(suggestions as IXSuggestionType[]);

const removeSuggestions = async (filter: SuggestionFilter = {}) =>
  IXSuggestionsModel.delete(toQuery(filter));

const markUseForTraining = async (filter: SuggestionFilter, useForTraining = true) =>
  IXSuggestionsModel.updateMany(toQuery(filter), { $set: { useForTraining } });

/**
 * Put suggestions into the state a completed, healthy run of `runTimestamp` would leave
 * them in: dated, not obsolete, not errored, and tagged with the run.
 */
const markProcessedInRun = async (filter: SuggestionFilter, runTimestamp: number, date = 1) =>
  IXSuggestionsModel.updateMany(toQuery(filter), {
    $set: {
      date,
      'state.obsolete': false,
      'state.error': false,
      'modelData.suggestionsRunTimestamp': runTimestamp,
    },
  });

/* --------------------------------------------------------------------- models -- */

// Returns the element type, not `IXModel | undefined`, for the same reason
// `readOneSuggestion` does: specs destructured an array here before.
const readModel = async (extractorId: ObjectIdSchema) => {
  const model = await IXModelsDAOFactory.default().getByExtractorId(extractorId);
  return model as IXModel;
};

const writeModel = async (model: Partial<IXModelType>) => IXModelsDAOFactory.default().save(model);

const setSamplePolicy = async (
  extractorId: ObjectId,
  samplePolicy: 'only_marked' | 'marked_plus_labeled'
) => IXModelsDAOFactory.default().setSamplePolicy(extractorId, samplePolicy);

/* ----------------------------------------------------------------- extractors -- */

/**
 * Specs looked extractors up by `name`, a query shape no production code uses. Rather than
 * put a `getByName` on the DAO that only tests would call, the lookup lives here: read all
 * and pick. Fixtures are small, and the port stays derived from real usage.
 */
const readExtractorByName = async (name: string) => {
  const extractors = await IXExtractorsDAOFactory.default().getAll();
  return extractors.find(extractor => extractor.name === name)!;
};

const readExtractors = async () => IXExtractorsDAOFactory.default().getAll();

const readExtractor = async (id: ObjectIdSchema) => IXExtractorsDAOFactory.default().getById(id);

export type { SuggestionFilter };
export const ixTestAccess = {
  readSuggestions,
  readOneSuggestion,
  readSuggestionIds,
  writeSuggestion,
  writeSuggestions,
  removeSuggestions,
  markUseForTraining,
  markProcessedInRun,
  readModel,
  writeModel,
  setSamplePolicy,
  readExtractor,
  readExtractorByName,
  readExtractors,
};
