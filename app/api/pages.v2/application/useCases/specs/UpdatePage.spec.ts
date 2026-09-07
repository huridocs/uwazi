import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { User } from '#api/users.v2/model/User.js';
import { fixtures } from '#api/pages.v2/specs/fixtures.js';
import { PagesDataSourceFactory } from '#api/pages.v2/infrastructure/factories/PagesDataSourceFactory.js';
import { UpdatePageUseCaseFactory } from '#api/pages.v2/infrastructure/factories/UpdatePageUseCaseFactory.js';

const testConfigs = [
  { name: 'Mongo', postgresPages: false },
  { name: 'Postgres', postgresPages: true },
];

const editor = new User(new ObjectId().toString(), 'editor', []);

const withContext = async <T>(fn: () => Promise<T>) =>
  testingEnvironment.runWithContext(fn, { actor: editor });

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe.each(testConfigs)('UpdatePage (integration) - $name', ({ postgresPages }) => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    await testingEnvironment.setUp(fixtures, { postgres: true, postgresMirror: ['pages'] });
    testingTenants.changeCurrentTenant({ featureFlags: { postgresPages } });
  });

  it('should update a page from a flat client payload and return it in client shape', async () => {
    await withContext(async () => {
      const updated = await UpdatePageUseCaseFactory.default().execute({
        page: {
          sharedId: '2',
          title: 'Penguin almost done - updated',
          draft: { content: '<p>Updated</p>', script: '', css: '' },
        },
        language: 'es',
      });

      expect(updated.title).toBe('Penguin almost done - updated');

      const pagesDS = PagesDataSourceFactory.default();
      const page = (await pagesDS.getBySharedId('2')).getDataOrThrow();
      expect(page.getLocale('es').title).toBe('Penguin almost done - updated');
    });
  });

  it('should update a page from an editor locales payload and return editor shape', async () => {
    await withContext(async () => {
      const updated = await UpdatePageUseCaseFactory.default().execute({
        page: {
          sharedId: '2',
          locales: {
            es: { title: 'ES updated', draft: { content: '<p>ES</p>', script: '', css: '' } },
          },
        },
      });

      expect(updated.locales?.es?.title).toBe('ES updated');
    });
  });

  it('should throw when the page does not exist', async () => {
    await withContext(async () => {
      await expect(
        UpdatePageUseCaseFactory.default().execute({
          page: {
            sharedId: 'missing-shared-id',
            title: 'x',
            draft: { content: '', script: '', css: '' },
          },
          language: 'es',
        })
      ).rejects.toThrow();
    });
  });
});
