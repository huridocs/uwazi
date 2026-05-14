/* eslint-disable max-statements */
import { Db } from 'mongodb';
import testingDB from '#api/utils/testing_db.js';
import migration from '../index.js';
import {
  allAlreadyDenormalizedFixtures,
  childrenButUnusedFixtures,
  noChildrenFixtures,
  noDefaultAndMissingLanguageFixtures,
  noDefaultLanguageInSettingsFixtures,
  noEntitiesFixtures,
  noLanguagesInSettingsFixtures,
  noTemplatesFixtures,
  repairFixtures,
} from './fixtures.js';

let db: Db | null;

const setUpAndRun = async (fixtures: any) => {
  await testingDB.setupFixturesAndContext(fixtures);
  db = testingDB.mongodb;
  migration.reindex = false;
  await migration.up(db!);
};

const getEntityByTitle = (entities: any[], title: string) => {
  const entity = entities.find(e => e.title === title);
  expect(entity).toBeDefined();
  return entity!;
};

beforeAll(async () => {
  jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('migration repair_child_thesaurus_label_denormalization', () => {
  it('should have a delta number', () => {
    expect(migration.delta).toBe(188);
  });

  it('should skip when there are no thesauri with child values', async () => {
    await setUpAndRun(noChildrenFixtures);

    const [entity] = await db!.collection('entities').find({ title: 'flat_entity' }).toArray();
    expect(entity.metadata.status[0]).toEqual({ value: 'flat_yes', label: 'flat_yes' });
    expect(migration.reindex).toBe(false);
  });

  it('should skip when hierarchical thesauri are not used by select/multiselect properties', async () => {
    await setUpAndRun(childrenButUnusedFixtures);

    const [entity] = await db!.collection('entities').find({ title: 'unused_entity' }).toArray();
    expect(entity.metadata.title[0]).toEqual({ value: 'no change expected' });
    expect(migration.reindex).toBe(false);
  });

  it('should skip when there are no templates', async () => {
    await setUpAndRun(noTemplatesFixtures);

    const [entity] = await db!
      .collection('entities')
      .find({ title: 'entity_without_templates' })
      .toArray();
    expect(entity.metadata.status[0]).toEqual({ value: 'yes_in_court', label: 'old_yes' });
    expect(migration.reindex).toBe(false);
  });

  it('should skip when there are no entities', async () => {
    await setUpAndRun(noEntitiesFixtures);

    const count = await db!.collection('entities').countDocuments();
    expect(count).toBe(0);
    expect(migration.reindex).toBe(false);
  });

  it('should run when settings have no languages', async () => {
    await setUpAndRun(noLanguagesInSettingsFixtures);

    const entities = await db!.collection('entities').find({}).toArray();
    const directEs = getEntityByTitle(entities, 'direct_es');

    expect(directEs.metadata.status).toEqual([
      {
        value: 'yes_in_government',
        label: 'si',
        parent: { value: 'in_government', label: 'en gobierno' },
      },
    ]);
    expect(migration.reindex).toBe(true);
  });

  it('should run when settings have no default language', async () => {
    await setUpAndRun(noDefaultLanguageInSettingsFixtures);

    const entities = await db!.collection('entities').find({}).toArray();
    const directEn = getEntityByTitle(entities, 'direct_en');
    const missingLanguage = getEntityByTitle(entities, 'missing_language_uses_default');

    expect(directEn.metadata.status).toEqual([
      {
        value: 'yes_in_court',
        label: 'yes',
        parent: { value: 'in_court', label: 'in court' },
      },
    ]);
    expect(missingLanguage.metadata.status).toEqual([
      {
        value: 'no_in_court',
        label: 'old_no',
        parent: { value: 'wrong_parent', label: 'old_parent' },
      },
    ]);
    expect(migration.reindex).toBe(true);
  });

  it('should skip entities without language when default language is missing', async () => {
    await setUpAndRun(noDefaultAndMissingLanguageFixtures);

    const [entity] = await db!
      .collection('entities')
      .find({ title: 'missing_language_skipped_without_default' })
      .toArray();

    expect(entity.metadata.status).toEqual([
      {
        value: 'yes_in_court',
        label: 'old_yes',
        parent: { value: 'wrong_parent', label: 'wrong_parent' },
      },
    ]);
    expect(migration.reindex).toBe(false);
  });

  it('should repair child labels and parent info in direct and inherited metadata', async () => {
    await setUpAndRun(repairFixtures);

    const entities = await db!.collection('entities').find({}).toArray();
    const directEn = getEntityByTitle(entities, 'direct_en');
    const directEs = getEntityByTitle(entities, 'direct_es');
    const inheritedEn = getEntityByTitle(entities, 'inherited_en');
    const alreadyCorrect = getEntityByTitle(entities, 'already_correct');
    const unknownValueKept = getEntityByTitle(entities, 'unknown_value_kept');
    const inheritedNonArrayKept = getEntityByTitle(entities, 'inherited_non_array_kept');
    const missingLanguageUsesDefault = getEntityByTitle(entities, 'missing_language_uses_default');
    const withoutMetadata = getEntityByTitle(entities, 'without_metadata');
    const unrelated = getEntityByTitle(entities, 'unrelated');

    expect(directEn.metadata.status).toEqual([
      {
        value: 'yes_in_court',
        label: 'yes',
        parent: { value: 'in_court', label: 'in court' },
      },
    ]);
    expect(directEn.metadata.flat_status).toEqual([{ value: 'flat_yes', label: 'flat_old_yes' }]);
    expect(directEn.metadata.status_multi).toEqual([
      {
        value: 'yes_in_court',
        label: 'yes',
        parent: { value: 'in_court', label: 'in court' },
      },
      {
        value: 'yes_in_government',
        label: 'yes',
        parent: { value: 'in_government', label: 'in government' },
      },
    ]);

    expect(directEs.metadata.status).toEqual([
      {
        value: 'yes_in_government',
        label: 'si',
        parent: { value: 'in_government', label: 'en gobierno' },
      },
    ]);
    expect(directEs.metadata.status_multi).toEqual([
      {
        value: 'maybe_in_court',
        // No es translation exists for "maybe", so fallback should be dictionary label.
        label: 'maybe',
        parent: { value: 'in_court', label: 'en corte' },
      },
    ]);

    expect(inheritedEn.metadata.inherited_status[0].inheritedValue).toEqual([
      {
        value: 'no_in_government',
        label: 'no',
        parent: { value: 'in_government', label: 'in government' },
      },
    ]);

    expect(alreadyCorrect.metadata).toEqual({
      status: [
        { value: 'no_in_court', label: 'no', parent: { value: 'in_court', label: 'in court' } },
      ],
      status_multi: [
        {
          value: 'yes_in_government',
          label: 'yes',
          parent: { value: 'in_government', label: 'in government' },
        },
      ],
    });
    expect(unknownValueKept.metadata.status).toEqual([
      { value: 'unknown_value_id', label: 'custom label' },
    ]);
    expect(inheritedNonArrayKept.metadata.inherited_status).toEqual([
      {
        value: 'direct_shared',
        label: 'direct_en',
        inheritedType: 'select',
        inheritedValue: 'not_an_array',
      },
    ]);
    expect(missingLanguageUsesDefault.metadata.status).toEqual([
      {
        value: 'no_in_court',
        label: 'no',
        parent: { value: 'in_court', label: 'in court' },
      },
    ]);
    expect(withoutMetadata.metadata).toBeUndefined();
    expect(unrelated.metadata).toEqual({ title: [{ value: 'leave me as is' }] });
    expect(migration.reindex).toBe(true);
  });

  it('should be idempotent and avoid reindex on second run', async () => {
    await setUpAndRun(repairFixtures);
    expect(migration.reindex).toBe(true);

    await migration.up(db!);
    expect(migration.reindex).toBe(false);
  });

  it('should not update or reindex when all denormalized values already match expected translations', async () => {
    await testingDB.setupFixturesAndContext(allAlreadyDenormalizedFixtures);
    db = testingDB.mongodb;
    migration.reindex = false;

    const before = await db!.collection('entities').find({}).sort({ title: 1 }).toArray();
    await migration.up(db!);
    const after = await db!.collection('entities').find({}).sort({ title: 1 }).toArray();

    expect(after).toEqual(before);
    expect(migration.reindex).toBe(false);
  });
});
