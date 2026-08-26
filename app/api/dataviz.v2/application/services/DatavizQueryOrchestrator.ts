import { DatavizQueryContext } from '#api/dataviz.v2/application/contracts/DatavizQueryExecutor.js';
import {
  DatavizAggregationStrategy,
  RawBucket,
  SourceQueryContext,
} from '#api/dataviz.v2/application/contracts/DatavizAggregationStrategy.js';
import { validateQueryStructure } from '#api/dataviz.v2/domain/validators/validateExecutableDatavizQuery.js';
import { DatavizDataDTO, DatavizQuery } from '#shared/types/datavizSchema.js';
import { DATAVIZ_MAX_BUCKETS, REFRESH_LIVE_TIMEOUT_MS } from '#shared/types/datavizSchema.js';
import { DATAVIZ_MISSING_BUCKET_KEY } from '#shared/dataviz/missingBucket.js';
import {
  normalizeDatavizBucketKey,
  serializeDatavizBucketKey,
} from '#shared/dataviz/formatDimensionKeyLabel.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import {
  buildDatavizMultilingualLabelContext,
  DatavizLabelContextDeps,
  relatedEntityProperties,
} from './buildDatavizMultilingualLabelContext.js';
import {
  createMultilingualLabelResolver,
  pickDefaultLocalizedLabel,
  resolveSeriesLocalizedLabels,
} from './DatavizMultilingualLabelResolver.js';
import {
  mergeUnionBuckets,
  normalizeBuckets,
  normalizeCompareSeries,
  normalizeMetricCount,
} from './DatavizResultNormalizer.js';

export class DatavizQueryOrchestrator {
  private deps: DatavizLabelContextDeps;

  private engine: DatavizAggregationStrategy;

  constructor(deps: DatavizLabelContextDeps, engine: DatavizAggregationStrategy) {
    this.deps = deps;
    this.engine = engine;
  }

  async execute(query: DatavizQuery, context: DatavizQueryContext): Promise<DatavizDataDTO> {
    validateQueryStructure(query);

    const start = Date.now();
    const defaultLanguage = await this.deps.settingsDS.getDefaultLanguageKey();
    const timeoutMs = context.timeoutMs ?? REFRESH_LIVE_TIMEOUT_MS;
    const includeUnpublished = query.includeUnpublished === true;

    if (query.dimensions.length === 0) {
      return this.executeMetricCount(
        query,
        context,
        defaultLanguage,
        timeoutMs,
        start,
        includeUnpublished
      );
    }

    const primaryDim = query.dimensions[0]!;
    const secondaryDim = query.dimensions[1];
    const maxBuckets = primaryDim.maxBuckets ?? DATAVIZ_MAX_BUCKETS;

    const bucketSets: RawBucket[][] = [];
    const sourceIds: string[] = [];

    for (const [sourceIndex, source] of query.sources.entries()) {
      const sourceContext = this.buildSourceContext(
        query,
        context,
        source,
        sourceIndex,
        defaultLanguage,
        timeoutMs,
        includeUnpublished
      );
      // eslint-disable-next-line no-await-in-loop
      const buckets = await this.engine.aggregateSource({
        ...sourceContext,
        primaryDim,
        secondaryDim,
        maxBuckets,
      });
      bucketSets.push(buckets);
      sourceIds.push(source.alias ?? source.templateId);
    }

    const allBuckets = bucketSets.flat();
    const bucketKeys = this.collectBucketKeysFromRawBuckets(allBuckets);
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
        secondaryDim,
        resolveLabel,
        datavizId: context.datavizId ?? '',
        queryDurationMs: Date.now() - start,
        appearance: context.appearance,
        defaultLanguage: labelContext.defaultLanguage,
        missingBucketLabels: labelContext.missingBucketLabels,
        measure: query.measures[0],
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
    start: number,
    includeUnpublished: boolean
  ) {
    const counts: number[] = [];

    for (const [sourceIndex, source] of query.sources.entries()) {
      // eslint-disable-next-line no-await-in-loop
      const count = await this.engine.countSourceEntities(
        this.buildSourceContext(
          query,
          context,
          source,
          sourceIndex,
          language,
          timeoutMs,
          includeUnpublished
        )
      );
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

  private buildSourceContext(
    query: DatavizQuery,
    context: DatavizQueryContext,
    source: DatavizQuery['sources'][number],
    sourceIndex: number,
    language: string,
    timeoutMs: number,
    includeUnpublished: boolean
  ): SourceQueryContext {
    return {
      query,
      externalFilters: context.externalFilters,
      source,
      sourceIndex,
      sourceTemplateId: source.templateId,
      language,
      includeUnpublished,
      timeoutMs,
    };
  }

  private async resolveEntityTitles(query: DatavizQuery, bucketKeys: Iterable<string>) {
    if (relatedEntityProperties(query.dimensions).size === 0) {
      return new Map();
    }

    const languages = await this.deps.settingsDS.getLanguageKeys();
    const filteredIds = [...bucketKeys].filter(
      id => id && id !== DATAVIZ_MISSING_BUCKET_KEY && id !== 'null' && id !== 'undefined'
    );

    return this.deps.entitiesDAO.getTitleLabelsBySharedIds(
      filteredIds,
      languages as LanguageISO6391[]
    );
  }

  private async buildLabelContext(query: DatavizQuery, bucketKeys: Iterable<string>) {
    return buildDatavizMultilingualLabelContext({
      query,
      entityTitles: await this.resolveEntityTitles(query, bucketKeys),
      deps: this.deps,
    });
  }

  private collectBucketKeysFromRawBuckets(buckets: RawBucket[]): string[] {
    const keys = new Set<string>();

    buckets.forEach(bucket => {
      const id = bucket._id;
      if (id && typeof id === 'object' && 'primary' in id) {
        keys.add(String(serializeDatavizBucketKey(normalizeDatavizBucketKey(id.primary))));
        keys.add(String(serializeDatavizBucketKey(normalizeDatavizBucketKey(id.secondary))));
        return;
      }

      keys.add(String(serializeDatavizBucketKey(normalizeDatavizBucketKey(id))));
    });

    return [...keys];
  }
}
