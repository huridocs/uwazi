import { Collection, Db, Document } from 'mongodb';

const INDICES_TO_REMOVE = {
  ixsuggestions: ['extractorId_1_tate.labeled_1_state.withSuggestion_1'],
};

const handleCollection = async (collection: Collection<Document>, indexNames: string[]) => {
  await indexNames.reduce(async (prev, indexName) => {
    await prev;
    if (await collection.indexExists(indexName)) {
      await collection.dropIndex(indexName);
      return Promise.resolve();
    }
    return Promise.resolve();
  }, Promise.resolve());
};

// eslint-disable-next-line import/no-default-export
export default {
  delta: 168,

  name: 'remove_obsolete_mongo_index',

  description: 'Removes obsolete or wrongly named indices from mongodb.',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const existingCollections = new Set(
      (await db.collections()).map(collection => collection.collectionName)
    );
    const indices = Object.entries(INDICES_TO_REMOVE).filter(pair =>
      existingCollections.has(pair[0])
    );

    await indices.reduce(async (prev, [collectionName, collectionParam]) => {
      await prev;
      return handleCollection(await db.collection(collectionName), collectionParam);
    }, Promise.resolve());
  },
};
