/* eslint-disable no-await-in-loop */
/* eslint-disable max-statements */
// Run with ts-node, explicitly passing tsconfig, and ignore the compile errors. From the project root:
// yarn ts-node --project ./tsconfig.json --transpile-only ./scripts/migrateRelationshipsToV2.ts
import process from 'process';

import mongodb, { Collection, Cursor, Db, MongoError, ObjectId } from 'mongodb';

import { BulkWriteStream } from '../app/api/common.v2/database/BulkWriteStream';
import date from '../app/api/utils/date';
import ID from '../app/shared/uniqueID';
import { Settings } from '../app/shared/types/settingsType';
import { TemplateSchema } from '../app/shared/types/templateType';
import { UserSchema } from '../app/shared/types/userType';

type HubType = {
  _id: ObjectId;
};

type ConnectionType = {
  _id: ObjectId;
  hub: ObjectId;
};

const batchsize = 1000;
const temporaryHubCollectionName = '__temporary_hub_collection';
const temporaryEntityCollectionName = '__temporary_entity_collection';
const temporaryRelationshipsCollectionName = '__temporary_relationships_collection';

const getClient = async () => {
  const url = process.env.DBHOST ? `mongodb://${process.env.DBHOST}/` : 'mongodb://localhost/';
  const client = new mongodb.MongoClient(url, { useUnifiedTopology: true });
  await client.connect();

  return client;
};

const getNextBatch = async <T>(cursor: Cursor<T>, size: number = batchsize) => {
  const returned: T[] = [];
  while ((await cursor.hasNext()) || returned.length < size) {
    returned.push((await cursor.next()) as T);
  }
  return returned;
};

const insertHubs = async (_ids: ObjectId[], hubCollection: Collection<HubType>) => {
  let ids = Array.from(new Set(_ids.map(id => id.toString())));
  const hubs = await hubCollection
    .find({ _id: { $in: ids.map(id => new ObjectId(id)) } })
    .toArray();
  const existing = new Set(hubs.map(({ _id }) => _id.toString()));
  ids = ids.filter(id => !existing.has(id));
  return hubCollection.insertMany(ids.map(id => ({ _id: new ObjectId(id) })));
};

const gatherHubs = async (connections: Collection<ConnectionType>, hubs: Collection) => {
  process.stdout.write('Writing temporary hub collection\n.');
  const connectionsCursor = connections.find({}, { projection: { hub: 1 } });

  let toBeInserted: mongodb.ObjectId[] = [];
  while (await connectionsCursor.hasNext()) {
    const next = (await connectionsCursor.next()) as ConnectionType;
    const { hub } = next;
    toBeInserted.push(hub);
    if (toBeInserted.length > batchsize) {
      await insertHubs(toBeInserted, hubs);
      toBeInserted = [];
    }
  }
  if (toBeInserted.length) await insertHubs(toBeInserted, hubs);
  process.stdout.write('Temporary hub collection done\n.');
};

const createTempCollection = async (db: Db, name: string) => {
  try {
    await db.createCollection(name);
  } catch (error) {
    if (!(error instanceof MongoError)) throw error;
    if (!error.message.endsWith('already exists')) throw error;
  }
};

// const handleProperties = async templatesCollection => {
//   const templates = await templatesCollection.find({}).toArray();
//   for (let i = 0; i < templates.length; i += 1) {
//     const template = templates[i];
//     const relationshipProperties = template.properties.filter(p => p.type === 'relationship');
//     const relationshipPropertiesByName = {};
//     relationshipProperties.forEach(p => {
//       relationshipPropertiesByName[p.name] = p;
//     });
//     // if (relationshipProperties.length) {
//     //   const entityCursor = entitiesCollection.find(
//     //     { template: template._id },
//     //     { projection: { _id: 1, metadata: 1 } }
//     //   );
//     // }
//     console.log(template.name, relationshipProperties);
//   }
// };

