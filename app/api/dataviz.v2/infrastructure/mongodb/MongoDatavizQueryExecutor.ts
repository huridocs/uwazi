import { Db, ObjectId } from 'mongodb';
import {
  DatavizQueryContext,
  DatavizQueryExecutor,
} from '#api/dataviz.v2/application/contracts/DatavizQueryExecutor.js';
import { DatavizQueryTimeoutError } from '#api/dataviz.v2/domain/errors.js';
import { validateQueryStructure } from '#api/dataviz.v2/domain/validators/validateExecutableDatavizQuery.js';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import type {
  DatavizFilter,
  DatavizQuery,
  DatavizSource,
  DimensionSpec,
  MeasureSpec,
} from '#shared/types/datavizSchema.js';
import {
  DATAVIZ_MAX_BUCKETS,
  REFRESH_LIVE_TIMEOUT_MS,
  TEMPLATE_DIMENSION_PROPERTY,
} from '#shared/types/datavizSchema.js';
import { isDateLikePropertyType } from '#shared/dataviz/dimensionPropertyTypes.js';
import {
  dimensionNeedsUnwind,
  isRelationshipDimension,
} from '#shared/dataviz/relationshipDimension.js';
import { DATAVIZ_MISSING_BUCKET_KEY } from '#shared/dataviz/missingBucket.js';
import {
  normalizeDatavizBucketKey,
  serializeDatavizBucketKey,
} from '#shared/dataviz/formatDimensionKeyLabel.js';
import { User } from '#api/users.v2/model/User.js';
import { EntityDBO } from '#api/core/infrastructure/mongodb/entity/EntityDBO.js';
import {
  mergeUnionBuckets,
  normalizeBuckets,
  normalizeCompareSeries,
  normalizeMetricCount,
  RawBucket,
} from './executor/DatavizResultNormalizer.js';
import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import {
  buildDatavizMultilingualLabelContext,
  relatedEntityProperties,
  type DatavizLabelContextDeps,
} from './executor/buildDatavizMultilingualLabelContext.js';
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
    const filteredIds = [...bucketKeys].filter(
      id => id && id !== DATAVIZ_MISSING_BUCKET_KEY && id !== 'null' && id !== 'undefined'
    );

    return this.labelContextDeps.entitiesDAO.getTitleLabelsBySharedIds(
      filteredIds,
      languages as LanguageISO6391[]
    );
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
        externalFilters: context.externalFilters,
        source,
        sourceIndex,
        sourceTemplateId: source.templateId,
        language: defaultLanguage,
        primaryDim,
        secondaryDim,
        maxBuckets,
        permissionMatch: this.buildPermissionMatch(context.actor, query.includeUnpublished),
        timeoutMs,
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
    start: number
  ) {
    const permissionMatch = this.buildPermissionMatch(context.actor, query.includeUnpublished);
    const counts: number[] = [];

    for (const [sourceIndex, source] of query.sources.entries()) {
      // eslint-disable-next-line no-await-in-loop
      const count = await this.countSourceEntities({
        query,
        externalFilters: context.externalFilters,
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
    externalFilters?: DatavizFilter[];
    source: DatavizQuery['sources'][number];
    sourceIndex: number;
    sourceTemplateId: string;
    language: string;
    permissionMatch: object;
    timeoutMs: number;
  }): Promise<number> {
    const {
      query,
      externalFilters,
      source,
      sourceIndex,
      sourceTemplateId,
      language,
      permissionMatch,
      timeoutMs,
    } = params;

    const sourceFilters = this.mergeSourceFilters(
      query.filters,
      externalFilters,
      source,
      sourceIndex
    );
    const match: Record<string, unknown> = {
      template: ObjectId.createFromHexString(sourceTemplateId),
      language,
      ...permissionMatch,
      ...Object.assign({}, ...this.buildFilterMatch(sourceFilters)),
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
    externalFilters?: DatavizFilter[];
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
      externalFilters,
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

    const sourceFilters = this.mergeSourceFilters(
      query.filters,
      externalFilters,
      source,
      sourceIndex
    );

    const match: Record<string, unknown> = {
      template: ObjectId.createFromHexString(sourceTemplateId),
      language,
      ...permissionMatch,
      ...Object.assign({}, ...this.buildFilterMatch(sourceFilters)),
    };

    const primaryField = this.dimensionBucketExpression(primaryDim);
    const secondaryField = secondaryDim ? this.dimensionBucketExpression(secondaryDim) : undefined;

    const pipeline: object[] = [{ $match: match }];

    this.appendDimensionUnwindStages(pipeline, primaryDim);
    if (secondaryDim && secondaryDim.property !== primaryDim.property) {
      this.appendDimensionUnwindStages(pipeline, secondaryDim);
    }

    pipeline.push({
      $addFields: {
        __primary: primaryField,
        ...(secondaryField ? { __secondary: secondaryField } : {}),
      },
    });

    this.coerceMissingValueStages(pipeline, '__primary');
    if (secondaryField) {
      this.coerceMissingValueStages(pipeline, '__secondary');
    }

    const measure = query.measures[0] ?? { aggregation: 'count' as const };
    const measureAccumulator = this.buildMeasureGroupAccumulator(measure);

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

  private buildPermissionMatch(actor: User, includeUnpublished?: boolean): object {
    if (actor.isPrivileged() && includeUnpublished) {
      return {};
    }

    if (actor.isPrivileged()) {
      return {};
    }

    const userRefIds = [actor._id, ...actor.groups];

    return {
      $or: [{ published: true }, { permissions: { $elemMatch: { refId: { $in: userRefIds } } } }],
    };
  }

  private metadataPath(property: string): string {
    return `metadata.${property}`;
  }

  private coerceNumericBound(value: string | number | undefined): number | undefined {
    if (value === undefined || value === '') {
      return undefined;
    }
    if (typeof value === 'number') {
      return value;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  private filterBound(
    filter: DatavizFilter,
    bound: 'from' | 'to' | 'value'
  ): string | number | undefined {
    let raw: string | number | undefined;
    if (bound === 'from') {
      raw = filter.from ?? filter.value;
    } else if (bound === 'to') {
      raw = filter.to ?? filter.value;
    } else {
      raw = filter.value;
    }

    if (filter.propertyType === 'numeric') {
      return this.coerceNumericBound(raw);
    }

    return raw;
  }

  private filterAppliesToSource(
    filter: DatavizFilter,
    source: DatavizSource,
    sourceIndex: number
  ): boolean {
    if (!filter.sourceAlias) {
      return true;
    }

    if (source.alias) {
      return filter.sourceAlias === source.alias;
    }

    return sourceIndex === 0 && filter.sourceAlias === '';
  }

  private filtersForSource(
    filters: DatavizFilter[] | undefined,
    source: DatavizSource,
    sourceIndex: number
  ): DatavizFilter[] {
    return (filters ?? []).filter(
      filter => filter.property && this.filterAppliesToSource(filter, source, sourceIndex)
    );
  }

  private mergeSourceFilters(
    queryFilters: DatavizFilter[] | undefined,
    externalFilters: DatavizFilter[] | undefined,
    source: DatavizSource,
    sourceIndex: number
  ): DatavizFilter[] {
    return [
      ...this.filtersForSource(queryFilters, source, sourceIndex),
      ...this.filtersForSource(externalFilters, source, sourceIndex),
    ];
  }

  private buildExternalDateRangeMatch(filter: DatavizFilter, path: string): object {
    const from = this.filterBound(filter, 'from');
    const to = this.filterBound(filter, 'to');

    if (filter.propertyType === 'date' || filter.propertyType === 'multidate') {
      if (from !== undefined && to !== undefined) {
        return { [`${path}.value`]: { $elemMatch: { $gte: from, $lte: to } } };
      }
      if (from !== undefined) {
        return { [`${path}.value`]: { $elemMatch: { $gte: from } } };
      }
      if (to !== undefined) {
        return { [`${path}.value`]: { $elemMatch: { $lte: to } } };
      }
    }

    if (filter.propertyType === 'daterange' || filter.propertyType === 'multidaterange') {
      const rangeMatch: Record<string, unknown> = {};
      if (to !== undefined) {
        rangeMatch.from = { $lte: to };
      }
      if (from !== undefined) {
        rangeMatch.to = { $gte: from };
      }
      return { [`${path}.value`]: { $elemMatch: rangeMatch } };
    }

    return {};
  }

  private buildFilterMatch(filters: DatavizFilter[] = []): object[] {
    return filters.map(filter => {
      const path = this.metadataPath(filter.property);

      if (
        filter.scope === 'external' &&
        (filter.propertyType === 'date' ||
          filter.propertyType === 'multidate' ||
          filter.propertyType === 'daterange' ||
          filter.propertyType === 'multidaterange')
      ) {
        return this.buildExternalDateRangeMatch(filter, path);
      }

      switch (filter.operator) {
        case 'eq':
          return { [`${path}.value`]: this.filterBound(filter, 'value') };
        case 'ne':
          return { [`${path}.value`]: { $ne: this.filterBound(filter, 'value') } };
        case 'in':
          return { [`${path}.value`]: { $in: filter.values ?? [] } };
        case 'nin':
          return { [`${path}.value`]: { $nin: filter.values ?? [] } };
        case 'gte':
          return { [`${path}.value`]: { $gte: this.filterBound(filter, 'from') } };
        case 'lte':
          return { [`${path}.value`]: { $lte: this.filterBound(filter, 'to') } };
        case 'between':
          return {
            [`${path}.value`]: {
              $gte: this.filterBound(filter, 'from'),
              $lte: this.filterBound(filter, 'to'),
            },
          };
        case 'contains':
          return { [`${path}.value`]: { $regex: filter.value, $options: 'i' } };
        default:
          return {};
      }
    });
  }

  private inheritedValueField(property: string): object {
    return {
      $let: {
        vars: {
          inherited: `$${this.metadataPath(property)}.inheritedValue`,
        },
        in: {
          $cond: {
            if: { $isArray: '$$inherited' },
            then: { $arrayElemAt: ['$$inherited.value', 0] },
            else: '$$inherited.value',
          },
        },
      },
    };
  }

  private relationshipDimensionField(dim: DimensionSpec): object | string {
    if (dim.relationshipMode === 'related_entity') {
      return `$${this.metadataPath(dim.property)}.value`;
    }

    if (dim.relationshipMode === 'inherited') {
      if (dim.propertyType === 'multiselect') {
        return `$${this.metadataPath(dim.property)}.inheritedValue.value`;
      }
      return this.inheritedValueField(dim.property);
    }

    return this.inheritedValueField(dim.property);
  }

  private dimensionFieldExpression(dim: DimensionSpec): object | string {
    if (dim.property === TEMPLATE_DIMENSION_PROPERTY) {
      return '$template';
    }

    if (isRelationshipDimension(dim)) {
      return this.relationshipDimensionField(dim);
    }

    if (dim.propertyType === 'multiselect') {
      return `$${this.metadataPath(dim.property)}.value`;
    }

    return { $arrayElemAt: [`$${this.metadataPath(dim.property)}.value`, 0] };
  }

  private toUtcDateExpression(unixSeconds: object | string): object {
    return {
      $toDate: { $multiply: [unixSeconds, 1000] },
    };
  }

  private dateUnixSecondsExpression(dim: DimensionSpec, field: object | string): object {
    if (dim.propertyType === 'daterange' || dim.propertyType === 'multidaterange') {
      return {
        $let: {
          vars: { value: field },
          in: {
            $cond: {
              if: { $eq: [{ $type: '$$value' }, 'object'] },
              then: '$$value.from',
              else: '$$value',
            },
          },
        },
      };
    }

    return field as object;
  }

  private dimensionBucketExpression(dim: DimensionSpec): object | string {
    const field = this.dimensionFieldExpression(dim);

    if (!isDateLikePropertyType(dim.propertyType)) {
      return field;
    }

    const interval = dim.dateInterval ?? 'year';
    const unixSeconds = this.dateUnixSecondsExpression(dim, field);
    const dateExpr = this.toUtcDateExpression(unixSeconds);

    if (interval === 'year') {
      return { $year: { date: dateExpr, timezone: 'UTC' } };
    }

    if (interval === 'month') {
      return {
        $dateToString: { format: '%Y-%m', date: dateExpr, timezone: 'UTC' },
      };
    }

    if (interval === 'week') {
      return {
        $dateToString: { format: '%G-W%V', date: dateExpr, timezone: 'UTC' },
      };
    }

    if (interval === 'computed_years') {
      return {
        $dateDiff: {
          startDate: dateExpr,
          endDate: '$$NOW',
          unit: 'year',
        },
      };
    }

    return unixSeconds;
  }

  private measureFieldExpression(measure: MeasureSpec): object | string | undefined {
    if (!measure.property) {
      return undefined;
    }

    return this.dimensionFieldExpression({
      property: measure.property,
      propertyType: measure.propertyType ?? 'numeric',
    });
  }

  private buildMeasureGroupAccumulator(measure: MeasureSpec): Record<string, object> {
    if (measure.aggregation === 'count' || !measure.property) {
      return { count: { $sum: 1 } };
    }

    const field = this.measureFieldExpression(measure);
    if (!field) {
      return { count: { $sum: 1 } };
    }

    const operator = `$${measure.aggregation}`;
    return { count: { [operator]: field } };
  }

  private appendDimensionUnwindStages(pipeline: object[], dim: DimensionSpec): void {
    if (!dimensionNeedsUnwind(dim)) {
      return;
    }

    pipeline.push({
      $unwind: { path: `$${this.metadataPath(dim.property)}`, preserveNullAndEmptyArrays: true },
    });

    if (dim.relationshipMode === 'inherited' && dim.propertyType === 'multiselect') {
      pipeline.push({
        $unwind: {
          path: `$${this.metadataPath(dim.property)}.inheritedValue`,
          preserveNullAndEmptyArrays: true,
        },
      });
    }
  }

  private coerceMissingValueStages(pipeline: object[], field: '__primary' | '__secondary'): void {
    pipeline.push({
      $addFields: {
        [field]: {
          $cond: {
            if: {
              $or: [{ $eq: [`$${field}`, null] }, { $eq: [`$${field}`, ''] }],
            },
            then: DATAVIZ_MISSING_BUCKET_KEY,
            else: `$${field}`,
          },
        },
      },
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

export { MongoDatavizQueryExecutor };
