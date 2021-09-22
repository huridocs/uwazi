import path from 'path';

import templates from 'api/templates';
import thesauri from 'api/thesauri';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import db from 'api/utils/testing_db';

import { arrangeThesauri } from '../importEntity';
import importFile from '../importFile';
import { mockCsvFileReadStream } from './helpers';

const fixtureFactory = getFixturesFactory();

const fixtures = {
  dictionaries: [
    fixtureFactory.thesauri('select_thesaurus', ['A']),
    fixtureFactory.thesauri('multiselect_thesaurus', ['A', 'B']),
  ],
  templates: [
    fixtureFactory.template('template', [
      fixtureFactory.property('unrelated_property', 'text'),
      fixtureFactory.property('select_property', 'select', {
        content: fixtureFactory.id('select_thesaurus'),
      }),
      fixtureFactory.property('multiselect_property', 'multiselect', {
        content: fixtureFactory.id('multiselect_thesaurus'),
      }),
    ]),
    fixtureFactory.template('no_selects_template', [
      fixtureFactory.property('unrelated_property', 'text'),
    ]),
  ],
  entities: [
    fixtureFactory.entity('existing_entity_id', 'template', {
      unrelated_property: fixtureFactory.metadataValue('unrelated_value'),
      select_property: fixtureFactory.metadataValue('A'),
      multiselect_property: [fixtureFactory.metadataValue('A'), fixtureFactory.metadataValue('B')],
    }),
  ],
  settings: [
    {
      _id: db.id(),
      site_name: 'Uwazi',
      languages: [{ key: 'en', label: 'English', default: true }],
    },
  ],
};

describe('arrangeThesauri', () => {
  let file;
  let fileSpy;
  let template;
  let selectThesaurus;
  let selectLabels;
  let selectLabelsSet;
  let multiselectThesaurus;
  let multiselectLabels;
  let multiselectLabelsSet;

  beforeAll(async () => {
    await db.clearAllAndLoad(fixtures);
    template = await templates.getById(fixtureFactory.id('template'));
    file = importFile(path.join(__dirname, '/arrangeThesauriTest.csv'));
    await arrangeThesauri(file, template);
    selectThesaurus = await thesauri.getById(fixtureFactory.id('select_thesaurus'));
    selectLabels = selectThesaurus.values.map(tv => tv.label);
    selectLabelsSet = new Set(selectLabels);
    multiselectThesaurus = await thesauri.getById(fixtureFactory.id('multiselect_thesaurus'));
    multiselectLabels = multiselectThesaurus.values.map(tv => tv.label);
    multiselectLabelsSet = new Set(multiselectLabels);
  });
  afterAll(async () => {
    db.disconnect();
    fileSpy.mockRestore();
  });

  it('should not fail on templates with no select or multiselect fields', async () => {
    const noselTemplate = templates.getById(fixtureFactory.id('no_selects_template'));
    const csv = `title,unrelated_text
first,first
second,second`;
    const readStreamMock = mockCsvFileReadStream(csv);
    await arrangeThesauri(importFile('mockedFile'), noselTemplate);
    readStreamMock.mockRestore();
  });

  it('should not fail if the select or multiselect fields are missing from the csv', async () => {
    const noselTemplate = templates.getById(fixtureFactory.id('template'));
    const csv = `title,unrelated_property
first,first
second,second`;
    const readStreamMock = mockCsvFileReadStream(csv);
    await arrangeThesauri(importFile('mockedFile'), noselTemplate);
    readStreamMock.mockRestore();
  });

  it('should create values in thesauri', async () => {
    expect(selectLabels).toEqual(['A', 'B', 'C', 'd']);
    expect(multiselectLabels).toEqual(['A', 'B', 'c', 'D', 'E', 'g']);
  });

  it('should not repeat case sensitive values', async () => {
    ['a', 'b', 'c', 'D'].forEach(letter => expect(selectLabelsSet.has(letter)).toBe(false));
    ['a', 'b', 'C', 'd', 'e', 'G'].forEach(letter =>
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
});
