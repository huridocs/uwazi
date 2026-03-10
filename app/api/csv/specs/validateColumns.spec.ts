import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { ArrangeColumnsError } from '../validateColumns';
import { CSVLoader } from '../csvLoader';
import { mockCsvFileReadStream } from './helpers';

const loader = new CSVLoader();
const fixtureFactory = getFixturesFactory();

const fixtures: DBFixture = {
  templates: [
    fixtureFactory.template('template', [
      fixtureFactory.property('textprop', 'text'),
      fixtureFactory.property('numberprop', 'numeric'),
      fixtureFactory.property('dateprop', 'date'),
      fixtureFactory.property('selectprop', 'select'),
      fixtureFactory.property('multiselectprop', 'multiselect'),
    ]),
  ],
  settings: [
    {
      site_name: 'Uwazi',
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],
};

describe('csvLoader', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, 'csv_loader.index');
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it.each([
    {
      reason: 'properties should not mix language and non-language columns',
      csv: 'title, textprop, textprop__es, textprop__en',
      message: 'Properties "textprop" mix language and non-language columns.',
    },
    {
      reason: 'should not allow language columns for properties that are not multilingual (number)',
      csv: 'title, numberprop__es, numberprop__en',
      message: 'Property "numberprop" does not support languages.',
    },
    {
      reason: 'should not allow language columns for properties that are not multilingual (date)',
      csv: 'title, dateprop__es, dateprop__en',
      message: 'Property "dateprop" does not support languages.',
    },
    {
      reason:
        'properties with language should have the default language, if using languages (title)',
      csv: 'title__es',
      message: 'Property "title" uses languages, but does not have a default language column.',
    },
    {
      reason:
        'properties with language should have the default language, if using languages (text)',
      csv: 'title, textprop__es',
      message: 'Property "textprop" uses languages, but does not have a default language column.',
    },
    {
      reason:
        'properties with language should have the default language, if using languages (select)',
      csv: 'title, selectprop__es',
      message: 'Property "selectprop" uses languages, but does not have a default language column.',
    },
    {
      reason:
        'properties with language should have the default language, if using languages (multiselect)',
      csv: 'title, multiselectprop__es',
      message:
        'Property "multiselectprop" uses languages, but does not have a default language column.',
    },
  ])('$reason', async ({ csv, message }) => {
    const mockedFile = mockCsvFileReadStream(csv);
    try {
      await loader.load('mocked_file', fixtureFactory.id('template'));
      expect.fail(`Should have thrown an ${ArrangeColumnsError.name} error.}`);
    } catch (e) {
      expect(e).toBeInstanceOf(ArrangeColumnsError);
      expect(e.message.startsWith(message)).toBe(true);
    } finally {
      mockedFile.mockRestore();
    }
  });
});
