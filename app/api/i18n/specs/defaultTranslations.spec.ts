/* eslint-disable node/no-restricted-import */
import fs from 'fs';
import { readdir } from 'fs/promises';

import { validateFormat } from 'api/csv/csv';

import { DefaultTranslations } from '../defaultTranslations';

const TRANSLATION_FILES_DIR = DefaultTranslations.CONTENTS_DIRECTORY;

type defaulTranslationInfo = {
  key: string;
  longName: string;
};

const EXPECTED_DEFAULT_TRANSLATIONS: defaulTranslationInfo[] = [
  {
    key: 'ar',
    longName: 'Arabic',
  },
  {
    key: 'en',
    longName: 'English',
  },
  {
    key: 'es',
    longName: 'Spanish',
  },
  {
    key: 'fr',
    longName: 'French',
  },
  {
    key: 'ko',
    longName: 'Korean',
  },
  {
    key: 'my',
    longName: 'Burmese',
  },
  {
    key: 'ru',
    longName: 'Russian',
  },
  {
    key: 'th',
    longName: 'Thai',
  },
  {
    key: 'tr',
    longName: 'Turkish',
  },
];
const expectedFileNames = new Set(EXPECTED_DEFAULT_TRANSLATIONS.map(({ key }) => `${key}.csv`));

describe('translations.importPredefined()', () => {
  it('should expect the file to have 2 columns', async () => {
    expect(true).toBe(false);
  });

  it('should expect the file to have the columns "Key" and the long name of the language', async () => {
    expect(true).toBe(false);
  });

  it('should expect the file to have no empty values', async () => {
    expect(true).toBe(false);
  });
});

describe(`${TRANSLATION_FILES_DIR}`, () => {
  let files: string[] = [];
  let fileSet: Set<string> = new Set();

  beforeAll(async () => {
    files = await readdir(TRANSLATION_FILES_DIR);
    fileSet = new Set(files);
  });

  it('should have a file for each language', async () => {
    const missing = Array.from(expectedFileNames).filter(fileName => !fileSet.has(fileName));
    expect(missing).toEqual([]);
  });

  it('should not have extra files', async () => {
    const extra = files.filter(fileName => !expectedFileNames.has(fileName));
    if (extra.length > 0) {
      throw Error(
        `Extra files found: ${extra.join(
          ', '
        )}. Add languages to EXPECTED_DEFAULT_TRANSLATIONS in this test.`
      );
    }
  });
});

describe('translation files', () => {
  EXPECTED_DEFAULT_TRANSLATIONS.forEach(({ key, longName }) => {
    describe(`${key}.csv`, () => {
      it('should have a proper format', async () => {
        const filepath = `${TRANSLATION_FILES_DIR}/${key}.csv`;
        const file = fs.createReadStream(filepath);
        await validateFormat(file, {
          column_number: 2,
          required_headers: ['Key', longName],
          no_empty_values: true,
        });
      });

      it('should be able to be loaded through the api without error', async () => {
        expect(true).toBe(false);
      });
    });
  });
});
