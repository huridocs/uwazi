import path from 'path';

import translations from 'api/i18n/translations';
import thesauri from 'api/thesauri';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import db from 'api/utils/testing_db';

import { CSVLoader } from '../csvLoader';

const fixtureFactory = getFixturesFactory();

const commonTranslationContexts = (id1, id2) => [
  {
    id: 'System',
    label: 'System',
    values: [
      { key: 'original 1', value: 'original 1' },
      { key: 'original 2', value: 'original 2' },
      { key: 'original 3', value: 'original 3' },
    ],
  },
  {
    id: id1.toString(),
    label: 'Select Thesaurus',
    values: [
      { key: 'Select Thesaurus', value: 'Select Thesaurus' },
      { key: 'A', value: 'A' },
    ],
    type: 'Dictionary',
  },
  {
    id: id2.toString(),
    label: 'multiselect_thesaurus',
    values: [
      { key: 'multiselect_thesaurus', value: 'multiselect_thesaurus' },
      { key: 'A', value: 'A' },
      { key: 'B', value: 'B' },
    ],
    type: 'Dictionary',
  },
];

const fixtures = {
  dictionaries: [
    fixtureFactory.thesauri('Select Thesaurus', ['A']),
    fixtureFactory.thesauri('multiselect_thesaurus', ['A', 'B']),
  ],
  templates: [
    fixtureFactory.template('template', [
      fixtureFactory.property('unrelated_property', 'text'),
      fixtureFactory.property('select_property', 'select', {
        content: fixtureFactory.id('Select Thesaurus'),
        label: 'Select Property',
      }),
      fixtureFactory.property('multiselect_property', 'multiselect', {
        content: fixtureFactory.id('multiselect_thesaurus'),
        label: 'Multiselect Property',
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
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],
  translations: [
    {
      _id: db.id(),
      locale: 'en',
      contexts: commonTranslationContexts(
        fixtureFactory.id('Select Thesaurus'),
        fixtureFactory.id('multiselect_thesaurus')
      ),
    },
    {
      _id: db.id(),
      locale: 'es',
      contexts: commonTranslationContexts(
        fixtureFactory.id('Select Thesaurus'),
        fixtureFactory.id('multiselect_thesaurus')
      ),
    },
  ],
};

const loader = new CSVLoader();

// eslint-disable-next-line max-statements
describe('loader', () => {
  let fileSpy;
  let selectThesaurus;
  let selectLabels;
  let selectLabelsSet;
  let multiselectThesaurus;
  let multiselectLabels;
  let multiselectLabelsSet;

  beforeAll(async () => {
    await db.clearAllAndLoad(fixtures);
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
    db.disconnect();
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
});
