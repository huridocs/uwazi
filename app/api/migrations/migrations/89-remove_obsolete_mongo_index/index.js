const INDICES_TO_REMOVE = {
  entities: ['template_1'],
  ixsuggestions: ['propertyName_text'],
};

const handleCollection = async (collection, indexNames) => {
  for (let j = 0; j < indexNames.length; j += 1) {
    const indexName = indexNames[j];
    // eslint-disable-next-line no-await-in-loop
    if (await collection.indexExists(indexName)) await collection.dropIndex(indexName);
  }
};

export default {
  delta: 89,

  name: 'remove_obsolete_mongo_index',

  description: 'Removes one or more obsolete indices from mongodb.',

  reindex: false,

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const existingCollections = new Set(
      (await db.collections()).map(collection => collection.collectionName)
    );
    const indices = Object.entries(INDICES_TO_REMOVE).filter(pair =>
      existingCollections.has(pair[0])
    );

    for (let i = 0; i < indices.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await handleCollection(await db.collection(indices[i][0]), indices[i][1]);
    }
  },
};
