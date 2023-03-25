import testingDB from 'api/utils/testing_db';
import { ObjectId } from 'mongodb';
import migration from '../index.js';

describe('migration remove_evidence_vault_config', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(86);
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(false);
  });

  it('should remove evidencesVault property from settings', async () => {
    await testingDB.setupFixturesAndContext({
      settings: [
        {
          site_name: 'test site',
          project: 'project',
          evidencesVault: {
            token: 'token',
            template: 'template',
          },
        },
      ],
    });
    await migration.up(testingDB.mongodb);
    const [settings] = await testingDB.mongodb.collection('settings').find().toArray();

    expect(settings).toEqual({
      _id: expect.any(ObjectId),
      site_name: 'test site',
      project: 'project',
    });
  });

  it('should not fail if evidencesVault is undefined', async () => {
    await testingDB.setupFixturesAndContext({
      settings: [
        {
          site_name: 'test site',
          project: 'project',
        },
      ],
    });
    await migration.up(testingDB.mongodb);
    const [settings] = await testingDB.mongodb.collection('settings').find().toArray();

    expect(settings).toEqual({
      _id: expect.any(ObjectId),
      site_name: 'test site',
      project: 'project',
    });
  });
});
