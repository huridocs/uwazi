import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration editDate', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(31);
  });

  it('should populate editDate with timestamp from updatelogs', async () => {
    await migration.up(testingDB.mongodb);
    const entities = await testingDB.mongodb.collection('entities').find({}).toArray();

    const [entity1, entity2, entity3] = entities;
    const updatelog1 = await testingDB.mongodb
      .collection('updatelogs')
      .findOne({ mongoId: entity1._id });
    const updatelog2 = await testingDB.mongodb
      .collection('updatelogs')
      .findOne({ mongoId: entity2._id });
    const updatelog3 = await testingDB.mongodb
      .collection('updatelogs')
      .findOne({ mongoId: entity3._id });
    expect(entity1.editDate).toEqual(updatelog1.timestamp);
    expect(entity2.editDate).toEqual(updatelog2.timestamp);
    expect(entity3.editDate).toEqual(updatelog3.timestamp);
  });

  it('should populate editDate with creationDate if updateLogs do not exist', async () => {
    const entity = {
      _id: '7654',
      title: 'new entity',
      creationDate: '198',
    };
    await testingDB.clearAllAndLoad({
      entities: [...fixtures.entities, entity],
      updatelogs: [...fixtures.updatelogs],
    });

    await migration.up(testingDB.mongodb);

    const savedEntity = await testingDB.mongodb.collection('entities').findOne({ _id: entity._id });
    expect(savedEntity.editDate).toEqual(savedEntity.creationDate);
  });
});
