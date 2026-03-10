import testingDB from 'api/utils/testing_db';
import migration from '../index';
import fixtures, { i2 } from './fixtures';

describe('migration metadata-structured-object', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(17);
  });

  it('should add related entities title to the relationship value', async () => {
    await migration.up(testingDB.mongodb);
    const entities = await testingDB.mongodb.collection('entities').find().toArray();

    expect(entities[0].metadata.year[0]).toEqual({
      value: 2019,
    });
    expect(entities[0].metadata.friends[0]).toEqual({
      value: 'shared-e2',
      label: 'e2',
      icon: { type: 'icon2' },
      type: 'entity',
    });
    expect(entities[0].metadata.current_address_geolocation[0]).toEqual({
      value: { lat: 1, lng: 2, label: 'a' },
    });
    expect(entities[1].metadata.issues[1]).toEqual({ value: i2, label: 'Kidnapping' });
    expect(entities[2].metadata.friends[0]).toEqual({
      value: 'shared-e1',
      label: 'e1',
      icon: { type: 'icon1' },
      type: 'document',
    });
    expect(entities[2].metadata.friends[1]).toEqual({
      value: 'shared-e2',
      label: 'e2',
      icon: { type: 'icon2' },
      type: 'entity',
    });
  });
});
