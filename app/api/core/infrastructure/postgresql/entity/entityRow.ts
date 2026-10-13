import { ObjectId } from 'mongodb';
import { EntityDBO } from '#api/core/infrastructure/mongodb/entity/EntityDBO.js';
import { EntityRow } from './PostgresEntityRow.js';

/**
 * Identity may not be invented. `new ObjectId(undefined)` mints a fresh id, so a row that lost its
 * `_id` to a projection used to map to an entity that exists nowhere — and that id was written
 * into suggestions which could then never be accepted (F49).
 *
 * Every other column is projectable and simply absent when it was not selected; identity is not,
 * so a row without one is a programming error upstream, and this is where it is cheapest to see.
 */
const requireId = (value: string | undefined | null, table: string) => {
  if (!value) {
    throw new Error(`${table}: cannot map a row with no "_id" — the projection dropped it`);
  }
  return new ObjectId(value);
};

const toEntityDBO = (row: EntityRow): EntityDBO => ({
  _id: requireId(row._id, 'entities'),
  sharedId: row.sharedId,
  language: row.language,
  template: (row.template ? new ObjectId(row.template) : undefined) as EntityDBO['template'],
  title: row.title,
  icon: (row.icon ?? undefined) as EntityDBO['icon'],
  metadata: row.metadata as EntityDBO['metadata'],
  obsoleteMetadata: [],
  user: row.user ? new ObjectId(row.user) : undefined,
  published: row.published as boolean,
  creationDate: Number(row.creationDate),
  editDate: Number(row.editDate),
  generatedToc: row.generatedToc ?? undefined,
  permissions: row.permissions as EntityDBO['permissions'],
  preview: row.preview ?? undefined,
});

export { toEntityDBO };
