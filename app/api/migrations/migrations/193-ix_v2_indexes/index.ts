import { Db } from 'mongodb';

type IndexSpec = {
  collectionName: string;
  name: string;
  key: Record<string, 1 | -1>;
  unique?: boolean;
};

const INDEXES: IndexSpec[] = [
  {
    collectionName: 'segmentations',
    name: 'fileID_status',
    key: { fileID: 1, status: 1 },
  },
  {
    collectionName: 'segmentations',
    name: 'filename_status',
    key: { filename: 1, status: 1 },
  },
  {
    collectionName: 'segmentations',
    name: 'xmlname_1',
    key: { xmlname: 1 },
  },
  {
    collectionName: 'ixsuggestions',
    name: 'extractorId_entityId_language',
    key: { extractorId: 1, entityId: 1, language: 1 },
  },
  {
    collectionName: 'ixsuggestions',
    name: 'extractorId_entityId_fileId',
    key: { extractorId: 1, entityId: 1, fileId: 1 },
  },
  {
    collectionName: 'ixsuggestions',
    name: 'extractorId_fileId',
    key: { extractorId: 1, fileId: 1 },
  },
  {
    collectionName: 'ixsuggestions',
    name: 'extractorId_1',
    key: { extractorId: 1 },
  },
  {
    collectionName: 'entities',
    name: 'sharedId_language',
    key: { sharedId: 1, language: 1 },
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
  delta: 193,

  name: 'ix_v2_indexes',

  description: 'Adds baseline Mongo indexes for IX v2 hot paths.',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);
    for (const spec of INDEXES) {
      // eslint-disable-next-line no-await-in-loop
      await ensureIndex(db, spec);
    }
  },
};
