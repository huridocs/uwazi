import connectionsModel from '#api/relationships/model.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import db from '#api/utils/testing_db.js';
import { ModelBulkWriteStream } from '../modelBulkWriteStream.js';

const fixtures = {
  connections: [
    { _id: db.id(), entity: 'admin' },
    { _id: db.id(), entity: 'editor' },
    { _id: db.id(), entity: 'collab' },
  ],
};

const newRecords = Array(11)
  .fill(0)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .map((_value: any, index: number) => ({
    entity: `new_record_${index}`,
  }));

const checkEntities = async (expectedEntities: string[]) => {
  const inDbEntities = (await db.mongodb?.collection('connections').find({}).toArray())?.map(
    r => r.entity
  );
  expect(inDbEntities).toMatchObject(expectedEntities);
};

const stackLimit = 5;

describe('modelBulkWriteStream', () => {
  let stream: ModelBulkWriteStream;

  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
    stream = new ModelBulkWriteStream(connectionsModel, stackLimit);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });
  it('should be able to insert', async () => {
    await stream.insert(newRecords[0]);
    await stream.flush();
    await checkEntities(['admin', 'editor', 'collab', 'new_record_0']);
  });

  it('should be able to delete', async () => {
    await stream.delete({ _id: fixtures.connections[1]._id });
    await stream.flush();
    await checkEntities(['admin', 'collab']);
  });

  it('should be able to update', async () => {
    await stream.update(
      { _id: fixtures.connections[2]._id },
      { $set: { entity: 'collaborator_new_name' } }
    );
    await stream.flush();
    await checkEntities(['admin', 'editor', 'collaborator_new_name']);
  });

  it('should be able to mix cases', async () => {
    await stream.insert(newRecords[0]);
    await stream.delete({ _id: fixtures.connections[1]._id });
    await stream.update(
      { _id: fixtures.connections[2]._id },
      { $set: { entity: 'collaborator_new_name' } }
    );
    await stream.flush();
    await checkEntities(['admin', 'collaborator_new_name', 'new_record_0']);
  });

  it('should empty actions when flushing', async () => {
    expect(stream.actions.length).toBe(0);
    await stream.insert(newRecords[0]);
    expect(stream.actions.length).toBe(1);
    await stream.delete({ _id: fixtures.connections[1]._id });
    expect(stream.actions.length).toBe(2);
    await stream.insert(newRecords[2]);
    await stream.update(
      { _id: fixtures.connections[2]._id },
      { $set: { entity: 'collaborator_new_name' } }
    );
    await stream.flush();
    expect(stream.actions.length).toBe(0);
  });

  it('should automatically flush when reaching the set limit', async () => {
    expect(stream.actions.length).toBe(0);
    await Promise.all(newRecords.slice(0, 4).map(async r => stream.insert(r)));
    expect(stream.actions.length).toBe(4);
    await stream.insert(newRecords[4]);
    expect(stream.actions.length).toBe(0);
    await Promise.all(newRecords.slice(5).map(async r => stream.insert(r)));
    expect(stream.actions.length).toBe(1);
    await stream.flush();
    expect(stream.actions.length).toBe(0);
    expect((await db.mongodb?.collection('connections').find({}).toArray())?.length).toBe(14);
  });
});
