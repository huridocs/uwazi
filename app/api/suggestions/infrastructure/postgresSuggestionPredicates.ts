import type { Knex } from 'knex';
import { IXSuggestionStateType } from '#shared/types/suggestionType.js';
import {
  AcceptanceQuery,
  PendingStatusFilter,
  RunScope,
} from '../domain/IXSuggestionsDataSource.js';

/**
 * The SQL counterparts of the Mongo filters in `MongoIXSuggestionsDataSource`, as `WHERE`
 * fragments over `ix_suggestions`. Shared by the data source and the query services, as
 * `pendingMatch` is shared with the Mongo sampler.
 *
 * Mongo's `{ 'state.x': { $ne: true } }` matches an absent state, an absent flag, null and false;
 * `IS DISTINCT FROM 'true'` matches the same four, including a NULL `state` column.
 */

type SqlFragment = { sql: string; bindings: Knex.Value[] };

const fragment = (sql: string, bindings: Knex.Value[] = []): SqlFragment => ({ sql, bindings });

const allOf = (...fragments: SqlFragment[]): SqlFragment =>
  fragment(
    fragments.map(({ sql }) => `(${sql})`).join(' AND '),
    fragments.flatMap(({ bindings }) => bindings)
  );

/** `state.<flag>` is true, or — with `set` false — anything but true. */
const stateFlagPredicate = (flag: keyof IXSuggestionStateType, set: boolean): SqlFragment =>
  fragment(`("state"->'${flag}') ${set ? '=' : 'IS DISTINCT FROM'} 'true'::jsonb`);

/** Dated, and neither obsolete nor errored — what "this suggestion actually answered" means. */
const healthyPredicate = allOf(
  fragment('"date" IS NOT NULL'),
  stateFlagPredicate('obsolete', false),
  stateFlagPredicate('error', false)
);

/** Tagged with this process run. */
const runPredicate = (runTimestamp: number) =>
  fragment(`("modelData"->>'suggestionsRunTimestamp')::bigint = ?`, [runTimestamp]);

/** The three non-ready statuses; an empty filter means all three. */
const pendingPredicate = (filter: PendingStatusFilter = {}): SqlFragment => {
  const selected = filter.nonProcessed || filter.obsolete || filter.error;
  const include = (status: keyof PendingStatusFilter) => !selected || filter[status];
  const dated = fragment('"date" IS NOT NULL');

  const matchAny = [
    include('nonProcessed') ? fragment('"date" IS NULL') : null,
    include('obsolete') ? allOf(dated, stateFlagPredicate('obsolete', true)) : null,
    include('error') ? allOf(dated, stateFlagPredicate('error', true)) : null,
  ].filter((match): match is SqlFragment => match !== null);

  return fragment(matchAny.map(({ sql }) => `(${sql})`).join(' OR '));
};

const scopePredicates = (scope: RunScope): SqlFragment[] => {
  if (scope.kind === 'entities') {
    return [fragment('"entityId" = ANY(?::text[])', [scope.entityIds])];
  }
  if (scope.kind === 'run') {
    return [runPredicate(scope.runTimestamp)];
  }
  return [];
};

/** The suggestions auto-acceptance may take: ready, suggested, healthy, within the scope. */
const acceptancePredicate = ({
  extractorId,
  scope,
  includeAlreadyValued,
}: AcceptanceQuery): SqlFragment =>
  allOf(
    fragment('"extractorId" = ?', [extractorId.toString()]),
    fragment(`"status" = 'ready'`),
    stateFlagPredicate('withSuggestion', true),
    healthyPredicate,
    ...(includeAlreadyValued ? [] : [stateFlagPredicate('withValue', false)]),
    ...scopePredicates(scope)
  );

export type { SqlFragment };
export {
  acceptancePredicate,
  healthyPredicate,
  pendingPredicate,
  runPredicate,
  stateFlagPredicate,
};
