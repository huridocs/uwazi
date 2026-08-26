/* eslint-disable max-lines */
import { Db, ObjectId } from 'mongodb';
import { DatavizQueryTimeoutError } from '#api/dataviz.v2/domain/errors.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import type { DatavizFilter, DimensionSpec, MeasureSpec } from '#shared/types/datavizSchema.js';
import { TEMPLATE_DIMENSION_PROPERTY } from '#shared/types/datavizSchema.js';
import { isDateLikePropertyType } from '#shared/dataviz/dimensionPropertyTypes.js';
import {
  dimensionNeedsUnwind,
  isRelationshipDimension,
} from '#shared/dataviz/relationshipDimension.js';
import { DATAVIZ_MISSING_BUCKET_KEY } from '#shared/dataviz/missingBucket.js';
import { EntityDBO } from '#api/core/infrastructure/mongodb/entity/EntityDBO.js';
import {
  AggregateSourceParams,
  CountSourceEntitiesParams,
  DatavizAggregationStrategy,
  RawBucket,
} from '#api/dataviz.v2/application/contracts/DatavizAggregationStrategy.js';
import { mergeSourceFilters as sharedMergeSourceFilters } from '#api/dataviz.v2/application/services/datavizSourceFilters.js';

class MongoDatavizQueryExecutor
  extends MongoDataSource<EntityDBO>
  implements DatavizAggregationStrategy
{
  protected collectionName = 'entities';

  constructor(db: Db, transactionManager: MongoTransactionManager) {
    super(db, transactionManager, {
      useSyncedCollection: false,
      accessContext: AccessContext.system(),
    });
  }

  async countSourceEntities(params: CountSourceEntitiesParams): Promise<number> {
    const {
      query,
      externalFilters,
      source,
      sourceIndex,
      sourceTemplateId,
      language,
      includeUnpublished,
      timeoutMs,
    } = params;

    const sourceFilters = sharedMergeSourceFilters(
      query.filters,
      externalFilters,
      source,
      sourceIndex
    );
    const permissionMatch = includeUnpublished ? {} : { published: true };
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

  async aggregateSource(params: AggregateSourceParams): Promise<RawBucket[]> {
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
      includeUnpublished,
      timeoutMs,
    } = params;

    const sourceFilters = sharedMergeSourceFilters(
      query.filters,
      externalFilters,
      source,
      sourceIndex
    );
    const permissionMatch = includeUnpublished ? {} : { published: true };

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

  private buildExternalDateRangeMatch(filter: DatavizFilter, path: string): object {
    const from = this.filterBound(filter, 'from');
    const to = this.filterBound(filter, 'to');

    if (filter.propertyType === 'date' || filter.propertyType === 'multidate') {
      const valueMatch: Record<string, unknown> = {};
      if (from !== undefined) {
        valueMatch.$gte = from;
      }
      if (to !== undefined) {
        valueMatch.$lte = to;
      }
      // `$elemMatch` on the *object* path (not `path.value`): the dotted path
      // through an array of objects makes `$elemMatch` fail to match.
      return { [path]: { $elemMatch: { value: valueMatch } } };
    }

    if (filter.propertyType === 'daterange' || filter.propertyType === 'multidaterange') {
      // Nested dotted paths inside $elemMatch: `value: { from: ..., to: ... }`
      // performs whole-document equality and fails to match operator documents.
      const rangeMatch: Record<string, unknown> = {};
      if (to !== undefined) {
        rangeMatch['value.from'] = { $lte: to };
      }
      if (from !== undefined) {
        rangeMatch['value.to'] = { $gte: from };
      }
      return { [path]: { $elemMatch: rangeMatch } };
    }

    return {};
  }

  buildFilterMatch(filters: DatavizFilter[] = []): object[] {
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

  buildMeasureGroupAccumulator(measure: MeasureSpec): Record<string, object> {
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
}

export { MongoDatavizQueryExecutor };
