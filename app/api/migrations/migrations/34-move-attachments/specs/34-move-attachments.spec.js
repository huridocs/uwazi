import testingDB from 'api/utils/testing_db';

import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration move-attachments', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(34);
  });

  it('should create one file enty per unique attachment', async () => {
    await migration.up(testingDB.mongodb);
    const attachments = await testingDB.mongodb
      .collection('files')
      .find({ type: 'attachment' })
      .sort({ originalname: 1 })
      .toArray();

    expect(attachments).toEqual([
      expect.objectContaining({
        originalname: 'Dont let me down',
        filename: 'dontletmedown.mp3',
        entity: 'fleet_wood',
      }),
      expect.objectContaining({
        originalname: 'Strange magic',
        filename: 'strangemagic.mp3',
        entity: 'electric_light_orchestra',
      }),
      expect.objectContaining({
        originalname: 'The chain',
        filename: 'thechain.mp3',
        entity: 'fleet_wood',
      }),
    ]);
  });

  it('should delete the attachments key from all the entities', async () => {
    await migration.up(testingDB.mongodb);
    const entities = await testingDB.mongodb
      .collection('entities')
      .find({ attachments: { $exists: true } })
      .toArray();

    expect(entities.length).toBe(0);
  });
});
