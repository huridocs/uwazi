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
import { IXModelsModel } from '../IXModelsModel.js';

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

const readModel = async (extractorId: ObjectIdSchema) => {
  const [model] = await IXModelsModel.get({ extractorId });
  return model;
};

const writeModel = async (model: Partial<IXModelType>) => IXModelsModel.save(model as IXModelType);

const setSamplePolicy = async (
  extractorId: ObjectId,
  samplePolicy: 'only_marked' | 'marked_plus_labeled'
) =>
  IXModelsModel.db.updateOne(
    { extractorId },
    { $set: { 'processRun.samplePolicy': samplePolicy } }
  );

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
};
