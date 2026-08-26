import { DatavizFilter, DimensionSpec, MeasureSpec } from '#shared/types/datavizSchema.js';
import { TEMPLATE_DIMENSION_PROPERTY } from '#shared/types/datavizSchema.js';
import { isDateLikePropertyType } from '#shared/dataviz/dimensionPropertyTypes.js';
import { dimensionNeedsUnwind } from '#shared/dataviz/relationshipDimension.js';
import { DATAVIZ_MISSING_BUCKET_KEY } from '#shared/dataviz/missingBucket.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import {
  PostgresDataSource,
  PostgresDataSourceDeps,
} from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { PostgresTable } from '#api/core/infrastructure/postgresql/common/PostgresTable.js';
import { PostgresPermissionEnforcedTable } from '#api/core/infrastructure/postgresql/common/PostgresPermissionEnforcedTable.js';
import type { EntityRow } from '#api/core/infrastructure/postgresql/entity/PostgresEntityRow.js';
import {
  AggregateSourceParams,
  CountSourceEntitiesParams,
  DatavizAggregationStrategy,
  RawBucket,
} from '#api/dataviz.v2/application/contracts/DatavizAggregationStrategy.js';
import { mergeSourceFilters } from '#api/dataviz.v2/application/services/datavizSourceFilters.js';

type Deps = PostgresDataSourceDeps;

type BucketRow = {
  __primary: string | null;
  __secondary?: string | null;
  count: number;
};

const quote = (identifier: string): string => `'${identifier.replace(/'/g, "''")}'`;

/** Whether the Mongo executor emits numeric bucket keys for this dimension. */
const isNumericKeyDimension = (dim: DimensionSpec): boolean => {
  if (dim.propertyType === 'numeric') {
    return true;
  }
  if (!isDateLikePropertyType(dim.propertyType)) {
    return false;
  }
  const interval = dim.dateInterval ?? 'year';
  return interval !== 'month' && interval !== 'week';
};

const toBucketValue = (raw: string | null, dim: DimensionSpec): string | number => {
  if (raw === null || raw === '' || raw === DATAVIZ_MISSING_BUCKET_KEY) {
    return DATAVIZ_MISSING_BUCKET_KEY;
  }
  if (isNumericKeyDimension(dim)) {
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? raw : parsed;
  }
  return raw;
};

