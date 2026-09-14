import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import templates from '#api/core/v1_layer/templates/index.js';
import { objectIndex } from '#shared/data_utils/objectIndex.js';
import { getSuggestionState, SuggestionValues } from '#shared/getIXSuggestionState.js';
import { propertyIsMultiselect, propertyIsRelationship } from '#shared/propertyTypes.js';
import { ObjectIdSchema, PropertyTypeSchema } from '#shared/types/commonTypes.js';
import { IXSuggestionStateType } from '#shared/types/suggestionType.js';
import { StateRecomputeRow, StateRecomputeScope } from './domain/IXSuggestionsStateQueryService.js';
import { IXSuggestionsDAOFactory } from './infrastructure/IXSuggestionsDAOFactory.js';
import { IXSuggestionsStateQueryServiceFactory } from './infrastructure/IXSuggestionsStateQueryServiceFactory.js';

/** How many state writes to accumulate before sending them. Matches the old bulk stream's limit. */
const WRITE_BATCH_SIZE = 1000;

/**
 * The store hands back every entity value as an array, because a multi-valued property genuinely
 * has several. For every other property type the state arithmetic expects the scalar.
 */
const collapseCurrentValue = (
  row: StateRecomputeRow,
  propertyType: PropertyTypeSchema
): SuggestionValues => {
  if (propertyIsMultiselect(propertyType) || propertyIsRelationship(propertyType)) {
    return row as unknown as SuggestionValues;
  }

  return {
    ...row,
    currentValue: row.currentValue.length > 0 ? row.currentValue[0] : '',
  } as unknown as SuggestionValues;
};

type StateWrite = { id: ObjectIdSchema; state: IXSuggestionStateType };

const loadPropertyTypesByName = async () =>
  objectIndex(
    (await templates.get()).map(t => t.properties || []).flat(),
    p => p.name,
    p => p.type
  );

const flushStates = async (
  dao: ReturnType<typeof IXSuggestionsDAOFactory.default>,
  batch: StateWrite[]
) => {
  if (batch.length === 0) {
    return;
  }
  await dao.setStates(batch);
};

const streamAndWriteStates = async (
  rows: AsyncIterable<StateRecomputeRow>,
  propertyTypes: Record<string, PropertyTypeSchema>,
  dao: ReturnType<typeof IXSuggestionsDAOFactory.default>
) => {
  let batch: StateWrite[] = [];

  for await (const row of rows) {
    const propertyType = propertyTypes[row.propertyName];
    batch.push({
      id: row._id,
      state: getSuggestionState(collapseCurrentValue(row, propertyType), propertyType),
    });

    if (batch.length >= WRITE_BATCH_SIZE) {
      // eslint-disable-next-line no-await-in-loop
      await flushStates(dao, batch);
      batch = [];
    }
  }

  await flushStates(dao, batch);
};

/**
 * Recompute the `state` of the suggestions the scope selects.
 *
 * Read and write are split: the pairing of a suggestion with its entity value is a query service
 * — one operation each store answers natively — while the write is a plain data source call. The
 * arithmetic in between (`getSuggestionState`) is shared and belongs to neither.
 *
 * What used to sit here and no longer does: a `$lookup` of the file and of the model, feeding
 * `labeledValue`, `labeledText` and `modelCreationDate`, plus a read of every extractor to
 * backfill `labeledValue`. Nothing consumed any of it — only `state` is ever written, and
 * `getSuggestionState` does not look at `labeledValue`.
 */
const recompute = async (scope: StateRecomputeScope) => {
  const languages = (await SettingsDataSourceFactory.default().readLanguages()) ?? [];
  const propertyTypes = await loadPropertyTypesByName();
  const dao = IXSuggestionsDAOFactory.default();
  const rows = IXSuggestionsStateQueryServiceFactory.default().streamForStateRecompute({
    scope,
    languages,
  });

  await streamAndWriteStates(rows, propertyTypes, dao);
};

/** After accepting suggestions, so the accepted ones stop matching subsequent iterations. */
export const recomputeStatesForIds = async (ids: ObjectIdSchema[]) =>
  recompute({ kind: 'ids', ids });

export const recomputeAllStates = async () => recompute({ kind: 'all' });
