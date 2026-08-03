import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import { Filter } from 'mongodb';

/**
 * Converts an AccessContext into MongoDB-specific filter conditions.
 *
 * Each backend (Mongo, Postgres) has its own translator implementation.
 * The translator receives the caller's existing MongoDB filter and returns
 * a new filter with permission conditions applied. The returned filter is the
 * one that will be sent to the database.
 */
interface MongoPermissionTranslator {
  /** Add read conditions to the filter (find, findOne, countDocuments, distinct). */
  applyReadCondition(filter: Filter<any>, ac: AccessContext): Filter<any>;

  /** Add write conditions to the filter (updateOne/Many, deleteOne/Many, replaceOne, bulkWrite). */
  applyWriteCondition(filter: Filter<any>, ac: AccessContext): Filter<any>;
}

export type { MongoPermissionTranslator };
