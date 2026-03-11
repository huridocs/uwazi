import { Db } from 'mongodb';

type IndexSpec = {
  collectionName: string;
  name: string;
  key: Record<string, 1 | -1>;
  unique?: boolean;
};

const INDEXES: IndexSpec[] = [
  {
    collectionName: 'csv_imports',
    name: 'createdAt_desc',
    key: { createdAt: -1 },
  },
  {
    collectionName: 'csv_import_rows',
    name: 'importId_rowIndex_unique',
    key: { importId: 1, rowIndex: 1 },
    unique: true,
  },
  {
    collectionName: 'csv_import_row_errors',
    name: 'importId_rowIndex',
    key: { importId: 1, rowIndex: 1 },
  },
  {
    collectionName: 'csv_import_thesauri_values',
    name: 'importId_thesaurusId_unique',
    key: { importId: 1, thesaurusId: 1 },
    unique: true,
  },
  {
    collectionName: 'csv_import_relationships_pending_values',
    name: 'importId_templateId_unique',
    key: { importId: 1, templateId: 1 },
    unique: true,
  },
  {
    collectionName: 'csv_import_relationships_values',
    name: 'importId_templateId_unique',
    key: { importId: 1, templateId: 1 },
    unique: true,
  },
];

const sameKey = (left: Record<string, any>, right: Record<string, any>) =>
  JSON.stringify(left) === JSON.stringify(right);

const isNamespaceMissingError = (error: unknown) =>
  (error as { codeName?: string })?.codeName === 'NamespaceNotFound' ||
  (error as Error)?.message?.includes('ns does not exist');

const getIndexesOrEmpty = async (db: Db, collectionName: string) => {
  try {
    return await db.collection(collectionName).indexes();
  } catch (error) {
    if (isNamespaceMissingError(error)) {
      return [];
    }
    throw error;
  }
};

const ensureIndex = async (db: Db, spec: IndexSpec) => {
  const collection = db.collection(spec.collectionName);
  const indexes = await getIndexesOrEmpty(db, spec.collectionName);

  const existingByName = indexes.find(index => index.name === spec.name);
  if (existingByName) {
    return;
  }

  const existingByKey = indexes.find(index => sameKey(index.key, spec.key));
  if (existingByKey) {
    return;
  }

  await collection.createIndex(spec.key, {
    name: spec.name,
    unique: Boolean(spec.unique),
    background: true,
  });
};

export default {
  delta: 185,

  name: 'csv_v2_indexes',

  description: 'Adds baseline Mongo indexes for csv.v2 collections.',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);
    for (const spec of INDEXES) {
      // eslint-disable-next-line no-await-in-loop
      await ensureIndex(db, spec);
    }
  },
};
