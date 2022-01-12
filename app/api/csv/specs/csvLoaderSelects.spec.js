import path from 'path';

import translations from 'api/i18n/translations';
import thesauri from 'api/thesauri';
import entities from 'api/entities';
import { fixtureFactory } from 'api/csv/specs/csvLoaderSelectsFixtures';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { fixtures } from './csvLoaderSelectsFixtures';

import { CSVLoader } from '../csvLoader';

const loader = new CSVLoader();

describe('loader', () => {
  let fileSpy;
  let selectThesaurus;
  let selectLabels;
  let selectLabelsSet;
  let multiselectThesaurus;
  let multiselectLabels;
  let multiselectLabelsSet;

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, 'csv_loader.index');
    await loader.load(
      path.join(__dirname, '/arrangeThesauriTest.csv'),
      fixtureFactory.id('template')
    );
    selectThesaurus = await thesauri.getById(fixtureFactory.id('Select Thesaurus'));
    selectLabels = selectThesaurus.values.map(tv => tv.label);
    selectLabelsSet = new Set(selectLabels);
    multiselectThesaurus = await thesauri.getById(fixtureFactory.id('multiselect_thesaurus'));
    multiselectLabels = multiselectThesaurus.values.map(tv => tv.label);
    multiselectLabelsSet = new Set(multiselectLabels);
  });
  afterAll(async () => {
    await testingEnvironment.tearDown();
    fileSpy.mockRestore();
  });

  it('should create values in thesauri', async () => {
    expect(selectLabels).toEqual(['A', 'B', 'Bes', 'C', 'Ces', 'd', 'des', 'Aes']);
    expect(multiselectLabels).toEqual([
      'A',
      'B',
      'Aes',
      'Bes',
      'c',
      'ces',
      'D',
      'E',
      'g',
      'Des',
      'Ees',
      'ges',
    ]);
  });

  it('should not add new values where there is none', async () => {
    const unchangedLabels = (
      await thesauri.getById(fixtureFactory.id('no_new_value_thesaurus'))
    ).values.map(tv => tv.label);
    expect(unchangedLabels).toEqual(['1', '2', '3']);
  });

  it('should not repeat case sensitive values', async () => {
    ['a', 'aes', 'b', 'bes', 'c', 'ces', 'D', 'Des'].forEach(letter =>
      expect(selectLabelsSet.has(letter)).toBe(false)
    );
    ['a', 'aes', 'b', 'bes', 'C', 'Ces', 'd', 'des', 'e', 'ees', 'G', 'Ges'].forEach(letter =>
      expect(multiselectLabelsSet.has(letter)).toBe(false)
    );
  });

  it('should not add values with trimmable white space or blank values', async () => {
    selectLabels.forEach(label => {
      expect(label).toBe(label.trim());
    });
    multiselectLabels.forEach(label => {
      expect(label).toBe(label.trim());
    });
  });

  it('should not create repeated values', async () => {
    expect(selectLabels.length).toBe(selectLabelsSet.size);
    expect(multiselectLabels.length).toBe(multiselectLabelsSet.size);
  });

  it('should check that the thesauri saving saves all contexts properly', async () => {
    const trs = await translations.get();
    trs.forEach(tr => {
      expect(tr.contexts.find(c => c.label === 'Select Thesaurus').values).toMatchObject({
        A: 'A',
        Aes: 'Aes',
        B: 'B',
        Bes: 'Bes',
        C: 'C',
        Ces: 'Ces',
        d: 'd',
        des: 'des',
        'Select Thesaurus': 'Select Thesaurus',
      });
      expect(tr.contexts.find(c => c.label === 'multiselect_thesaurus').values).toMatchObject({
        A: 'A',
        Aes: 'Aes',
        B: 'B',
        Bes: 'Bes',
        D: 'D',
        Des: 'Des',
        E: 'E',
        Ees: 'Ees',
        c: 'c',
        ces: 'ces',
        g: 'g',
        ges: 'ges',
        multiselect_thesaurus: 'multiselect_thesaurus',
      });
    });
  });

  describe('nested thesaurus', () => {
    let actualEntities;

    const getMetadataValues = propertyName =>
      actualEntities.reduce(
        (result, e) => ({
          ...result,
          ...(e.metadata[propertyName]?.length
            ? { [e.title]: e.metadata[propertyName].map(v => v.label).join('|') }
            : {}),
        }),
        {}
      );

    beforeAll(async () => {
      actualEntities = await entities.get({
        template: fixtureFactory.id('template'),
        language: 'en',
      });
    });

    it('should only add as new root values those which are not nested values', async () => {
      const nestedThesaurus = await thesauri.getById(fixtureFactory.id('nested_thesaurus'));
      const rootLabels = nestedThesaurus.values.map(value => value.label);
      expect(rootLabels).toEqual(['A', 'C', 'B', 'P', 'D', 'O', 'E', '0']);
    });

    it('should import a nested value for a select property', async () => {
      const selectValues = getMetadataValues('nested_select_property');
      expect(selectValues).toEqual({
        select_1: 'D',
        select_2: '1',
        select_3: 'X',
        select_4: '2',
        select_6: 'Y',
        select_8: 'X',
        multiselect_3: 'E',
        multiselect_6: 'B',
      });
    });

    it('should import nested values for a multiselect property', async () => {
      const multiSelectValues = getMetadataValues('nested_multiselect_property');
      expect(multiSelectValues).toEqual({
        select_1: '1|X',
        select_2: 'Z|O',
        select_5: 'A',
        select_7: '1',
        multiselect_7: '0',
      });
    });
  });
});
