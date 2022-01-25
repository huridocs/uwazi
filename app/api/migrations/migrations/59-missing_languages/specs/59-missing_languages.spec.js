import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import { fixtures, EntityBluePrints } from './fixtures.js';

let db;
let entities;
let sharedIds;
let testedSharedIds;

describe('migration missing_languages', () => {
  beforeAll(async () => {
    // spyOn(process.stdout, 'write');
    await testingDB.clearAllAndLoad(fixtures);
    db = testingDB.mongodb;
    entities = await db.collection('entities').find({}).toArray();
    sharedIds = new Set(entities.map(e => e.sharedId));
    testedSharedIds = new Set(sharedIds);
    testedSharedIds.delete(EntityBluePrints.Complete.sharedId);
    testedSharedIds.delete(EntityBluePrints.CompleteSelects.sharedId);
    testedSharedIds.delete(EntityBluePrints.NoLanguage.sharedId);
    testedSharedIds = Array.from(testedSharedIds);

    await migration.up(db);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(59);
  });

  it('should reindex when adding new entites', async () => {
    expect(migration.reindex).toBe(true);
  });

  it('should not reindex when no changes are needed', async () => {
    await migration.up(db);
    expect(migration.reindex).toBe(false);
  });

  it('should ignore entities with no language', async () => {
    const noLanguageEntities = await db
      .collection('entities')
      .find({ language: undefined })
      .toArray();
    expect(noLanguageEntities).toHaveLength(1);
    expect(
      await db.collection('entities').find({ sharedId: noLanguageEntities[0].sharedId }).toArray()
    ).toHaveLength(1);
  });

  it('should skip duplication', async () => {
    const duplicatedSharedIdEntities = await db
      .collection('entities')
      .find({ sharedId: EntityBluePrints.Complete.sharedId })
      .toArray();
    expect(duplicatedSharedIdEntities).toHaveLength(4);
    expect(duplicatedSharedIdEntities.map(e => e.language)).toStrictEqual(['en', 'es', 'pt', 'en']);
  });

  it('should skip already complete sharedIds', async () => {
    const completeSelectEntities = await db
      .collection('entities')
      .find({ sharedId: EntityBluePrints.CompleteSelects.sharedId })
      .toArray();
    expect(completeSelectEntities).toHaveLength(3);
    expect(completeSelectEntities.map(e => e.language)).toStrictEqual(['en', 'es', 'pt']);
  });

  it('should create new entities to fill missing languages', async () => {
    for (let i = 0; i < testedSharedIds.length; i += 1) {
      const sharedId = testedSharedIds[i];
      // eslint-disable-next-line no-await-in-loop
      const selected = await db.collection('entities').find({ sharedId }).toArray();
      expect(selected).toHaveLength(3);
      const languages = selected.map(e => e.language);
      expect(languages).toContain('en');
      expect(languages).toContain('es');
      expect(languages).toContain('pt');
    }
  });

  it('should copy root data and set mongolanguage', async () => {
    let expected = { ...EntityBluePrints.MissingOne, language: 'es', mongoLanguage: 'es' };
    delete expected._id;
    delete expected.metadata;
    expect(
      await db
        .collection('entities')
        .findOne({ sharedId: EntityBluePrints.MissingOne.sharedId, language: 'es' })
    ).toMatchObject(expected);

    expected = { ...EntityBluePrints.MissingTwo, language: 'en', mongoLanguage: 'en' };
    delete expected._id;
    delete expected.metadata;
    expect(
      await db
        .collection('entities')
        .findOne({ sharedId: EntityBluePrints.MissingTwo.sharedId, language: 'en' })
    ).toMatchObject(expected);

    expected = { ...EntityBluePrints.MissingTwo, language: 'pt', mongoLanguage: 'pt' };
    delete expected._id;
    delete expected.metadata;
    expect(
      await db
        .collection('entities')
        .findOne({ sharedId: EntityBluePrints.MissingTwo.sharedId, language: 'pt' })
    ).toMatchObject(expected);
  });

  it('should copy properties that are not translated, or are not translatable without user input', async () => {
    expect(
      (
        await db
          .collection('entities')
          .findOne({ sharedId: EntityBluePrints.MissingOne.sharedId, language: 'es' })
      ).metadata
    ).toMatchObject(EntityBluePrints.MissingOne.metadata);
    expect(
      (
        await db
          .collection('entities')
          .findOne({ sharedId: EntityBluePrints.MissingTwo.sharedId, language: 'en' })
      ).metadata
    ).toMatchObject(EntityBluePrints.MissingTwo.metadata);
    expect(
      (
        await db
          .collection('entities')
          .findOne({ sharedId: EntityBluePrints.MissingTwo.sharedId, language: 'pt' })
      ).metadata
    ).toMatchObject(EntityBluePrints.MissingTwo.metadata);
  });

  it('should translate thesauri related (select, multiselect) properties', async () => {
    expect(
      (
        await db
          .collection('entities')
          .findOne({ sharedId: EntityBluePrints.MissingTwoSelects.sharedId, language: 'en' })
      ).metadata
    ).toMatchObject({
      select: [{ value: 'BId', label: 'B' }],
      multi_select: [
        { value: 'AId', label: 'A' },
        { value: 'CId', label: 'C' },
      ],
    });
    expect(
      (
        await db
          .collection('entities')
          .findOne({ sharedId: EntityBluePrints.MissingTwoSelects.sharedId, language: 'es' })
      ).metadata
    ).toMatchObject({
      select: [{ value: 'BId', label: 'B_es' }],
      multi_select: [
        { value: 'AId', label: 'A_es' },
        { value: 'CId', label: 'C_es' },
      ],
    });
  });

  it('should change labels on inherited relationship fields', async () => {
    expect(
      (
        await db
          .collection('entities')
          .findOne({ sharedId: EntityBluePrints.MissingOneRels.sharedId, language: 'pt' })
      ).metadata
    ).toMatchObject({
      no_inheritance: [
        {
          value: EntityBluePrints.Complete.sharedId,
          label: 'CompleteExamplePortuguese',
          type: 'entity',
        },
      ],
    });
    expect(
      (
        await db
          .collection('entities')
          .findOne({ sharedId: EntityBluePrints.MissingTwoRels.sharedId, language: 'en' })
      ).metadata
    ).toMatchObject({
      no_inheritance: [
        {
          value: EntityBluePrints.MissingOne.sharedId,
          label: 'MissingOneEnglish',
          type: 'entity',
        },
      ],
    });
    expect(
      (
        await db
          .collection('entities')
          .findOne({ sharedId: EntityBluePrints.MissingTwoRels.sharedId, language: 'es' })
      ).metadata
    ).toMatchObject({
      no_inheritance: [
        {
          value: EntityBluePrints.MissingOne.sharedId,
          label: 'MissingOneEnglish',
          type: 'entity',
        },
      ],
    });
  });

  // it('should make inherited values inherit from the entity in the proper language', async () => {
  //   fail();
  // });
});
