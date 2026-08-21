import { AnyBulkWriteOperation, Collection, Db, Document, ObjectId } from 'mongodb';

const CONTEXT_TYPES = ['Entity', 'Relationship Type', 'Uwazi UI', 'Thesaurus'] as const;
const BATCH_SIZE = 500;

type ContextType = (typeof CONTEXT_TYPES)[number];

type ContextMeta = { type: ContextType; label: string };

type TranslationContextDoc = {
  id?: string;
  type?: string;
  label?: string;
};

const INCOMPLETE_CONTEXT_FILTER = {
  $or: [
    { 'context.type': { $exists: false } },
    { 'context.type': null },
    { 'context.type': '' },
    { 'context.label': { $exists: false } },
    { 'context.label': null },
    { 'context.label': '' },
  ],
};

const isContextType = (value: unknown): value is ContextType =>
  typeof value === 'string' && (CONTEXT_TYPES as readonly string[]).includes(value);

const remember = (
  catalog: Map<string, ContextMeta>,
  id: unknown,
  type: unknown,
  label: unknown
) => {
  if (
    typeof id !== 'string' ||
    !id ||
    catalog.has(id) ||
    !isContextType(type) ||
    typeof label !== 'string' ||
    !label
  ) {
    return;
  }
  catalog.set(id, { type, label });
};

const loadCompleteContexts = async (db: Db, catalog: Map<string, ContextMeta>) => {
  const docs = await db
    .collection('translationsV2')
    .find(
      {
        'context.id': { $type: 'string', $ne: '' },
        'context.type': { $in: [...CONTEXT_TYPES] },
        'context.label': { $type: 'string', $ne: '' },
      },
      { projection: { context: 1 } }
    )
    .toArray();

  docs.forEach(doc => {
    const context = (doc.context ?? {}) as TranslationContextDoc;
    remember(catalog, context.id, context.type, context.label);
  });
};

const loadNamedContexts = async (
  db: Db,
  collection: string,
  type: ContextType,
  catalog: Map<string, ContextMeta>
) => {
  const docs = await db
    .collection(collection)
    .find({}, { projection: { name: 1 } })
    .toArray();

  docs.forEach(doc => {
    const id = doc._id instanceof ObjectId ? doc._id.toHexString() : String(doc._id);
    remember(catalog, id, type, doc.name);
  });
};

const loadCatalog = async (db: Db) => {
  const catalog = new Map<string, ContextMeta>();
  await loadCompleteContexts(db, catalog);
  await loadNamedContexts(db, 'templates', 'Entity', catalog);
  await loadNamedContexts(db, 'dictionaries', 'Thesaurus', catalog);
  await loadNamedContexts(db, 'relationtypes', 'Relationship Type', catalog);
  remember(catalog, 'System', 'Uwazi UI', 'User Interface');
  remember(catalog, 'Menu', 'Uwazi UI', 'Menu');
  remember(catalog, 'Filters', 'Uwazi UI', 'Filters');
  return catalog;
};

const resolveContext = (context: TranslationContextDoc, catalog: Map<string, ContextMeta>) => {
  const id = context.id ?? '';
  const known = catalog.get(id);
  const type = isContextType(context.type) ? context.type : known?.type;
  const label = context.label || known?.label;

  if (!id || !type || !label) {
    const fields = `id=${JSON.stringify(id)}, type=${JSON.stringify(type)}, label=${JSON.stringify(label)}`;
    throw new Error(`translationsV2 document is missing required context fields (${fields})`);
  }

  return { id, type, label };
};

const toUpdate = (doc: Document, catalog: Map<string, ContextMeta>): AnyBulkWriteOperation => {
  const resolved = resolveContext((doc.context ?? {}) as TranslationContextDoc, catalog);
  return {
    updateOne: {
      filter: { _id: doc._id },
      update: {
        $set: {
          'context.id': resolved.id,
          'context.type': resolved.type,
          'context.label': resolved.label,
        },
      },
    },
  };
};

const chunkOps = (ops: AnyBulkWriteOperation[]) => {
  const batches: AnyBulkWriteOperation[][] = [];
  for (let index = 0; index < ops.length; index += BATCH_SIZE) {
    batches.push(ops.slice(index, index + BATCH_SIZE));
  }
  return batches;
};

const writeBatches = async (collection: Collection<Document>, ops: AnyBulkWriteOperation[]) =>
  chunkOps(ops).reduce(async (previous, batch) => {
    const total = await previous;
    const result = await collection.bulkWrite(batch);
    return total + result.modifiedCount;
  }, Promise.resolve(0));

const backfillIncompleteContexts = async (db: Db) => {
  const catalog = await loadCatalog(db);
  const collection = db.collection('translationsV2');
  const docs = await collection.find(INCOMPLETE_CONTEXT_FILTER).toArray();
  return writeBatches(
    collection,
    docs.map(doc => toUpdate(doc, catalog))
  );
};

const applyContextValidator = async (db: Db) => {
  await db.command({
    collMod: 'translationsV2',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['language', 'key', 'value', 'context'],
        properties: {
          context: {
            bsonType: 'object',
            required: ['id', 'type', 'label'],
            properties: {
              id: { bsonType: 'string', minLength: 1 },
              type: { enum: [...CONTEXT_TYPES] },
              label: { bsonType: 'string', minLength: 1 },
            },
          },
        },
      },
    },
    validationLevel: 'strict',
    validationAction: 'error',
  });
};

// eslint-disable-next-line import/no-default-export
export default {
  delta: 206,

  name: 'backfill-translation-context',

  description:
    'Fills missing translationsV2 context.type / context.label from sibling rows, templates, thesauri, relationship types, or System defaults so the Postgres copy can insert NOT NULL context columns. Then attaches a collection validator so later writes cannot omit those fields before the Postgres cutover.',

  reindex: false,

  requiresSchema: 15,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);
    const modified = await backfillIncompleteContexts(db);
    process.stdout.write(`${this.name}: updated ${modified} translation(s).\r\n`);
    await applyContextValidator(db);
    process.stdout.write(`${this.name}: context validator applied.\r\n`);
  },
};
