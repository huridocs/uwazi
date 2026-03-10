import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import {
  fixtures,
  withRepetitionHub1Prop1,
  withRepetitionHub2Prop1,
  withRepetitionNoProp,
  withRepetitionProp2,
  withRepetitionProp3,
  withoutRepetitionProp2,
} from './fixtures.js';

describe('migration remove-duplicated-relationships', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(128);
  });

  describe('when removing the duplicated relationships in hubs', () => {
    let relationships;

    beforeAll(async () => {
      await migration.up(testingDB.mongodb);
      relationships = await testingDB.mongodb.collection('connections').find({}).toArray();
    });

    it('should not affect hubs not linked to properties', () => {
      expect(relationships).toEqual(expect.arrayContaining(withRepetitionNoProp));
    });

    it('should deduplicate hubs based in entity and relationtype', () => {
      expect(relationships).not.toEqual(
        expect.arrayContaining([withRepetitionHub1Prop1[3], withRepetitionHub1Prop1[4]])
      );

      expect(relationships).not.toEqual(
        expect.arrayContaining([withRepetitionHub2Prop1[3], withRepetitionHub2Prop1[4]])
      );

      expect(relationships).not.toEqual(
        expect.arrayContaining([
          withRepetitionProp2[2],
          withRepetitionProp2[3],
          withRepetitionProp2[4],
        ])
      );

      expect(relationships).not.toEqual(expect.arrayContaining([withRepetitionProp3[2]]));
    });

    it('should keep all relationships not duplicated within a hub or not related to a property.', () => {
      expect(relationships.length).toBe(17);

      expect(relationships).toEqual(
        expect.arrayContaining([
          withRepetitionHub1Prop1[0],
          withRepetitionHub1Prop1[1],
          withRepetitionHub1Prop1[2],
        ])
      );
      expect(relationships).toEqual(
        expect.arrayContaining([
          withRepetitionHub2Prop1[0],
          withRepetitionHub2Prop1[1],
          withRepetitionHub2Prop1[2],
        ])
      );
      expect(relationships).toEqual(
        expect.arrayContaining([withRepetitionProp2[0], withRepetitionProp2[1]])
      );
      expect(relationships).toEqual(
        expect.arrayContaining([
          withoutRepetitionProp2[0],
          withoutRepetitionProp2[1],
          withoutRepetitionProp2[2],
        ])
      );
      expect(relationships).toEqual(
        expect.arrayContaining([withRepetitionProp3[0], withRepetitionProp3[1]])
      );
      expect(relationships).toEqual(
        expect.arrayContaining([
          withRepetitionNoProp[0],
          withRepetitionNoProp[1],
          withRepetitionNoProp[2],
          withRepetitionNoProp[3],
        ])
      );
    });
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(false);
  });
});