class PostgresDatavizQueryExecutor
  extends PostgresDataSource<EntityRow>
  implements DatavizAggregationStrategy
{
  private permissionTable: PostgresPermissionEnforcedTable<EntityRow>;

  constructor({ tenantId, pgTransactionManager }: Deps) {
    super('entities', { tenantId, pgTransactionManager });
    this.permissionTable = PostgresPermissionEnforcedTable.for<EntityRow>({
      tableName: 'entities',
      tenantId,
      transactionManager: pgTransactionManager,
      accessContext: AccessContext.system(),
    });
  }

  protected override get table(): PostgresTable<EntityRow> {
    return this.permissionTable;
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
    } = params;

    const where = this.buildWhere({
      sourceTemplateId,
      language,
      includeUnpublished,
      filters: mergeSourceFilters(query.filters, externalFilters, source, sourceIndex),
    });

    const result = await this.runQuery<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM entities WHERE ${where.sql}`,
      where.bindings
    );

    return result.rows[0]?.count ?? 0;
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
    } = params;

    const where = this.buildWhere({
      sourceTemplateId,
      language,
      includeUnpublished,
      filters: mergeSourceFilters(query.filters, externalFilters, source, sourceIndex),
    });

    const { joins, aliases } = this.buildLateralJoins([primaryDim, secondaryDim]);

    const primary = this.dimensionBucketExpression(primaryDim, aliases);
    const secondary = secondaryDim
      ? this.dimensionBucketExpression(secondaryDim, aliases)
      : undefined;

    const columns = [
      `${this.coerceGroupKey(primary)} AS __primary`,
      ...(secondary ? [`${this.coerceGroupKey(secondary)} AS __secondary`] : []),
      `${this.measureAccumulatorExpression(query.measures[0])} AS count`,
    ];

    const groupBy = secondary ? 'GROUP BY __primary, __secondary' : 'GROUP BY __primary';
    const bindings = [...where.bindings];
    let limit = '';
    if (!secondary) {
      limit = 'LIMIT ?';
      bindings.push(maxBuckets);
    }

    const sql = `SELECT ${columns.join(', ')} FROM entities ${joins.join(' ')} WHERE ${
      where.sql
    } ${groupBy} ORDER BY count DESC ${limit}`;

    const result = await this.runQuery<BucketRow>(sql, bindings);

    return result.rows.map(row => ({
      _id:
        secondaryDim && secondary
          ? {
              primary: toBucketValue(row.__primary, primaryDim),
              secondary: toBucketValue(row.__secondary ?? null, secondaryDim),
            }
          : toBucketValue(row.__primary, primaryDim),
      count: row.count,
    }));
  }

  private async runQuery<T>(sql: string, bindings: unknown[]): Promise<{ rows: T[] }> {
    const raw = await this.table.raw(sql, bindings);
    return raw as unknown as { rows: T[] };
  }

  private buildWhere(params: {
    sourceTemplateId: string;
    language: string;
    includeUnpublished: boolean;
    filters: DatavizFilter[];
  }): { sql: string; bindings: unknown[] } {
    const conditions: string[] = [];
    const bindings: unknown[] = [];

    conditions.push('template = ?');
    bindings.push(params.sourceTemplateId);

    conditions.push('language = ?');
    bindings.push(params.language);

    if (!params.includeUnpublished) {
      conditions.push('published = ?');
      bindings.push(true);
    }

    params.filters.forEach(filter => {
      const condition = this.filterCondition(filter);
      if (condition) {
        conditions.push(condition.sql);
        bindings.push(...condition.bindings);
      }
    });

    return { sql: conditions.join(' AND '), bindings };
  }

  private filterCondition(filter: DatavizFilter): { sql: string; bindings: unknown[] } | null {
    const elem = `jsonb_array_elements(metadata->${quote(filter.property)}) AS f`;

    if (
      filter.scope === 'external' &&
      (filter.propertyType === 'daterange' || filter.propertyType === 'multidaterange')
    ) {
      // Range overlap: element.from <= to AND element.to >= from (matches the
      // Mongo $elemMatch semantics).
      const from = filter.from ?? filter.value ?? null;
      const to = filter.to ?? filter.value ?? null;
      const conditions: string[] = [];
      const bindings: unknown[] = [];
      if (from !== null) {
        conditions.push("(f->'value'->>'to')::bigint >= ?");
        bindings.push(from);
      }
      if (to !== null) {
        conditions.push("(f->'value'->>'from')::bigint <= ?");
        bindings.push(to);
      }
      if (conditions.length === 0) {
        return null;
      }
      return {
        sql: `EXISTS (SELECT 1 FROM ${elem} WHERE ${conditions.join(' AND ')})`,
        bindings,
      };
    }

    if (filter.operator === 'contains') {
      return {
        sql: `EXISTS (SELECT 1 FROM ${elem} WHERE f->>'value' ILIKE ?)`,
        bindings: [`%${filter.value}%`],
      };
    }

    switch (filter.operator) {
      case 'eq':
        return this.equalityCondition(elem, filter, false);
      case 'ne':
        return this.equalityCondition(elem, filter, true);
      case 'in':
        return {
          sql: `EXISTS (SELECT 1 FROM ${elem} WHERE f->>'value' = ANY(?) )`,
          bindings: [filter.values ?? []],
        };
      case 'nin':
        return {
          sql: `NOT EXISTS (SELECT 1 FROM ${elem} WHERE f->>'value' = ANY(?) )`,
          bindings: [filter.values ?? []],
        };
      case 'gte':
        return this.compareCondition(elem, '>=', filter, 'from');
      case 'lte':
        return this.compareCondition(elem, '<=', filter, 'to');
      case 'between':
        return this.compareRangeCondition(elem, filter);
      default:
        return null;
    }
  }

  /**
   * Equality/negation filter. Numeric properties compare typed values
   * (mirroring MongoDatavizQueryExecutor.filterBound), so a string bound like
   * '2500.0' still matches a stored JSON number 2500. Other property types
   * keep the text comparison.
   */
  private equalityCondition(
    elem: string,
    filter: DatavizFilter,
    negated: boolean
  ): { sql: string; bindings: unknown[] } | null {
    const bound = this.filterBoundValue(filter, 'value');
    if (bound === undefined) {
      return null;
    }
    const valueExpr = filter.propertyType === 'numeric' ? "(f->>'value')::numeric" : "f->>'value'";
    const clause = `EXISTS (SELECT 1 FROM ${elem} WHERE ${valueExpr} = ?)`;
    return {
      sql: negated ? `NOT ${clause}` : clause,
      bindings: [bound],
    };
  }

  /** Mirrors MongoDatavizQueryExecutor.filterBound: numeric bounds are coerced. */
  private filterBoundValue(
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

  private coerceNumericBound(value: string | number | undefined): string | number | undefined {
    if (value === undefined || value === '') {
      return undefined;
    }
    if (typeof value === 'number') {
      return value;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Range filter (gte/lte). Numeric bounds are coerced and compared as
   * ::numeric (mirroring MongoDatavizQueryExecutor.filterBound), so string
   * bounds like '3000.0' work and floats are not truncated by ::bigint.
   */
  private compareCondition(
    elem: string,
    operator: string,
    filter: DatavizFilter,
    bound: 'from' | 'to'
  ): { sql: string; bindings: unknown[] } | null {
    const value = this.filterBoundValue(filter, bound);
    if (value === undefined) {
      return null;
    }
    return {
      sql: `EXISTS (SELECT 1 FROM ${elem} WHERE (f->>'value')::numeric ${operator} ?)`,
      bindings: [value],
    };
  }

  private compareRangeCondition(
    elem: string,
    filter: DatavizFilter
  ): { sql: string; bindings: unknown[] } | null {
    const from = this.filterBoundValue(filter, 'from');
    const to = this.filterBoundValue(filter, 'to');
    if (from === undefined || to === undefined) {
      return null;
    }
    return {
      sql: `EXISTS (SELECT 1 FROM ${elem} WHERE (f->>'value')::numeric BETWEEN ? AND ?)`,
      bindings: [from, to],
    };
  }

  private measureAccumulatorExpression(measure: MeasureSpec | undefined): string {
    if (!measure || measure.aggregation === 'count' || !measure.property) {
      return 'COUNT(*)::int';
    }
    // float8 so the driver returns JS numbers (matching Mongo's int/double).
    const field = `(metadata->${quote(measure.property)}->0->>'value')::float8`;
    const operator = measure.aggregation.toUpperCase();
    return `COALESCE(${operator}(${field}), 0)::float8`;
  }

  private buildLateralJoins(dims: (DimensionSpec | undefined)[]): {
    joins: string[];
    aliases: Map<string, string>;
  } {
    const joins: string[] = [];
    const aliases = new Map<string, string>();
    let counter = 0;

    dims.forEach(dim => {
      if (!dim || !dimensionNeedsUnwind(dim)) {
        return;
      }
      if (aliases.has(`${dim.property}:1`)) {
        return;
      }
      const first = `u${counter}`;
      counter += 1;
      aliases.set(`${dim.property}:1`, first);
      joins.push(
        `LEFT JOIN LATERAL jsonb_array_elements(metadata->${quote(
          dim.property
        )}) AS ${first} ON TRUE`
      );
      if (dim.relationshipMode === 'inherited' && dim.propertyType === 'multiselect') {
        const second = `u${counter}`;
        counter += 1;
        aliases.set(`${dim.property}:2`, second);
        joins.push(
          `LEFT JOIN LATERAL jsonb_array_elements(${first}->'inheritedValue') AS ${second} ON TRUE`
        );
      }
    });

    return { joins, aliases };
  }

  private dimensionFieldExpression(dim: DimensionSpec, aliases: Map<string, string>): string {
    if (dim.property === TEMPLATE_DIMENSION_PROPERTY) {
      return 'template';
    }

    if (dimensionNeedsUnwind(dim)) {
      const first = aliases.get(`${dim.property}:1`);
      if (dim.relationshipMode === 'related_entity') {
        return `(${first}->>'value')`;
      }
      if (dim.relationshipMode === 'inherited') {
        if (dim.propertyType === 'multiselect') {
          return `(${aliases.get(`${dim.property}:2`)}->>'value')`;
        }
        const inheritedValue = `${first}->'inheritedValue'`;
        return `CASE WHEN jsonb_typeof(${inheritedValue}) = 'array' THEN (${inheritedValue}->0->>'value') ELSE (${inheritedValue}->>'value') END`;
      }
      return `(${first}->>'value')`;
    }

    return `(metadata->${quote(dim.property)}->0->>'value')`;
  }

  /** JSONB form of the dimension value (for date-range fields, which store `{from,to}` objects). */
  private dimensionJsonbValueExpression(dim: DimensionSpec, aliases: Map<string, string>): string {
    if (dimensionNeedsUnwind(dim)) {
      const first = aliases.get(`${dim.property}:1`);
      return `(${first}->'value')`;
    }
    return `(metadata->${quote(dim.property)}->0->'value')`;
  }

  private dimensionBucketExpression(
    dim: DimensionSpec,
    aliases: Map<string, string>
  ): { sql: string } {
    if (!isDateLikePropertyType(dim.propertyType)) {
      return { sql: this.dimensionFieldExpression(dim, aliases) };
    }

    const interval = dim.dateInterval ?? 'year';
    const isRange = dim.propertyType === 'daterange' || dim.propertyType === 'multidaterange';
    const unixSeconds = isRange
      ? this.dateRangeUnixSecondsExpression(dim, aliases)
      : `(${this.dimensionFieldExpression(dim, aliases)})::bigint`;
    const dateExpr = `to_timestamp(${unixSeconds})`;

    if (interval === 'month') {
      return { sql: `to_char(${dateExpr}, 'YYYY-MM')` };
    }
    if (interval === 'week') {
      return { sql: `to_char(${dateExpr}, 'IYYY-"W"IW')` };
    }
    if (interval === 'computed_years') {
      return { sql: `date_part('year', age(now(), ${dateExpr}))::int` };
    }
    return { sql: `EXTRACT(YEAR FROM ${dateExpr})::int` };
  }

  private dateRangeUnixSecondsExpression(dim: DimensionSpec, aliases: Map<string, string>): string {
    const raw = this.dimensionJsonbValueExpression(dim, aliases);
    return `CASE WHEN jsonb_typeof(${raw}) = 'object' THEN (${raw}->>'from')::bigint ELSE (${raw}#>>'{}')::bigint END`;
  }

  private coerceGroupKey(expr: { sql: string }): string {
    const missingKey = quote(DATAVIZ_MISSING_BUCKET_KEY);
    return `CASE WHEN NULLIF(${expr.sql}::text, '') IS NULL THEN ${missingKey} ELSE ${expr.sql}::text END`;
  }
}

export { PostgresDatavizQueryExecutor };
