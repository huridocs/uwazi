import { ObjectId } from 'mongodb';
import { MigrationConfig } from '../MigrateCollectionToPostgres.js';

/**
 * `members` is the one field that changes shape rather than just type. Mongo stores
 * `[{ refId: '<userId>' }]`; the Postgres table stores a flat `jsonb` array of id strings,
 * which is what `PostgresUserGroupsDAO` queries with `jsonb_array_elements_text` and
 * `whereJsonSupersetOfAny`. Copying the Mongo shape across verbatim would produce a table
 * that reads as every group having no members — i.e. a silent loss of permissions, not an
 * error — so the flattening here is load-bearing.
 */
export const UserGroupsMigrationConfig: MigrationConfig = {
  mongoCollection: 'usergroups',
  pgTable: 'usergroups',
  mapDocument(doc: Record<string, unknown>) {
    const _id = doc._id instanceof ObjectId ? doc._id.toHexString() : String(doc._id);

    const members = Array.isArray(doc.members)
      ? doc.members
          .map(member => {
            if (member instanceof ObjectId) return member.toHexString();
            if (typeof member === 'string') return member;

            const refId = (member as { refId?: unknown })?.refId;
            return refId instanceof ObjectId ? refId.toHexString() : refId;
          })
          .filter((refId): refId is string => typeof refId === 'string' && refId.length > 0)
      : [];

    return {
      _id,
      name: doc.name,
      members: JSON.stringify(members),
    };
  },
};
