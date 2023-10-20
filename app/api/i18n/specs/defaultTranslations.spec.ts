/* eslint-disable node/no-restricted-import */
import { readdir } from 'fs/promises';
import request from 'supertest';
import waitForExpect from 'wait-for-expect';

import { validateFormat, ValidateFormatError } from 'api/csv/csv';
import { expectThrow } from 'api/utils/jestHelpers';
import { DBFixture } from 'api/utils/testing_db';
import { iosocket, setUpApp } from 'api/utils/testingRoutes';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { UserRole } from 'shared/types/userSchema';

import { DefaultTranslations } from '../defaultTranslations';
import i18nRoutes from '../routes';
import translations from '../translations';

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

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        {
          key: 'en',
          label: 'English',
          default: true,
        },
        {
          key: 'es',
          label: 'Spanish',
        },
      ],
    },
  ],
};

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('translations.importPredefined()', () => {
  beforeAll(async () => {
    DefaultTranslations.CONTENTS_DIRECTORY =
      './app/api/i18n/specs/test_contents/filesForDefaultTranslations';
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    DefaultTranslations.CONTENTS_DIRECTORY = TRANSLATION_FILES_DIR;
  });

  it.each([{ key: 'en' }, { key: 'ar' }])(
    'should expect the file to have 2 columns',
    async ({ key }) => {
      await expectThrow(
        async () => translations.importPredefined(key),
        ValidateFormatError,
        'Expected 2 columns, but found 3.'
      );
    }
  );

  it('should expect the file to have the columns "Key" and the long name of the language', async () => {
    await expectThrow(
      async () => translations.importPredefined('es'),
      ValidateFormatError,
      'Missing required headers: Spanish.'
    );

    await expectThrow(
      async () => translations.importPredefined('fr'),
      ValidateFormatError,
      'Missing required headers: Key.'
    );
  });

  it('should expect the file to have no empty values', async () => {
    await expectThrow(
      async () => translations.importPredefined('ru'),
      ValidateFormatError,
      'Empty value at row 3, column "Russian".'
    );
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
  const app = setUpApp(i18nRoutes, (req, _res, next) => {
    req.user = {
      username: 'admin',
      role: UserRole.ADMIN,
      email: 'admin@test.com',
    };
    next();
  });

  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
    iosocket.emit.mockReset();
  });

  EXPECTED_DEFAULT_TRANSLATIONS.forEach(({ key, longName }) => {
    describe(`${key}.csv`, () => {
      it('should have a proper format', async () => {
        const filepath = `${TRANSLATION_FILES_DIR}/${key}.csv`;
        await validateFormat(filepath, {
          column_number: 2,
          required_headers: ['Key', longName],
          no_empty_values: true,
        });
      });

      it('should be able to be loaded through the api without error', async () => {
        await request(app)
          .post('/api/translations/languages')
          .send([{ key, label: longName }]);
        const emits = iosocket.emit.mock.calls;
        await waitForExpect(() => {
          expect(emits[emits.length - 1]).toEqual(['translationsInstallDone', 'session']);
        });
      });
    });
  });
});
