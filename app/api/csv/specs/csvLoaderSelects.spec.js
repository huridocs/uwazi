/* eslint-disable max-statements */
import path from 'path';

import translations from 'api/i18n/translations';
import thesauri from 'api/thesauri';
import entities from 'api/entities';
import { fixtureFactory } from 'api/csv/specs/csvLoaderSelectsFixtures';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { fixtures } from './csvLoaderSelectsFixtures';

import { CSVLoader } from '../csvLoader';
import { ArrangeThesauriError } from '../arrangeThesauri';

const loader = new CSVLoader();

const getMetadataProperties = (propertyName, entityList, prop) =>
  Object.fromEntries(
    entityList
      .map(e => [
        e.title,
        e.metadata[propertyName]?.length
          ? e.metadata[propertyName].map(v => v[prop]).join('|')
          : undefined,
      ])
      .filter(e => e[1])
  );

const getMetadataLabels = (propertyName, entityList) =>
  getMetadataProperties(propertyName, entityList, 'label');

const getMetadataValues = (propertyName, entityList) =>
  getMetadataProperties(propertyName, entityList, 'value');

const readThesaurusLabels = async thesaurisId => {
  const thesaurus = await thesauri.getById(thesaurisId.toString());
  return thesaurus.values.map(tv => [tv.label, (tv.values || []).map(v => v.label)]);
};

const thesaurusLabelsAreTrimmed = thesaurusValues =>
  thesaurusValues.every(([label, values]) => {
    if (label !== label.trim()) {
      return false;
    }
    if (values.some(v => v !== v.trim())) {
      return false;
    }
    return true;
  });

const thesaurusLabelsAreUnique = thesaurusValues => {
  const rootLabels = thesaurusValues.map(([label]) => label);
  if (new Set(rootLabels).size !== rootLabels.length) {
    return false;
  }
  return thesaurusValues.every(([, values]) => new Set(values).size === values.length);
};

