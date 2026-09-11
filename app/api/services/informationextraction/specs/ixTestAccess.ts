/**
 * Test-side access seam for the information extraction collections.
 *
 * The three IX mongoose models are gone (stages 4a–4c). This file is what kept their removal a
 * one-file edit instead of a change to ~4,000 lines of specs, and it serves the same purpose for
 * stage 6: everything the specs need is a named operation over a narrow filter, so pointing them
 * at a Postgres-backed store means changing this file, not them.
 *
 * Reads and writes that map onto the port use it. The filter-shaped ones go through
 * `MongoIXSuggestionsTestAccess`, which is store-specific and test-only — a general
 * filter-taking method on the port would reopen the leak the port exists to close.
 *
 * Rules for adding to this file:
 * - no mongo query objects, `$set`, or dotted paths in a parameter
 * - name the operation after what the test means, not how mongo does it
 */
import { ObjectId } from 'mongodb';
import { isPostgresCoreActive } from '#api/core/libs/featureFlags.js';
import { IXSuggestionsDAOFactory } from '#api/suggestions/infrastructure/IXSuggestionsDAOFactory.js';
import { IXSuggestionType } from '#shared/types/suggestionType.js';
import { IXModelType } from '#shared/types/IXModelType.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { IXExtractorsDAOFactory } from '../infrastructure/IXExtractorsDAOFactory.js';
import { IXModelsDAOFactory } from '../infrastructure/IXModelsDAOFactory.js';
import { IXModel } from '../domain/IXModelsDataSource.js';
import type { IXSuggestionsTestAccess, SuggestionFilter } from './IXSuggestionsTestAccess.js';
import { MongoIXSuggestionsTestAccess } from './MongoIXSuggestionsTestAccess.js';
import { PostgresIXSuggestionsTestAccess } from './PostgresIXSuggestionsTestAccess.js';

/** The tenant's store, picked the way the IX factories pick it. */
const suggestionsCollection = (): IXSuggestionsTestAccess =>
  isPostgresCoreActive()
    ? PostgresIXSuggestionsTestAccess.default()
    : MongoIXSuggestionsTestAccess.default();

/* ---------------------------------------------------------------- suggestions -- */

const readSuggestions = async (filter: SuggestionFilter = {}) =>
  suggestionsCollection().find(filter);

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

const writeSuggestion = async (suggestion: Partial<IXSuggestionType>) => {
  const [saved] = await IXSuggestionsDAOFactory.default().saveMultiple([suggestion]);
  return saved;
};

const writeSuggestions = async (toSave: Partial<IXSuggestionType>[]) =>
  IXSuggestionsDAOFactory.default().saveMultiple(toSave);

const removeSuggestions = async (filter: SuggestionFilter = {}) =>
  suggestionsCollection().deleteMany(filter);

const markUseForTraining = async (filter: SuggestionFilter, useForTraining = true) =>
  suggestionsCollection().setOnMany(filter, { useForTraining });

/** Mark suggestions as training samples, as a limited run's sampling leaves them. */
const markTrainingSample = async (filter: SuggestionFilter) =>
  suggestionsCollection().setOnMany(filter, { trainingSample: true });

/**
 * Put suggestions into the state a completed, healthy run of `runTimestamp` would leave
 * them in: dated, not obsolete, not errored, and tagged with the run.
 */
const markProcessedInRun = async (filter: SuggestionFilter, runTimestamp: number, date = 1) =>
  suggestionsCollection().setOnMany(filter, {
    date,
    obsolete: false,
    error: false,
    suggestionsRunTimestamp: runTimestamp,
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
  markTrainingSample,
  markProcessedInRun,
  readModel,
  writeModel,
  setSamplePolicy,
  readExtractor,
  readExtractorByName,
  readExtractors,
};
