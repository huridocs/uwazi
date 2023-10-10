import process from 'process';

import mongodb from 'mongodb';

const getClient = async () => {
  const url = process.env.DBHOST ? `mongodb://${process.env.DBHOST}/` : 'mongodb://127.0.0.1/';
  const client = new mongodb.MongoClient(url, { useUnifiedTopology: true });
  await client.connect();

  return client;
};

const paddedPrint = (content, length) => {
  process.stdout.write(
    `${content}${Array(length - content.length)
      .fill('-')
      .join('')}\n`
  );
};

const describeCollection = async (collectionName, db) => {
  paddedPrint(collectionName, 60);
  const collection = db.collection(collectionName);
  paddedPrint('indices:', 30);
  const indices = await collection.indexInformation();
  Object.entries(indices).forEach(([name, description]) => {
    process.stdout.write(`${name}: ${JSON.stringify(description)}\n`);
  });
  paddedPrint('validator:', 30);
  const options = await collection.options();
  const validator = options.validator || {};
  process.stdout.write(JSON.stringify(validator, null, 2));
  process.stdout.write('\n');
};

const describeDb = async () => {
  const client = await getClient();
  const db = client.db(process.env.DATABASE_NAME || 'uwazi_development');

  const names = new Set(process.argv.slice(2));
  let collections = (await db.listCollections().toArray()).map(c => c.name).sort();
  if (names.size) collections = collections.filter(c => names.has(c));
  for (let i = 0; i < collections.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await describeCollection(collections[i], db);
  }

  client.close();
};

describeDb();
