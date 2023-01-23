import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration relationships_remove_languages', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
  });

  afterAll(done => {
    testingDB.disconnect().then(done);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(7);
  });

  it('should remove duplicated relationships, sharedIds and languages', async () => {
    await migration.up(testingDB.mongodb);
    const relationships = await testingDB.mongodb
      .collection('connections')
      .find({ range: { $exists: false } })
      .toArray();

    expect(relationships.length).toBe(2);

    expect(relationships[0]).not.toHaveProperty('sharedId');
    expect(relationships[0]).not.toHaveProperty('langauge');
    expect(relationships[0].entity).toBe('entity1');

    expect(relationships[1]).not.toHaveProperty('sharedId');
    expect(relationships[1]).not.toHaveProperty('langauge');
    expect(relationships[1].entity).toBe('entity2');
  });

  describe('text references', () => {
    describe('when diferent languages have diferent filenames', () => {
      it('should maintain duplication based on filename instead of language', async () => {
        await migration.up(testingDB.mongodb);
        const relationships = await testingDB.mongodb
          .collection('connections')
          .find({ entity: 'entity3' })
          .toArray();

        const enRelation = relationships.find(r => r.filename === 'enFile');
        const esRelation = relationships.find(r => r.filename === 'esFile');
        const ptRelation = relationships.find(r => r.filename === 'ptFile');

        expect(enRelation).not.toHaveProperty('sharedId');
        expect(enRelation).not.toHaveProperty('langauge');
        expect(enRelation.entity).toBe('entity3');

        expect(esRelation).not.toHaveProperty('sharedId');
        expect(esRelation).not.toHaveProperty('langauge');
        expect(esRelation.entity).toBe('entity3');

        expect(ptRelation).not.toHaveProperty('sharedId');
        expect(ptRelation).not.toHaveProperty('langauge');
        expect(ptRelation.entity).toBe('entity3');
      });
    });

    describe('when diferent languages have the same filenames', () => {
      it('should remove duplication', async () => {
        await migration.up(testingDB.mongodb);
        let relationships = await testingDB.mongodb
          .collection('connections')
          .find({ entity: 'entity4' })
          .toArray();
        expect(relationships.length).toBe(1);

        expect(relationships[0]).not.toHaveProperty('sharedId');
        expect(relationships[0]).not.toHaveProperty('langauge');
        expect(relationships[0].filename).toBe('sameFile');

        relationships = await testingDB.mongodb
          .collection('connections')
          .find({ entity: 'entity5' })
          .toArray();
        expect(relationships.length).toBe(3);
        expect(relationships.find(r => r.range.text === 'text_a').filename).toBe('anotherFile');
        expect(relationships.find(r => r.range.text === 'text_b').filename).toBe('anotherFile');
        expect(relationships.find(r => r.filename === 'sameFileOn2')).toBeDefined();
      });
    });
  });
});
