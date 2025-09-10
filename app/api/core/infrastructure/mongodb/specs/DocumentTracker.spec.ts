/* eslint-disable max-statements */
import { Collection, ObjectId } from 'mongodb';
import testingDB from 'api/utils/testing_db';
import { DocumentTracker, MongoDocument } from '../documentTracker/DocumentTracker';

describe('DocumentTracker', () => {
  let testingCollection: Collection<Document>;
  const insert = async (document: any) => testingCollection.insertOne(document);
  const getAll = async () => testingCollection.find({}).toArray();

  beforeEach(async () => {
    await testingDB.connect();
    testingCollection = testingDB.mongodb!.collection('testing');
  });

  afterEach(async () => {
    await testingCollection.deleteMany({});
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should track a simple object', async () => {
    const tracker = new DocumentTracker<MongoDocument>();
    const doc: MongoDocument = {
      _id: new ObjectId(),
      name: 'A',
      age: 12,
      email: 'email@email.com',
      toBeDeleted: 'any',
    };

    await insert(doc);

    tracker.track(doc);

    doc.name = 'b';
    doc.age = 0;
    doc.email = undefined;
    delete (doc as any).toBeDeleted;

    const diff = tracker.diff(doc);

    await testingCollection?.updateOne({ _id: doc._id }, diff);

    const saved = await getAll();
    expect(saved).toEqual([doc]);
  });

  it('should track a reassigned object', async () => {
    const tracker = new DocumentTracker<MongoDocument>();
    const doc: MongoDocument = {
      _id: new ObjectId(),
      name: 'A',
      age: 12,
      email: 'email@email.com',
      prop_a: 'a',
    };

    await insert(doc);

    tracker.track(doc);

    const editedObject = { ...doc, name: 'b', age: 13, newProp: 'newProp', prop_b: 'b' };
    const diff = tracker.diff(editedObject);
    await testingCollection?.updateOne({ _id: doc._id }, diff);

    const saved = await getAll();

    expect(saved).toEqual([editedObject]);
  });

  it('should track nested object changes', async () => {
    const tracker = new DocumentTracker<MongoDocument>();
    const doc: MongoDocument = {
      _id: new ObjectId(),
      name: 'A',
      age: 12,
      address: { street: 'a', city: 'b', postalCode: { countryCode: 12 } },
    };

    await insert(doc);

    tracker.track(doc);

    const edited = {
      ...doc,
      name: 'name was changed',
      address: {
        ...doc.address,
        city: 'changed',
        newProp: 'A new prop',
        postalCode: { ...doc.address.postalCode, countryCode: 0, origin: 'none' },
      },
    };

    const diff = tracker.diff(edited);

    await testingCollection?.updateOne({ _id: doc._id }, diff);

    const saved = await getAll();

    expect(saved).toEqual([edited]);
  });

  it('should track array changes (index-based)', async () => {
    const tracker = new DocumentTracker<MongoDocument>();
    const simpleObject: MongoDocument = {
      _id: new ObjectId(),
      name: 'A',
      age: 12,
      address: [{ street: 'a', city: 'b', postalCode: { countryCode: 12 } }],
    };

    await insert(simpleObject);

    tracker.track(simpleObject);

    const edited = {
      ...simpleObject,
      name: 'name was changed',
      address: [
        {
          ...simpleObject.address[0],
          city: 'changed',
          newProp: 'A new prop',
          postalCode: { ...simpleObject.address[0].postalCode, countryCode: 0, origin: 'none' },
        },
        { street: 'B', city: 'C', postalCode: { countryCode: 2 } },
      ],
    };

    const result = tracker.diff(edited);

    await testingCollection?.updateOne({ _id: simpleObject._id }, result);

    const saved = await getAll();

    expect(saved).toEqual([edited]);
  });

  it('should track deleted array elements (index-based)', async () => {
    const tracker = new DocumentTracker<MongoDocument>();
    const doc: MongoDocument = { _id: new ObjectId(), tags: ['A', 'B', 'C'] };
    await insert(doc);

    tracker.track(doc);

    const edited = { ...doc, tags: ['A'] };
    const diff = tracker.diff(edited);

    await testingCollection?.updateOne({ _id: doc._id }, diff);

    const saved = await getAll();
    expect(saved).toEqual([edited]);
  });

  it('should handle arrays of objects with _id (pull/push/set + arrayFilters) and never set _id', async () => {
    const tracker = new DocumentTracker<MongoDocument>();

    const id1 = new ObjectId();
    const id2 = new ObjectId();
    const id3 = new ObjectId();

    const doc: MongoDocument = {
      _id: new ObjectId(),
      addresses: [
        { _id: id1, street: 'A', zip: 1 },
        { _id: id2, street: 'B', zip: 2 },
      ],
    };

    await insert(doc);

    tracker.track(doc);

    const changed: MongoDocument = {
      ...doc,
      addresses: [
        { _id: id1, street: 'A-modified', zip: 1 },
        { _id: id3, street: 'C', zip: 3 },
      ],
    };

    const diff = tracker.diff(changed);

    await testingCollection?.updateOne({ _id: doc._id }, diff);

    const saved = await getAll();

    expect(saved).toEqual([changed]);
  });

  it('should throw if document is not tracked', () => {
    const tracker = new DocumentTracker<MongoDocument>();
    const doc: MongoDocument = { _id: new ObjectId(), name: 'A' };
    expect(() => tracker.diff(doc)).toThrow(/not tracked/);
  });

  it('should return empty object if nothing changed', () => {
    const tracker = new DocumentTracker<MongoDocument>();
    const doc: MongoDocument = { _id: new ObjectId(), name: 'A', age: 10 };
    tracker.track(doc);

    const copy = { ...doc };
    const result = tracker.diff(copy);
    expect(result).toEqual({});
  });

  it('should handle deleted nested properties', () => {
    const tracker = new DocumentTracker<MongoDocument>();
    const doc: MongoDocument = {
      _id: new ObjectId(),
      address: { street: 'A', city: 'B', country: 'C' },
    };
    tracker.track(doc);

    const edited = { ...doc, address: { street: 'A', city: 'B' } };
    const result = tracker.diff(edited);

    expect(result).toEqual({
      $unset: { 'address.country': '' },
    });
  });

  it('should handle mixed type changes', () => {
    const tracker = new DocumentTracker<MongoDocument>();
    const doc: MongoDocument = { _id: new ObjectId(), value: 10 };
    tracker.track(doc);

    const edited = { ...doc, value: 'changed' };
    const result = tracker.diff(edited);

    expect(result).toEqual({
      $set: { value: 'changed' },
    });
  });

  it('should handle deeply nested array changes with a simple array inside an object array', async () => {
    const tracker = new DocumentTracker<MongoDocument>();
    const id1 = new ObjectId();
    const id2 = new ObjectId();

    const doc: MongoDocument = {
      _id: new ObjectId(),
      users: [
        { _id: id1, name: 'Alice', tags: ['cool', 'fun', 'nice'] },
        { _id: id2, name: 'Bob', tags: ['boring'] },
      ],
    };

    await insert(doc);
    tracker.track(doc);

    const changed: MongoDocument = {
      ...doc,
      users: [
        // Modify Alice's tags
        { _id: id1, name: 'Alice', tags: ['cool', 'nice', 'awesome'] },
        // Keep Bob the same
        { _id: id2, name: 'Bob', tags: ['boring'] },
      ],
    };

    const diff = tracker.diff(changed);
    await testingCollection?.updateOne({ _id: doc._id }, diff);
    const saved = await getAll();
    expect(saved).toEqual([changed]);
  });

  it('should not generate a diff when reordering elements in an array of objects with _id', async () => {
    const tracker = new DocumentTracker<MongoDocument>();
    const id1 = new ObjectId();
    const id2 = new ObjectId();
    const id3 = new ObjectId();

    const doc: MongoDocument = {
      _id: new ObjectId(),
      items: [
        { _id: id1, name: 'Item 1' },
        { _id: id2, name: 'Item 2' },
        { _id: id3, name: 'Item 3' },
      ],
    };

    await insert(doc);
    tracker.track(doc);

    // Reorder the items
    const reordered: MongoDocument = {
      ...doc,
      items: [
        { _id: id3, name: 'Item 3' },
        { _id: id1, name: 'Item 1' },
        { _id: id2, name: 'Item 2' },
      ],
    };

    const diff = tracker.diff(reordered);
    expect(diff).toEqual({});
  });

  it('should handle removal of all array elements', async () => {
    const tracker = new DocumentTracker<MongoDocument>();
    const doc: MongoDocument = {
      _id: new ObjectId(),
      items: [{ _id: new ObjectId() }, { _id: new ObjectId() }],
    };

    await insert(doc);
    tracker.track(doc);

    const edited: MongoDocument = {
      ...doc,
      items: [],
    };

    const diff = tracker.diff(edited);
    await testingCollection?.updateOne({ _id: doc._id }, diff);
    const saved = await getAll();
    expect(saved).toEqual([edited]);
  });

  it('should handle a simple array of primitives correctly', async () => {
    const tracker = new DocumentTracker<MongoDocument>();
    const doc: MongoDocument = { _id: new ObjectId(), scores: [10, 20, 30] };
    await insert(doc);
    tracker.track(doc);

    const edited: MongoDocument = {
      ...doc,
      scores: [10, 50, 60],
    };

    const diff = tracker.diff(edited);
    await testingCollection?.updateOne({ _id: doc._id }, diff);
    const saved = await getAll();
    expect(saved).toEqual([edited]);
  });

  it('should handle adding an array to a non-array field', async () => {
    const tracker = new DocumentTracker<MongoDocument>();
    const doc: MongoDocument = { _id: new ObjectId(), field: 'a string' };
    await insert(doc);
    tracker.track(doc);

    const edited: MongoDocument = {
      ...doc,
      field: ['A', 'B', 'C'],
    };

    const diff = tracker.diff(edited);
    await testingCollection?.updateOne({ _id: doc._id }, diff);
    const saved = await getAll();
    expect(saved).toEqual([edited]);
  });
});
