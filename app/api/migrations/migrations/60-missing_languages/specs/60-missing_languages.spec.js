/* eslint-disable max-lines */
import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import { fixtures, EntityBluePrints } from './fixtures.js';

let db;

describe('migration missing_languages', () => {
  beforeAll(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.clearAllAndLoad(fixtures);
    db = testingDB.mongodb;
    await migration.up(db);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(60);
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
    const testSharedId = async (sharedId, expectedNumber) => {
      const selected = await db.collection('entities').find({ sharedId }).toArray();
      const languages = selected.map(e => e.language);
      expect(selected).toHaveLength(expectedNumber);
      expect(languages).toContain('en');
      expect(languages).toContain('es');
      expect(languages).toContain('pt');
    };
    await testSharedId('missing_one_sharedId', 4);
    await testSharedId('missing_two_sharedId', 3);
    await testSharedId('missing_two_selects_sharedId', 3);
    await testSharedId('missing_one_rels_sharedId', 3);
    await testSharedId('missing_two_rels_sharedId', 3);
  });

  it('should copy root data and set mongolanguage', async () => {
    let expected = { ...EntityBluePrints.MissingOne, language: 'es', mongoLanguage: 'es' };
    ['_id', 'metadata'].forEach(key => delete expected[key]);
    expect(
      await db
        .collection('entities')
        .findOne({ sharedId: EntityBluePrints.MissingOne.sharedId, language: 'es' })
    ).toMatchObject(expected);

    expected = { ...EntityBluePrints.MissingTwo, language: 'en', mongoLanguage: 'en' };
    ['_id', 'metadata'].forEach(key => delete expected[key]);
    expect(
      await db
        .collection('entities')
        .findOne({ sharedId: EntityBluePrints.MissingTwo.sharedId, language: 'en' })
    ).toMatchObject(expected);

    expected = { ...EntityBluePrints.MissingTwo, language: 'pt', mongoLanguage: 'pt' };
    ['_id', 'metadata'].forEach(key => delete expected[key]);
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

  it('should make inherited values inherit from the entity in the proper language', async () => {
    expect(
      (
        await db
          .collection('entities')
          .findOne({ sharedId: EntityBluePrints.MissingOneRels.sharedId, language: 'pt' })
      ).metadata
    ).toMatchObject({
      inherited_text: [
        {
          value: EntityBluePrints.Complete.sharedId,
          label: 'CompleteExamplePortuguese',
          type: 'entity',
          inheritedValue: [{ value: 'complete_example_text_portuguese' }],
          inheritedType: 'text',
        },
      ],
      inherited_number: [],
      inherited_select: [
        {
          value: EntityBluePrints.CompleteSelects.sharedId,
          label: 'CompleteSelectsPortuguese',
          type: 'entity',
          inheritedValue: [{ value: 'AId', label: 'A_pt' }],
          inheritedType: 'select',
        },
      ],
      inherited_multi_select: [
        {
          value: EntityBluePrints.CompleteSelects.sharedId,
          label: 'CompleteSelectsPortuguese',
          type: 'entity',
          inheritedValue: [
            { value: 'BId', label: 'B_pt' },
            { value: 'DId', label: 'D_pt' },
          ],
          inheritedType: 'multiselect',
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
      inherited_text: [
        {
          value: EntityBluePrints.MissingOne.sharedId,
          label: 'MissingOneEnglish',
          type: 'entity',
          inheritedValue: [{ value: 'missing_one_text_english' }],
          inheritedType: 'text',
        },
      ],
      inherited_number: [
        {
          value: EntityBluePrints.MissingOne.sharedId,
          label: 'MissingOneEnglish',
          type: 'entity',
          inheritedValue: [{ value: 2 }],
          inheritedType: 'numeric',
        },
      ],
      inherited_select: [
        {
          value: EntityBluePrints.MissingTwoSelects.sharedId,
          label: EntityBluePrints.MissingTwoSelects.title,
          type: 'entity',
          inheritedValue: [{ value: 'BId', label: 'B' }],
          inheritedType: 'select',
        },
      ],
      inherited_multi_select: [
        {
          value: EntityBluePrints.CompleteSelects.sharedId,
          label: 'CompleteSelectsEnglish',
          type: 'entity',
          inheritedValue: [
            { value: 'BId', label: 'B' },
            { value: 'DId', label: 'D' },
          ],
          inheritedType: 'multiselect',
        },
        {
          value: EntityBluePrints.MissingTwoSelects.sharedId,
          label: EntityBluePrints.MissingTwoSelects.title,
          type: 'entity',
          inheritedValue: [
            { value: 'AId', label: 'A' },
            { value: 'CId', label: 'C' },
          ],
          inheritedType: 'multiselect',
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
      inherited_text: [
        {
          value: EntityBluePrints.MissingOne.sharedId,
          label: 'MissingOneEnglish',
          type: 'entity',
          inheritedValue: [{ value: 'missing_one_text_english' }],
          inheritedType: 'text',
        },
      ],
      inherited_number: [
        {
          value: EntityBluePrints.MissingOne.sharedId,
          label: 'MissingOneEnglish',
          type: 'entity',
          inheritedValue: [{ value: 2 }],
          inheritedType: 'numeric',
        },
      ],
      inherited_select: [
        {
          value: EntityBluePrints.MissingTwoSelects.sharedId,
          label: EntityBluePrints.MissingTwoSelects.title,
          type: 'entity',
          inheritedValue: [{ value: 'BId', label: 'B_es' }],
          inheritedType: 'select',
        },
      ],
      inherited_multi_select: [
        {
          value: EntityBluePrints.CompleteSelects.sharedId,
          label: 'CompleteSelectsSpanish',
          type: 'entity',
          inheritedValue: [
            { value: 'BId', label: 'B_es' },
            { value: 'DId', label: 'D_es' },
          ],
          inheritedType: 'multiselect',
        },
        {
          value: EntityBluePrints.MissingTwoSelects.sharedId,
          label: EntityBluePrints.MissingTwoSelects.title,
          type: 'entity',
          inheritedValue: [
            { value: 'AId', label: 'A_es' },
            { value: 'CId', label: 'C_es' },
          ],
          inheritedType: 'multiselect',
        },
      ],
    });
  });
});
