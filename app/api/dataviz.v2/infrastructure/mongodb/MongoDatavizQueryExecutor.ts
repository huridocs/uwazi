import { Db, ObjectId } from 'mongodb';
import {
  DatavizQueryContext,
  DatavizQueryExecutor,
} from '#api/dataviz.v2/application/contracts/DatavizQueryExecutor.js';
import { DatavizQueryTimeoutError } from '#api/dataviz.v2/domain/errors.js';
import { validateQueryStructure } from '#api/dataviz.v2/domain/validators/validateExecutableDatavizQuery.js';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import type { DatavizQuery, DimensionSpec } from '#shared/types/datavizSchema.js';
import { DATAVIZ_MAX_BUCKETS, REFRESH_LIVE_TIMEOUT_MS } from '#shared/types/datavizSchema.js';
import { EntityDBO } from '#api/core/infrastructure/mongodb/entity/EntityDBO.js';
import { buildPermissionMatch } from './executor/buildPermissionMatch.js';
import { buildFilterMatch, filtersForSource } from './executor/buildFilterMatch.js';
import { appendDimensionUnwindStages } from './executor/appendDimensionUnwindStages.js';
import { coerceMissingValueStages } from './executor/coerceMissingValueStages.js';
import { dimensionBucketExpression } from './executor/dimensionBucketExpression.js';
import { buildMeasureGroupAccumulator } from './executor/measureFieldExpression.js';
import {
  mergeUnionBuckets,
  normalizeBuckets,
  normalizeCompareSeries,
  normalizeMetricCount,
  RawBucket,
} from './executor/DatavizResultNormalizer.js';
import { collectBucketKeysFromRawBuckets } from './executor/collectBucketKeys.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import {
  buildDatavizMultilingualLabelContext,
  relatedEntityProperties,
  type DatavizLabelContextDeps,
} from './executor/buildDatavizMultilingualLabelContext.js';
import { loadEntityTitleLabels } from './executor/loadEntityTitleLabels.js';
import {
  createMultilingualLabelResolver,
  pickDefaultLocalizedLabel,
  resolveSeriesLocalizedLabels,
} from './executor/DatavizMultilingualLabelResolver.js';

type MongoDatavizQueryExecutorDeps = DatavizLabelContextDeps;

class MongoDatavizQueryExecutor extends MongoDataSource<EntityDBO> implements DatavizQueryExecutor {
  protected collectionName = 'entities';

  private labelContextDeps: DatavizLabelContextDeps;

  constructor(
    db: Db,
    transactionManager: MongoTransactionManager,
    deps: MongoDatavizQueryExecutorDeps
  ) {
    super(db, transactionManager, { useSyncedCollection: false });
    this.labelContextDeps = deps;
  }

  private async resolveEntityTitles(query: DatavizQuery, bucketKeys: Iterable<string>) {
    if (relatedEntityProperties(query.dimensions).size === 0) {
      return new Map();
    }

    const languages = await this.labelContextDeps.settingsDS.getLanguageKeys();
    return loadEntityTitleLabels(this.db, [...bucketKeys], languages as LanguageISO6391[]);
  }

  private async buildLabelContext(query: DatavizQuery, bucketKeys: Iterable<string>) {
    return buildDatavizMultilingualLabelContext({
      query,
      entityTitles: await this.resolveEntityTitles(query, bucketKeys),
      deps: this.labelContextDeps,
    });
  }

