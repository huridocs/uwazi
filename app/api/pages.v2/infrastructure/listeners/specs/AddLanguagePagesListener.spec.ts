import db, { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import { GetPageUseCaseFactory } from '#api/pages.v2/infrastructure/factories/GetPageUseCaseFactory.js';
import { ListPagesUseCaseFactory } from '#api/pages.v2/infrastructure/factories/ListPagesUseCaseFactory.js';
import { PageNotFoundError } from '#api/pages.v2/domain/errors.js';
import {
  applyPagesBackendFlags,
  pagesBackendConfigs,
  pagesBackendPostgresMirror,
} from '#api/pages.v2/specs/pagesBackendTest.js';
import { AddLanguagePagesListener } from '../AddLanguagePagesListener.js';

const user1 = db.id();

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { default: true, key: 'en', label: 'English' },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],
  pages: [
    {
      _id: db.id(),
      sharedId: 'page1',
      creationDate: 1000,
      locales: {
        en: {
          title: 'Test page',
          draft: { content: '<p>en</p>', script: '', css: '' },
        },
      },
    },
  ],
};

const heartbeat = jest.fn();

const createSUT = () => testingEnvironment.runWithContext(() => new AddLanguagePagesListener({}));

const dispatch = async (listener: AddLanguagePagesListener, language: string): Promise<void> => {
  await testingEnvironment.runWithContext(async () => {
    await listener.handleDispatch(heartbeat, {
      tenantName: 'localhost',
      userId: user1.toString(),
      language,
      defaultLanguage: 'en',
    } as any);
  });
};

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe.each(pagesBackendConfigs)(
  'AddLanguagePagesListener - $name',
  ({ postgresPages, postgresSettings }) => {
    beforeEach(async () => {
      await testingEnvironment.setUp(fixtures, {
        postgres: true,
        postgresMirror: pagesBackendPostgresMirror(postgresSettings),
      });
      applyPagesBackendFlags(postgresPages, postgresSettings);
    });
    describe('when the language still exists in settings', () => {
      it('should add locale to existing pages', async () => {
        const listener = await createSUT();
        await dispatch(listener, 'es');

        const page = await testingEnvironment.runWithContext(async () =>
          GetPageUseCaseFactory.default().execute({ lookup: 'page1', language: 'es' })
        );
        expect(page.title).toBe('Test page');
        expect(page.draft?.content).toBe('<p>en</p>');
        const all = await testingEnvironment.runWithContext(async () =>
          ListPagesUseCaseFactory.default().execute({ language: 'en' })
        );
        expect(all).toHaveLength(1);
      });
    });

    describe('when the language no longer exists in settings', () => {
      it('should throw a NonRetryableJobError and not create locale', async () => {
        const listener = await createSUT();
        await expect(dispatch(listener, 'fr')).rejects.toThrow(NonRetryableJobError);

        await expect(
          testingEnvironment.runWithContext(async () =>
            GetPageUseCaseFactory.default().execute({ lookup: 'page1', language: 'fr' })
          )
        ).rejects.toThrow(PageNotFoundError);
      });
    });
  }
);