const HUBTEMPLATE: TemplateSchema = {
  name: '__former_hub',
  commonProperties: [
    {
      _id: new ObjectId(),
      label: 'Title',
      name: 'title',
      isCommonProperty: true,
      type: 'text',
      prioritySorting: false,
    },
    {
      _id: new ObjectId(),
      label: 'Date added',
      name: 'creationDate',
      isCommonProperty: true,
      type: 'date',
      prioritySorting: false,
    },
    {
      _id: new ObjectId(),
      label: 'Date modified',
      name: 'editDate',
      isCommonProperty: true,
      type: 'date',
      prioritySorting: false,
    },
  ],
  properties: [],
  default: false,
};

const writeHubTemplate = async (templatesCollection: Collection) => {
  let templates = await templatesCollection.find({ name: HUBTEMPLATE.name }).toArray();
  if (!templates.length) {
    await templatesCollection.insert(HUBTEMPLATE);
    templates = await templatesCollection.find({ name: HUBTEMPLATE.name }).toArray();
  }
  const [template] = templates;
  return template;
};

const hubToEntity = (
  hub: HubType,
  language: string,
  template: TemplateSchema,
  user: UserSchema
) => ({
  title: hub._id.toHexString(),
  template: template._id,
  shared: ID(),
  published: false,
  metadata: {},
  type: 'document',
  user: user._id,
  creationDate: date.currentUTC(),
  editDate: date.currentUTC(),
  language,
  generatedToc: false,
});

const getDefaultLanguage = async (db: Db) => {
  const settings = await db.collection<Settings>('settings').findOne({}, { projection: { languages: 1 }}) as Settings;
  return settings.languages.find(l => l.default)
};

const getAnAdmin = async (db: Db) => db.collection('users').findOne({ role: 'admin' });

const liftHubs = async (
  hubsCollection: Collection<HubType>,
  newEntitiesCollection: Collection,
  templatesCollection: Collection,
  connectionsCollection: Collection,
  relationshipsCollection: Collection,
  language: string,
  template: TemplateSchema,
  user: UserSchema
) => {
  const entityWriter = new BulkWriteStream(newEntitiesCollection, undefined, batchsize);
  const connectionWriter = new BulkWriteStream(connectionsCollection, undefined, batchsize);

  const hubs = hubsCollection.find({});
  while (!hubs.isClosed()) {
    const hubBatch = await getNextBatch(hubs);
    await entityWriter.insertMany(hubBatch.map(hub => hubToEntity(hub, language, template, user)));
  }
  await entityWriter.flush();
};

const migrate = async () => {
  const client = await getClient();
  const db = client.db(process.env.DATABASE_NAME || 'uwazi_development');
  const defaultLanguage = (await getDefaultLanguage(db)).key;
  const adminUser = await getAnAdmin(db);

  // await db.dropCollection(temporaryHubCollectionName);
  await createTempCollection(db, temporaryHubCollectionName);
  await db.dropCollection(temporaryEntityCollectionName);
  await createTempCollection(db, temporaryEntityCollectionName);
  await db.dropCollection(temporaryRelationshipsCollectionName);
  await createTempCollection(db, temporaryRelationshipsCollectionName);

  const hubsCollection = db.collection<HubType>(temporaryHubCollectionName);
  const newEntitiesCollection = db.collection(temporaryEntityCollectionName);
  const templatesCollection = db.collection('templates');
  const entitiesCollection = db.collection('entities');
  const connectionsCollection = db.collection<ConnectionType>('connections');
  const relationshipsCollection = db.collection('relationships');
  const tempRelationshipsCollection = db.collection('tempRelationshipsCollection');

  // await gatherHubs(connections, hubsCollection);

  const hubtemplate = await writeHubTemplate(templatesCollection);
  await liftHubs(
    hubsCollection,
    newEntitiesCollection,
    templatesCollection,
    connectionsCollection,
    tempRelationshipsCollection,
    defaultLanguage,
    hubtemplate,
    adminUser
  );

  // await db.dropCollection(temporaryHubCollectionName);
  await client.close();
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
migrate();
