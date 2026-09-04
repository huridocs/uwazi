import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { User } from '#api/users.v2/model/User.js';
import { fixtures } from '#api/pages.v2/specs/fixtures.js';
import {
  applyPagesBackendFlags,
  pagesBackendConfigs,
  pagesBackendPostgresMirror,
} from '#api/pages.v2/specs/pagesBackendTest.js';
import { PagesDataSourceFactory } from '#api/pages.v2/infrastructure/factories/PagesDataSourceFactory.js';
import { CreatePageUseCaseFactory } from '#api/pages.v2/infrastructure/factories/CreatePageUseCaseFactory.js';
import { mockID } from '#shared/uniqueID.js';

const editor = new User(new ObjectId().toString(), 'editor', []);

const withContext = async <T>(fn: () => Promise<T>) =>
  testingEnvironment.runWithContext(fn, { actor: editor });

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe.each(pagesBackendConfigs)(
  'CreatePage (integration) - $name',
  ({ postgresPages, postgresSettings }) => {
    beforeEach(async () => {
      jest.restoreAllMocks();
      await testingEnvironment.setUp(fixtures, {
        postgres: true,
        postgresMirror: pagesBackendPostgresMirror(postgresSettings),
      });
      applyPagesBackendFlags(postgresPages, postgresSettings);
    });

    it('should create a page from a flat client payload and return it in client shape', async () => {
      await withContext(async () => {
        mockID('new-page-id');

        const created = await CreatePageUseCaseFactory.default().execute({
          page: { title: 'Flow Page', draft: { content: '<p>Flow</p>', script: '', css: '' } },
          language: 'es',
        });

        expect(created.sharedId).toBeDefined();
        expect(created.title).toBe('Flow Page');

        const pagesDS = PagesDataSourceFactory.default();
        const page = (await pagesDS.getBySharedId(created.sharedId!)).getDataOrThrow();
        expect(page.getLocale('es').title).toBe('Flow Page');
      });
    });

    it('should create a page from an editor locales payload and return editor shape', async () => {
      await withContext(async () => {
        const created = await CreatePageUseCaseFactory.default().execute({
          page: {
            locales: {
              es: { title: 'Editor ES', draft: { content: '<p>ES</p>', script: '', css: '' } },
              en: { title: 'Editor EN', draft: { content: '<p>EN</p>', script: '', css: '' } },
            },
          },
        });

        expect(created.locales?.es?.title).toBe('Editor ES');
        expect(created.locales?.en?.title).toBe('Editor EN');
      });
    });

    it('should throw when the actor is anonymous', async () => {
      await testingEnvironment.runWithContext(
        async () => {
          await expect(
            CreatePageUseCaseFactory.default().execute({
              page: { title: 'No user page', draft: { content: '', script: '', css: '' } },
              language: 'es',
            })
          ).rejects.toThrow('missing user');
        },
        { actor: User.createFrom(null) }
      );
    });
  }
);
