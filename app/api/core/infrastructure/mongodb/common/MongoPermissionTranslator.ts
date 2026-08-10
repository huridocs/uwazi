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
export interface MongoPermissionTranslator {
  /** Add read conditions to the filter (find, findOne, countDocuments, distinct). */
  applyReadCondition(filter: Filter<any>, ac: AccessContext): Filter<any>;

  /** Add write conditions to the filter (updateOne/Many, deleteOne/Many, replaceOne, bulkWrite). */
  applyWriteCondition(filter: Filter<any>, ac: AccessContext): Filter<any>;
}

/**
 * Default implementation: checks `published` and `permissions` fields.
 *
 * - Admin / editor: no restriction (privileged).
 * - Anonymous: published rows only.
 * - Collaborator: published rows OR rows where `permissions` array contains
 *   an entry with matching refId. For write, the entry must also have
 *   `level: 'write'`.
 */
export class MongoEntityPermissionTranslator implements MongoPermissionTranslator {
  applyReadCondition(filter: Filter<any>, ac: AccessContext): Filter<any> {
    if (ac.isPrivileged()) return filter;
    if (ac.isAnonymous()) {
      if (Object.keys(filter).length === 0) return { published: true };
      return { $and: [filter, { published: true }] };
    }

    const readPerm = {
      $or: [{ published: true }, { permissions: { $elemMatch: { refId: { $in: ac.refIds } } } }],
    };

    if (Object.keys(filter).length === 0) return readPerm;
    return { $and: [filter, readPerm] };
  }

  applyWriteCondition(filter: Filter<any>, ac: AccessContext): Filter<any> {
    if (ac.isPrivileged()) return filter;
    if (ac.isAnonymous()) return { _id: null };

    const writePerm = {
      permissions: { $elemMatch: { refId: { $in: ac.refIds }, level: 'write' } },
    };

    if (Object.keys(filter).length === 0) return writePerm;
    return { $and: [filter, writePerm] };
  }
}
