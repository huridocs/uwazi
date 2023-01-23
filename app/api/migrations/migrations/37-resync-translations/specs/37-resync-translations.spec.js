import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures, { translation1, translation2, translation3, entity1 } from './fixtures';

describe('migration resync translations', () => {
  let updatelogs;

  beforeEach(async () => {
    await testingDB.setupFixturesAndContext(fixtures);
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    jest.spyOn(Date, 'now').mockReturnValue(1000);
    await migration.up(testingDB.mongodb);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  const getUpdatelog = mongoId => updatelogs.find(l => l.mongoId.toString() === mongoId.toString());

  const expectLog = (logEntry, [namespace, deleted, timestamp]) => {
    expect(logEntry).toEqual(expect.objectContaining({ namespace, deleted, timestamp }));
  };

  it('should have a delta number', () => {
    expect(migration.delta).toBe(37);
  });

  it('should update the translation updatelogs to current timestamp and not affect others', async () => {
    updatelogs = await testingDB.mongodb.collection('updatelogs').find({}).toArray();

    expect(updatelogs.length).toBe(4);

    const logTranslation1 = getUpdatelog(translation1);
    const logTranslation2 = getUpdatelog(translation2);
    const logTranslation3 = getUpdatelog(translation3);
    const logEntity1 = getUpdatelog(entity1);

    expectLog(logTranslation1, ['translations', false, 1000]);
    expectLog(logTranslation2, ['translations', false, 1000]);
    expectLog(logTranslation3, ['translations', true, 1000]);
    expectLog(logEntity1, ['entities', true, 8]);
  });
});
