const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb://localhost:27017/?readPreference=primary&directConnection=true&ssl=false';

const client = new MongoClient(uri);

const DEFAULT_LANGUAGE = 'en';
const SHARED_ID = 'sharedid';
const TEMPLATE_ID = '5bfbb1a0471dd0fc16ada146';
const TITLE = 'Generated title';
const TOTAL_ENTITIES = 100000;

const entities = [];
const files = [];

for (let i = 0; i < TOTAL_ENTITIES; i += 1) {
  const entity = {
    title: `${TITLE} ${i}`,
    template: new ObjectId(TEMPLATE_ID),
    language: DEFAULT_LANGUAGE,
    sharedId: `${SHARED_ID}${i}`,
    creationDate: new Date().getTime(),
  };

  const file1 = {
    entity: entity.sharedId,
    language: 'eng',
    type: 'document',
    status: 'ready',
    mimetype: 'application/pdf',
    originalname: 'somefile.pdf',
    creationDate: new Date().getTime(),
  };

  const file2 = { ...file1, language: 'fra' };
  entities.push(entity);
  files.push(file1);
  files.push(file2);
}

async function removeAllEntitiesAndFiles(entitiesCol, filesCol) {
  const resultEnt = await entitiesCol.deleteMany({ sharedId: { $regex: SHARED_ID } });
  console.log(`${resultEnt.deletedCount} entities were deleted`);
  const resultFiles = await filesCol.deleteMany({ entity: { $regex: SHARED_ID } });
  console.log(`${resultFiles.deletedCount} files were deleted`);
}

// eslint-disable-next-line max-statements
async function run() {
  try {
    await client.connect();
    const database = client.db('uwazi_development');
    const entitiesCol = database.collection('entities');
    const filesCol = database.collection('files');

    await removeAllEntitiesAndFiles(entitiesCol, filesCol);

    const insertedEntities = await entitiesCol.insertMany(entities);
    console.log(`${insertedEntities.insertedCount} entities were created`);
    const insertedFiles = await filesCol.insertMany(files);
    console.log(`${insertedFiles.insertedCount} files were created`);
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