describe('loader', () => {
  let selectLabels;
  let selectLabelsSet;
  let multiselectLabels;
  let multiselectLabelsSet;

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, 'csv_loader_selects.index');
    await loader.load(
      path.join(__dirname, '/arrangeThesauriTest.csv'),
      fixtureFactory.id('template')
    );
    selectLabels = await readThesaurusLabels(fixtureFactory.id('Select Thesaurus'));
    selectLabelsSet = new Set(selectLabels.flat(2));
    multiselectLabels = await readThesaurusLabels(fixtureFactory.id('multiselect_thesaurus'));
    multiselectLabelsSet = new Set(multiselectLabels.flat(2));
  }, 10000);

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create values in thesauri', async () => {
    expect(selectLabels).toEqual([
      ['A', []],
      ['1', ['1A', '1B', '1c']],
      ['B', []],
      ['C', []],
      ['d', []],
      ['g2', ['2A', '2b']],
      ['3', ['A']],
    ]);
    expect(multiselectLabels).toEqual([
      ['A', []],
      ['B', []],
      ['1', ['1A', '1b']],
      ['2', ['2A', '2B', '2C']],
      ['c', []],
      ['D', []],
      ['E', []],
      ['g', []],
      ['3', ['3a', '3B']],
      ['4', ['A']],
    ]);
  });

  it('should not add new values where there is none', async () => {
    const unchangedLabels = await readThesaurusLabels(fixtureFactory.id('no_new_value_thesaurus'));
    expect(unchangedLabels).toEqual([
      ['1', []],
      ['2', []],
      ['3', []],
    ]);
  });

  it('should not repeat case sensitive values', async () => {
    ['a', 'b', 'c', 'D', '1C', '2B'].forEach(letter =>
      expect(selectLabelsSet.has(letter)).toBe(false)
    );
    ['a', 'b', 'C', 'd', 'e', 'G', '1B', '2c'].forEach(letter =>
      expect(multiselectLabelsSet.has(letter)).toBe(false)
    );
  });

  it('should not add values with trimmable white space or blank values', async () => {
    expect(thesaurusLabelsAreTrimmed(selectLabels)).toBe(true);
    expect(thesaurusLabelsAreTrimmed(multiselectLabels)).toBe(true);
  });

  it('should not create repeated values', async () => {
    expect(thesaurusLabelsAreUnique(selectLabels)).toBe(true);
    expect(thesaurusLabelsAreUnique(multiselectLabels)).toBe(true);
  });

  it('should save all translation contexts properly', async () => {
    const trs = await translations.get();
    const english = trs.find(tr => tr.locale === 'en');
    const spanish = trs.find(tr => tr.locale === 'es');
    const englishSelectValues = english.contexts.find(c => c.label === 'Select Thesaurus').values;
    const spanishSelectValues = spanish.contexts.find(c => c.label === 'Select Thesaurus').values;
    const englishMultiselectValues = english.contexts.find(
      c => c.label === 'multiselect_thesaurus'
    ).values;
    const spanishMultiSelectValues = spanish.contexts.find(
      c => c.label === 'multiselect_thesaurus'
    ).values;
    expect(englishSelectValues).toEqual({
      1: '1',
      '1A': '1A',
      '1B': '1B',
      A: 'A',
      B: 'B',
      C: 'C',
      d: 'd',
      'Select Thesaurus': 'Select Thesaurus',
      '1c': '1c',
      g2: 'g2',
      '2A': '2A',
      '2b': '2b',
      3: '3',
    });
    expect(spanishSelectValues).toEqual({
      1: '1es',
      '1A': '1Aes',
      '1B': '1Bes',
      A: 'Aes',
      B: 'Bes',
      C: 'Ces',
      d: 'des',
      'Select Thesaurus': 'Select Thesaurus',
      '1c': '1ces',
      g2: 'g2es',
      '2A': '2Aes',
      '2b': '2bes',
      3: '3es',
    });
    expect(englishMultiselectValues).toEqual({
      A: 'A',
      B: 'B',
      1: '1',
      '1A': '1A',
      2: '2',
      '2A': '2A',
      '2B': '2B',
      D: 'D',
      E: 'E',
      c: 'c',
      g: 'g',
      multiselect_thesaurus: 'multiselect_thesaurus',
      '1b': '1b',
      '2C': '2C',
      3: '3',
      '3a': '3a',
      '3B': '3B',
      4: '4',
    });
    expect(spanishMultiSelectValues).toEqual({
      A: 'Aes',
      B: 'Bes',
      1: '1es',
      '1A': '1Aes',
      2: '2es',
      '2A': '2Aes',
      '2B': '2Bes',
      D: 'Des',
      E: 'Ees',
      c: 'ces',
      g: 'ges',
      multiselect_thesaurus: 'multiselect_thesaurus',
      '1b': '1bes',
      '2C': '2Ces',
      3: '3es',
      '3a': '3aes',
      '3B': '3Bes',
      4: '4es',
    });
  });

  it('should save metadata labels properly', async () => {
    const english = await entities.get({ language: 'en' });
    const spanish = await entities.get({ language: 'es' });
    const englishSelectLabels = getMetadataLabels('select_property', english);
    expect(englishSelectLabels).toMatchObject({
      select_1: 'B',
      select_2: 'C',
      select_3: 'B',
      select_4: 'B',
      select_5: 'd',
      select_6: 'd',
      select_7: 'B',
      multiselect_1: 'A',
    });
    const spanishSelectLabels = getMetadataLabels('select_property', spanish);
    expect(spanishSelectLabels).toMatchObject({
      select_1: 'Bes',
      select_2: 'Ces',
      select_3: 'Bes',
      select_4: 'Bes',
      select_5: 'des',
      select_6: 'des',
      select_7: 'Bes',
      multiselect_1: 'Aes',
    });
    const englishMultiselectLabels = getMetadataLabels('multiselect_property', english);
    expect(englishMultiselectLabels).toMatchObject({
      existing_entity_id: '|',
      select_8: 'A',
      multiselect_1: 'B',
      multiselect_2: 'c',
      multiselect_3: 'A|B',
      multiselect_4: 'A|B|c',
      multiselect_5: 'A|B',
      multiselect_7: 'A|B|c|D|E|g',
    });
    const spanishMultiselectLabels = getMetadataLabels('multiselect_property', spanish);
    expect(spanishMultiselectLabels).toMatchObject({
      select_8: 'Aes',
      multiselect_1: 'Bes',
      multiselect_2: 'ces',
      multiselect_3: 'Aes|Bes',
      multiselect_4: 'Aes|Bes|ces',
      multiselect_5: 'Aes|Bes',
      multiselect_7: 'Aes|Bes|ces|Des|Ees|ges',
    });
  });

  it('should share metadata values (thesauri value pointers) across languages', async () => {
    const english = await entities.get({ language: 'en' });
    const spanish = await entities.get({ language: 'es' });
    const englishSelectValues = getMetadataValues('select_property', english);
    const spanishSelectValues = getMetadataValues('select_property', spanish);
    expect(englishSelectValues).toEqual(spanishSelectValues);
    const englishMultiselectValues = getMetadataValues('multiselect_property', english);
    const spanishMultiselectValues = getMetadataValues('multiselect_property', spanish);
    expect(englishMultiselectValues).toEqual(spanishMultiselectValues);
  });

  it('should not allow importing existing group labels alone', async () => {
    try {
      await loader.load(
        path.join(__dirname, '/arrangeThesauriGroupErrorCase.csv'),
        fixtureFactory.id('template')
      );
      expect.fail(`Should have thrown an ${ArrangeThesauriError.name} error.}`);
    } catch (e) {
      expect(e).toBeInstanceOf(ArrangeThesauriError);
      expect(e.message).toBe(
        `The label "1" at property "select_property" is a group label in line:
{"title":"group_error_select_wrong","Select Property":"1"}`
      );
    }
  });
});
