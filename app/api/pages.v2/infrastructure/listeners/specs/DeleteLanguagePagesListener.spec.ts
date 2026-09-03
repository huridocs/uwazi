import db, { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { GetPageUseCaseFactory } from '#api/pages.v2/infrastructure/factories/GetPageUseCaseFactory.js';
import { ListPagesUseCaseFactory } from '#api/pages.v2/infrastructure/factories/ListPagesUseCaseFactory.js';
import { PageNotFoundError } from '#api/pages.v2/domain/errors.js';
import { UserRole } from '#api/core/domain/user/User.js';
import {
  applyPagesBackendFlags,
  pagesBackendConfigs,
  pagesBackendPostgresMirror,
} from '#api/pages.v2/specs/pagesBackendTest.js';
import { DeleteLanguagePagesListener } from '../DeleteLanguagePagesListener.js';

const userId = db.id();

const fixtures: DBFixture = {
  users: [{ _id: userId, username: 'user1', email: 'user1@test.com', role: UserRole.ADMIN }],
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
          draft: { content: '', script: '', css: '' },
        },
        es: {
          title: 'Página de prueba',
          draft: { content: '', script: '', css: '' },
        },
      },
    },
  ],
};

const heartbeat = jest.fn();

const createSUT = () =>
  testingEnvironment.runWithContext(() => new DeleteLanguagePagesListener({}));

const dispatch = async (listener: DeleteLanguagePagesListener, language: string): Promise<void> => {
  await testingEnvironment.runWithContext(async () => {
    await listener.handleDispatch(heartbeat, {
      tenantName: 'localhost',
      userId: userId.toString(),
      language,
    } as any);
  });
};

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe.each(pagesBackendConfigs)(
  'DeleteLanguagePagesListener - $name',
  ({ postgresPages, postgresSettings }) => {
    beforeEach(async () => {
      await testingEnvironment.setUp(fixtures, {
        postgres: true,
        postgresMirror: pagesBackendPostgresMirror(postgresSettings),
      });
      applyPagesBackendFlags(postgresPages, postgresSettings);
    });
    it('should remove locale for the deleted language', async () => {
      const listener = await createSUT();
      await dispatch(listener, 'es');

      await expect(
        testingEnvironment.runWithContext(async () =>
          GetPageUseCaseFactory.default().execute({ lookup: 'page1', language: 'es' })
        )
      ).rejects.toThrow(PageNotFoundError);
      const enPage = await testingEnvironment.runWithContext(async () =>
        GetPageUseCaseFactory.default().execute({ lookup: 'page1', language: 'en' })
      );
      expect(enPage.title).toBe('Test page');
    });

    it('should keep the page document', async () => {
      const listener = await createSUT();
      await dispatch(listener, 'es');

      const enPages = await testingEnvironment.runWithContext(async () =>
        ListPagesUseCaseFactory.default().execute({ language: 'en' })
      );
      expect(enPages).toHaveLength(1);
      expect(enPages[0].sharedId).toBe('page1');
    });
  }
);
