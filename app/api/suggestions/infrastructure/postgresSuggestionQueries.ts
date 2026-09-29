import { ObjectId } from 'mongodb';
import { PostgresTable } from '#api/core/infrastructure/postgresql/common/PostgresTable.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { PostgresIXSuggestionsMapper } from './PostgresIXSuggestionsMapper.js';
import type { IXSuggestionsRow } from './PostgresIXSuggestionsRow.js';
import { SqlFragment } from './postgresSuggestionPredicates.js';

/** Building blocks for the reads of `PostgresIXSuggestionsDataSource`. */

type Query = PostgresTable<IXSuggestionsRow>;

const toHex = (id: ObjectIdSchema) => id.toString();

/**
 * For ids that arrive from outside. One that cannot be an ObjectId cannot match a stored row, so
 * it is dropped, as `MongoIXSuggestionsDataSource.toMatchableObjectIds` does.
 */
const toMatchableHex = (ids: ObjectIdSchema[]) =>
  ids
    .filter(id => ObjectId.isValid(id))
    .map(id => (id instanceof ObjectId ? id : new ObjectId(id.toString())).toHexString());

/** Parenthesised: `whereRaw` does not group, and a fragment may be an `OR` chain. */
const satisfying = (query: Query, { sql, bindings }: SqlFragment) =>
  query.whereRaw(`(${sql})`, bindings);

const toSuggestions = async (query: Query) =>
  (await query.all()).map(row => PostgresIXSuggestionsMapper.toDomain(row));

const toEntityIds = async (query: Query) =>
  (await query.distinct(['entityId']).all()).map(row => row.entityId);

export { satisfying, toEntityIds, toHex, toMatchableHex, toSuggestions };