  async execute(query: DatavizQuery, context: DatavizQueryContext) {
    validateQueryStructure(query);

    const start = Date.now();
    const defaultLanguage = await this.labelContextDeps.settingsDS.getDefaultLanguageKey();
    const timeoutMs = context.timeoutMs ?? REFRESH_LIVE_TIMEOUT_MS;

    if (query.dimensions.length === 0) {
      return this.executeMetricCount(query, context, defaultLanguage, timeoutMs, start);
    }

    const primaryDim = query.dimensions[0]!;
    const secondaryDim = query.dimensions[1];
    const maxBuckets = primaryDim.maxBuckets ?? DATAVIZ_MAX_BUCKETS;

    const bucketSets: RawBucket[][] = [];
    const sourceIds: string[] = [];

    for (const [sourceIndex, source] of query.sources.entries()) {
      // Sequential aggregation keeps per-source timeout accounting predictable.
      // eslint-disable-next-line no-await-in-loop
      const buckets = await this.aggregateSource({
        query,
        source,
        sourceIndex,
        sourceTemplateId: source.templateId,
        language: defaultLanguage,
        primaryDim,
        secondaryDim,
        maxBuckets,
        permissionMatch: buildPermissionMatch(context.actor, query.includeUnpublished),
        timeoutMs,
      });
      bucketSets.push(buckets);
      sourceIds.push(source.alias ?? source.templateId);
    }

    const allBuckets = bucketSets.flat();
    const bucketKeys = collectBucketKeysFromRawBuckets(allBuckets);
    const labelContext = await this.buildLabelContext(query, bucketKeys);
    const resolveLabel = createMultilingualLabelResolver(labelContext);

    const templateCountById = new Map<string, number>();
    query.sources.forEach(source => {
      templateCountById.set(source.templateId, (templateCountById.get(source.templateId) ?? 0) + 1);
    });

    const sourceLocalizedLabels = query.sources.map(source =>
      resolveSeriesLocalizedLabels(
        source.templateId,
        source.alias,
        templateCountById.get(source.templateId) ?? 1,
        labelContext
      )
    );
    const sourceLabels = sourceLocalizedLabels.map(labels =>
      pickDefaultLocalizedLabel(labels, labelContext.defaultLanguage, 'Series')
    );

    const joinType = query.join?.type ?? (query.sources.length > 1 ? 'compare' : undefined);

    if (query.sources.length > 1 && joinType === 'compare') {
      return normalizeCompareSeries({
        bucketSets,
        sourceIds,
        sourceLabels,
        sourceLocalizedLabels,
        primaryDim,
        resolveLabel,
        datavizId: context.datavizId ?? '',
        queryDurationMs: Date.now() - start,
        appearance: context.appearance,
        defaultLanguage: labelContext.defaultLanguage,
        missingBucketLabels: labelContext.missingBucketLabels,
      });
    }

    const { buckets, seriesLabel } =
      query.sources.length > 1
        ? mergeUnionBuckets(bucketSets, sourceLabels)
        : { buckets: bucketSets[0] ?? [], seriesLabel: sourceLabels[0] ?? 'Series' };

    return normalizeBuckets({
      buckets,
      primaryDim,
      secondaryDim,
      resolveLabel,
      datavizId: context.datavizId ?? '',
      queryDurationMs: Date.now() - start,
      appearance: context.appearance,
      seriesLabel,
      seriesLabels: sourceLocalizedLabels[0],
      defaultLanguage: labelContext.defaultLanguage,
      missingBucketLabels: labelContext.missingBucketLabels,
      measure: query.measures[0],
    });
  }

  private async executeMetricCount(
    query: DatavizQuery,
    context: DatavizQueryContext,
    language: string,
    timeoutMs: number,
    start: number
  ) {
    const permissionMatch = buildPermissionMatch(context.actor, query.includeUnpublished);
    const counts: number[] = [];

    for (const [sourceIndex, source] of query.sources.entries()) {
      // eslint-disable-next-line no-await-in-loop
      const count = await this.countSourceEntities({
        query,
        source,
        sourceIndex,
        sourceTemplateId: source.templateId,
        language,
        permissionMatch,
        timeoutMs,
      });
      counts.push(count);
    }

    const labelContext = await this.buildLabelContext(query, []);

    const templateCountById = new Map<string, number>();
    query.sources.forEach(source => {
      templateCountById.set(source.templateId, (templateCountById.get(source.templateId) ?? 0) + 1);
    });

    const sourceLocalizedLabels = query.sources.map(source =>
      resolveSeriesLocalizedLabels(
        source.templateId,
        source.alias,
        templateCountById.get(source.templateId) ?? 1,
        labelContext
      )
    );
    const sourceLabels = sourceLocalizedLabels.map(labels =>
      pickDefaultLocalizedLabel(labels, labelContext.defaultLanguage, 'Total')
    );
    const sourceIds = query.sources.map(source => source.alias ?? source.templateId);

    return normalizeMetricCount({
      counts,
      sourceIds,
      sourceLabels,
      sourceLocalizedLabels,
      datavizId: context.datavizId ?? '',
      queryDurationMs: Date.now() - start,
    });
  }

