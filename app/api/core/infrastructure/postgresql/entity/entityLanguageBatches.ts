import { EntityDBO } from '#api/core/infrastructure/mongodb/entity/EntityDBO.js';
import { MongoIdHandler } from '#api/core/infrastructure/mongodb/common/MongoIdGenerator.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { EntityRow } from './PostgresEntityRow.js';
import { EntityQuery } from './entityQuery.js';

const BATCH_SIZE = 500;

type ClonedBatch = {
  table: EntityQuery;
  rows: EntityRow[];
  to: LanguageISO6391;
  onBatch?: (clonedEntities: Omit<EntityDBO, '_id'>[]) => Promise<void>;
};

const insertClonedBatch = async ({ table, rows, to, onBatch }: ClonedBatch): Promise<void> => {
  const toInsert = rows.map(({ _id: _discarded, ...rest }) => ({
    ...rest,
    _id: MongoIdHandler.generate(),
    language: to,
  }));

  // An entity created while the language was installing already has its row for `to`.
  await table.upsert(toInsert, {
    columns: ['tenant_id', 'sharedId', 'language'],
    ignore: true,
  });
  if (onBatch) {
    await onBatch(
      toInsert.map(({ _id: _discarded, ...rest }) => rest as unknown as Omit<EntityDBO, '_id'>)
    );
  }
};

const cloneEntitiesForLanguage = async (copy: {
  table: EntityQuery;
  from: LanguageISO6391;
  to: LanguageISO6391;
  onBatch?: (clonedEntities: Omit<EntityDBO, '_id'>[]) => Promise<void>;
}): Promise<void> => {
  const { table, from, to, onBatch } = copy;
  let batch: EntityRow[] = [];
  for await (const row of table.where({ language: from }).stream()) {
    batch.push(row);
    if (batch.length >= BATCH_SIZE) {
      // eslint-disable-next-line no-await-in-loop
      await insertClonedBatch({ table, rows: batch, to, onBatch });
      batch = [];
    }
  }
  if (batch.length > 0) {
    await insertClonedBatch({ table, rows: batch, to, onBatch });
  }
};

const deleteBatch = async (batch: {
  table: EntityQuery;
  rows: { _id: string; sharedId: string }[];
  language: LanguageISO6391;
  onBatch?: (sharedIds: string[]) => Promise<void>;
}): Promise<void> => {
  const { table, rows, language, onBatch } = batch;
  const sharedIds = rows.map(row => row.sharedId);
  await table.where({ language }).whereIn('sharedId', sharedIds).delete();
  if (onBatch) {
    await onBatch(sharedIds);
  }
};

const deleteEntitiesForLanguage = async (removal: {
  table: EntityQuery;
  language: LanguageISO6391;
  onBatch?: (sharedIds: string[]) => Promise<void>;
}): Promise<void> => {
  const { table, language, onBatch } = removal;
  let batch: { _id: string; sharedId: string }[] = [];
  for await (const row of table.select(['_id', 'sharedId']).where({ language }).stream()) {
    batch.push(row);
    if (batch.length >= BATCH_SIZE) {
      // eslint-disable-next-line no-await-in-loop
      await deleteBatch({ table, rows: batch, language, onBatch });
      batch = [];
    }
  }
  if (batch.length > 0) {
    await deleteBatch({ table, rows: batch, language, onBatch });
  }
};

export { cloneEntitiesForLanguage, deleteEntitiesForLanguage };
