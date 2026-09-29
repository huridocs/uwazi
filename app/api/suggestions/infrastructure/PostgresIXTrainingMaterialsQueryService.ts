import { SegmentationDirectory } from '#segmentation';
import {
  PostgresDataSource,
  PostgresDataSourceDeps,
} from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import {
  IXTrainingMaterialsQueryService,
  TrainingFileRow,
  TrainingMaterialsQuery,
} from '../domain/IXTrainingMaterialsQueryService.js';
import type { IXSuggestionsRow } from './PostgresIXSuggestionsRow.js';
import { TrainingSegmentationsJoin } from './TrainingSegmentationsJoin.js';
import { toHex } from './postgresSuggestionQueries.js';

type Deps = Omit<PostgresDataSourceDeps, 'sync'> & { segmentationDirectory: SegmentationDirectory };

/** A row as Postgres answers it: everything but the segmentation, with the file id as hex. */
type PgTrainingRow = Omit<TrainingFileRow, 'segmentation' | 'fileId'> & { fileId: string };

/**
 * Mongo's `currentValue: { $nin: ['', null, undefined], $ne: [] }`. On an array `$nin` tests every
 * element, so an array holding an empty string or a null is excluded too.
 */
const hasCurrentValue = `"currentValue" IS NOT NULL
  AND "currentValue" NOT IN ('""'::jsonb, 'null'::jsonb, '[]'::jsonb)
  AND NOT ("currentValue" @> '[""]'::jsonb)
  AND NOT ("currentValue" @> '[null]'::jsonb)`;

/** The extractor's suggestions with a current value, limited before any join as Mongo's `$limit`. */
const limitedSuggestions = `"ix_suggestions"."_id" IN (
  SELECT "_id" FROM ix_suggestions WHERE "extractorId" = ? AND ${hasCurrentValue} LIMIT ?
)`;

/**
 * The entity keeps only the property's value, absent when the entity has none. The file keeps only
 * the property's selections, in order, and null when the file has none, as Mongo's `$filter` gives.
 */
const projection = `"ix_suggestions"."fileId" AS "fileId",
  "ix_suggestions"."entityId" AS "entityId",
  "ix_suggestions"."language" AS "language",
  "ix_suggestions"."currentValue" AS "currentValue",
  CASE WHEN "entities"."metadata" -> ? IS NULL THEN '{}'::jsonb
    ELSE jsonb_build_object('metadata', "entities"."metadata" -> ?)
  END AS "entityLanguage",
  jsonb_build_object(
    'propertySelections', CASE WHEN "files"."propertySelections" IS NULL THEN NULL ELSE COALESCE((
      SELECT jsonb_agg(selection ORDER BY position)
      FROM jsonb_array_elements("files"."propertySelections") WITH ORDINALITY AS s(selection, position)
      WHERE selection->>'name' = ?
    ), '[]'::jsonb) END,
    'filename', "files"."filename"
  ) AS "file"`;

/**
 * Postgres implementation of {@link IXTrainingMaterialsQueryService}.
 *
 * Suggestions, entities and files are joined in Postgres. Segmentations belong to the segmentation
 * module and are joined after, through its directory; a row with no ready segmentation drops out.
 *
 * `entities` carries permission RLS, and a training run walks every labeled document, so it reads
 * bypassing it.
 */
export class PostgresIXTrainingMaterialsQueryService
  extends PostgresDataSource<IXSuggestionsRow>
  implements IXTrainingMaterialsQueryService
{
  private readonly segmentations: TrainingSegmentationsJoin;

  constructor({ segmentationDirectory, ...deps }: Deps) {
    super('ix_suggestions', deps);
    this.segmentations = new TrainingSegmentationsJoin({
      segmentationDirectory: segmentationDirectory,
    });
  }

  streamFilesForTraining(query: TrainingMaterialsQuery): AsyncGenerator<TrainingFileRow> {
    return this.segmentations.join(this.streamPostgresRows(query));
  }

  private streamPostgresRows({ extractorId, property, limit }: TrainingMaterialsQuery) {
    return this.table
      .query<PgTrainingRow>()
      .join('entities', 'entities._id', 'ix_suggestions.entityLanguageId')
      .join('files', 'files._id', 'ix_suggestions.fileId')
      .whereRaw(limitedSuggestions, [toHex(extractorId), limit])
      .whereRaw(
        `"entities"."tenant_id" = "ix_suggestions"."tenant_id"
          AND "files"."tenant_id" = "ix_suggestions"."tenant_id"
          AND "files"."status" = 'ready'`
      )
      .selectRaw(projection, [property, property, property])
      .stream({ bypass: true, refIds: [] });
  }
}