  private async countSourceEntities(params: {
    query: DatavizQuery;
    source: DatavizQuery['sources'][number];
    sourceIndex: number;
    sourceTemplateId: string;
    language: string;
    permissionMatch: object;
    timeoutMs: number;
  }): Promise<number> {
    const { query, source, sourceIndex, sourceTemplateId, language, permissionMatch, timeoutMs } =
      params;

    const sourceFilters = filtersForSource(query.filters, source, sourceIndex);
    const match: Record<string, unknown> = {
      template: ObjectId.createFromHexString(sourceTemplateId),
      language,
      ...permissionMatch,
      ...Object.assign({}, ...buildFilterMatch(sourceFilters)),
    };

    try {
      const results = await this.getCollection()
        .aggregate<{ count: number }>([{ $match: match }, { $count: 'count' }], {
          maxTimeMS: timeoutMs,
        })
        .toArray();
      return results[0]?.count ?? 0;
    } catch (error) {
      if (error instanceof Error && /timed out|maxTimeMS/i.test(error.message)) {
        throw new DatavizQueryTimeoutError();
      }
      throw error;
    }
  }

  private async aggregateSource(params: {
    query: DatavizQuery;
    source: DatavizQuery['sources'][number];
    sourceIndex: number;
    sourceTemplateId: string;
    language: string;
    primaryDim: DimensionSpec;
    secondaryDim?: DimensionSpec;
    maxBuckets: number;
    permissionMatch: object;
    timeoutMs: number;
  }): Promise<RawBucket[]> {
    const {
      query,
      source,
      sourceIndex,
      sourceTemplateId,
      language,
      primaryDim,
      secondaryDim,
      maxBuckets,
      permissionMatch,
      timeoutMs,
    } = params;

    const sourceFilters = filtersForSource(query.filters, source, sourceIndex);

    const match: Record<string, unknown> = {
      template: ObjectId.createFromHexString(sourceTemplateId),
      language,
      ...permissionMatch,
      ...Object.assign({}, ...buildFilterMatch(sourceFilters)),
    };

    const primaryField = dimensionBucketExpression(primaryDim);
    const secondaryField = secondaryDim ? dimensionBucketExpression(secondaryDim) : undefined;

    const pipeline: object[] = [{ $match: match }];

    appendDimensionUnwindStages(pipeline, primaryDim);
    if (secondaryDim && secondaryDim.property !== primaryDim.property) {
      appendDimensionUnwindStages(pipeline, secondaryDim);
    }

    pipeline.push({
      $addFields: {
        __primary: primaryField,
        ...(secondaryField ? { __secondary: secondaryField } : {}),
      },
    });

    coerceMissingValueStages(pipeline, '__primary');
    if (secondaryField) {
      coerceMissingValueStages(pipeline, '__secondary');
    }

    const measure = query.measures[0] ?? { aggregation: 'count' as const };
    const measureAccumulator = buildMeasureGroupAccumulator(measure);

    if (secondaryField) {
      pipeline.push({
        $group: {
          _id: { primary: '$__primary', secondary: '$__secondary' },
          ...measureAccumulator,
        },
      });
    } else {
      pipeline.push({
        $group: {
          _id: '$__primary',
          ...measureAccumulator,
        },
      });
    }

    pipeline.push({ $sort: { count: -1 } });
    if (!secondaryField) {
      pipeline.push({ $limit: maxBuckets });
    }

    try {
      const results = await this.getCollection()
        .aggregate<RawBucket>(pipeline, { maxTimeMS: timeoutMs })
        .toArray();
      return results;
    } catch (error) {
      if (error instanceof Error && /timed out|maxTimeMS/i.test(error.message)) {
        throw new DatavizQueryTimeoutError();
      }
      throw error;
    }
  }
}

export { MongoDatavizQueryExecutor };
