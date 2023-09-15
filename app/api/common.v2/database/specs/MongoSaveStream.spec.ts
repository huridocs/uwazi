import { Db, ObjectId } from 'mongodb';

import testingDB from 'api/utils/testing_db';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { getClient } from '../getConnectionForCurrentTenant';
import { MongoDataSource } from '../MongoDataSource';
import { MongoSaveStream } from '../MongoSaveStream';
import { MongoTransactionManager } from '../MongoTransactionManager';

const factory = getFixturesFactory();

type Document = {
  _id: string;
  name: string;
};

type DocumentDBO = {
  _id: ObjectId;
  name: string;
};

const testDocuments: Document[] = [
  { _id: factory.idString('doc1'), name: 'doc1' },
  { _id: factory.idString('doc2'), name: 'doc2' },
  { _id: factory.idString('doc3'), name: 'doc3' },
  { _id: factory.idString('doc4'), name: 'doc4' },
  { _id: factory.idString('doc5'), name: 'doc5' },
  { _id: factory.idString('doc6'), name: 'doc6' },
];

const docsInDB: DocumentDBO[] = [
  { _id: factory.id('doc1'), name: 'doc1' },
  { _id: factory.id('doc2'), name: 'doc2' },
  { _id: factory.id('doc3'), name: 'doc3' },
  { _id: factory.id('doc4'), name: 'doc4' },
  { _id: factory.id('doc5'), name: 'doc5' },
  { _id: factory.id('doc6'), name: 'doc6' },
];

const mapDocumentToDB = (doc: Document): DocumentDBO => ({
  _id: new ObjectId(doc._id),
  name: doc.name,
});

let db: Db;
let saveStream: MongoSaveStream<DocumentDBO, Document>;

beforeEach(async () => {
  await testingEnvironment.setUp({});
  db = testingDB.mongodb!;
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('MongoSaveStream', () => {
  describe('flush', () => {
    it('should flush the stream', async () => {
      saveStream = new MongoSaveStream(db.collection('testCollection'), mapDocumentToDB);
      await saveStream.push(testDocuments[0]);
      await saveStream.push(testDocuments[1]);
      await saveStream.push(testDocuments[2]);
      await saveStream.flush();
      const result = await db.collection('testCollection').find().toArray();
      expect(result).toEqual([docsInDB[0], docsInDB[1], docsInDB[2]]);
    });
  });

  describe('push', () => {
    it('should automatically flush after reaching the stackLimit', async () => {
      saveStream = new MongoSaveStream(db.collection('testCollection'), mapDocumentToDB, 3);
      await saveStream.push(testDocuments[0]);
      await saveStream.push(testDocuments[1]);
      await saveStream.push(testDocuments[2]);
      const result = await db.collection('testCollection').find().toArray();
      expect(result).toEqual([docsInDB[0], docsInDB[1], docsInDB[2]]);
      await saveStream.push(testDocuments[3]);
      const result2 = await db.collection('testCollection').find().toArray();
      expect(result2).toEqual(result);
    });
  });
});
