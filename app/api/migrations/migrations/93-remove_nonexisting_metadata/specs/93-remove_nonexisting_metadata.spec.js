import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import {
  fixtures,
  emptyTemplateId,
  noExtraTemplateId,
  allHaveExtraTemplateId,
  mixedTemplateId,
} from './fixtures.js';

let db;

describe('migration remove_nonexisting_metadata', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
    db = testingDB.mongodb;
    await migration.up(db);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(93);
  });

  it.each([
    {
      template: emptyTemplateId,
      expectedTitles: [
        'empty_correct_en',
        'empty_correct_es',
        'empty_correct_pt',
        'empty_plusOne_en',
        'empty_plusOne_es',
        'empty_plusOne_pt',
        'empty_plusThree_en',
        'empty_plusThree_es',
        'empty_plusThree_pt',
      ],
      expectedMetadata: {},
    },
    {
      template: noExtraTemplateId,
      expectedTitles: [
        'no_extra_correct1_en',
        'no_extra_correct1_es',
        'no_extra_correct1_pt',
        'no_extra_correct2_en',
        'no_extra_correct2_es',
        'no_extra_correct2_pt',
      ],
      expectedMetadata: { no_extra_number: [], no_extra_text: [] },
    },
    {
      template: allHaveExtraTemplateId,
      expectedTitles: [
        'all_extra_plusOne_en',
        'all_extra_plusOne_es',
        'all_extra_plusOne_pt',
        'all_extra_plusThree_en',
        'all_extra_plusThree_es',
        'all_extra_plusThree_pt',
      ],
      expectedMetadata: { all_extra_number: [], all_extra_text: [] },
    },
    {
      template: mixedTemplateId,
      expectedTitles: [
        'mixed_correct_en',
        'mixed_correct_es',
        'mixed_correct_pt',
        'mixed_plusOne_en',
        'mixed_plusOne_es',
        'mixed_plusOne_pt',
        'mixed_plusThree_en',
        'mixed_plusThree_es',
        'mixed_plusThree_pt',
      ],
      expectedMetadata: { mixed_number: [], mixed_text: [] },
    },
  ])(
    'should remove metadata that do not have a corresponding property on the template',
    async ({ template, expectedTitles, expectedMetadata }) => {
      const entities = await db.collection('entities').find({ template }).toArray();
      expect(entities.map(e => e.title)).toEqual(expectedTitles);
      entities.forEach(e => expect(e.metadata).toEqual(expectedMetadata));
    }
  );

  it('should ask for a reindex if things have changed', async () => {
    expect(migration.reindex).toBe(true);
  });

  it('should not ask for a reindex if nothing changed', async () => {
    migration.reindex = undefined;
    await testingDB.setupFixturesAndContext({
      templates: fixtures.templates.filter(t => t._id === noExtraTemplateId),
      entities: fixtures.entities.filter(e => e.template === noExtraTemplateId),
    });
    db = testingDB.mongodb;
    await migration.up(db);

    expect(migration.reindex).toBe(false);
  });
});
