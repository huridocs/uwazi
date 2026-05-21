import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { User } from '#api/users.v2/model/User.js';
import { fixtures } from '#api/pages/specs/fixtures.js';
import { PublishPageReleaseUseCaseFactory } from '#api/pages/infrastructure/factories/PublishPageReleaseUseCaseFactory.js';
import { RestorePageDraftUseCaseFactory } from '#api/pages/infrastructure/factories/RestorePageDraftUseCaseFactory.js';
import { AddLanguageToPagesUseCaseFactory } from '#api/pages/infrastructure/factories/AddLanguageToPagesUseCaseFactory.js';
import { RemoveLanguageFromPagesUseCaseFactory } from '#api/pages/infrastructure/factories/RemoveLanguageFromPagesUseCaseFactory.js';
import { PagesDataSourceFactory } from '#api/pages/infrastructure/factories/PagesDataSourceFactory.js';
import { PageReleasesDataSourceFactory } from '#api/pages/infrastructure/factories/PageReleasesDataSourceFactory.js';
import pages from '#api/pages/pages.js';
import { mockID } from '#shared/uniqueID.js';
import db from '#api/utils/testing_db.js';

const PUBLISHABLE_SHARED_ID = '3';
const editor = new User(new ObjectId().toString(), 'editor', []);

const withContext = <T>(fn: () => Promise<T>) =>
  testingEnvironment.runWithContext(fn, { actor: editor });

const seedPublishableDraft = async () => {
  await withContext(async () => {
    const pagesDS = PagesDataSourceFactory.default();
    const page = (await pagesDS.getBySharedId(PUBLISHABLE_SHARED_ID)).getDataOrThrow();
    page.updateLocale('en', {
      draft: { content: '<p>Hello EN</p>', script: '', css: '' },
    });
    page.updateLocale('es', {
      draft: { content: '<p>Hola ES</p>', script: '', css: '' },
    });
    await pagesDS.update(page);
  });
};

describe('Pages use cases (integration)', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    await testingEnvironment.setUp(fixtures);
    await seedPublishableDraft();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('PublishPageRelease', () => {
    it('should persist a release with version 1 and actor id', async () => {
      await withContext(async () => {
        const result = await PublishPageReleaseUseCaseFactory.default().execute({
          sharedId: PUBLISHABLE_SHARED_ID,
          release_message: 'First release',
          language: 'en',
        });

        expect(result.version).toBe(1);
        expect(result.releases).toHaveLength(1);

        const pagesDS = PagesDataSourceFactory.default();
        const page = (await pagesDS.getBySharedId(PUBLISHABLE_SHARED_ID)).getDataOrThrow();
        const releases = await testingEnvironment.db.getCollection('page_releases')!.find({
          page: ObjectId.createFromHexString(page.id),
        }).toArray();

        expect(releases).toHaveLength(1);
        expect(releases[0].version).toBe(1);
        expect(releases[0].release_message).toBe('First release');
        expect(releases[0].user?.toString()).toBe(editor._id.toString());
      });
    });

    it('should increment version on subsequent publishes', async () => {
      await withContext(async () => {
        const sut = PublishPageReleaseUseCaseFactory.default();
        await sut.execute({
          sharedId: PUBLISHABLE_SHARED_ID,
          release_message: 'v1',
          language: 'en',
        });
        const second = await sut.execute({
          sharedId: PUBLISHABLE_SHARED_ID,
          release_message: 'v2',
          language: 'en',
        });

        expect(second.version).toBe(2);
        expect(second.releases).toHaveLength(2);
      });
    });
  });

  describe('RestorePageDraft', () => {
    it('should restore draft content from a release', async () => {
      await withContext(async () => {
        const publish = PublishPageReleaseUseCaseFactory.default();
        await publish.execute({
          sharedId: PUBLISHABLE_SHARED_ID,
          release_message: 'baseline',
          language: 'en',
        });

        const pagesDS = PagesDataSourceFactory.default();
        const page = (await pagesDS.getBySharedId(PUBLISHABLE_SHARED_ID)).getDataOrThrow();
        page.updateLocale('en', {
          draft: { content: '<p>Changed draft</p>', script: '', css: '' },
        });
        await pagesDS.update(page);

        const restored = await RestorePageDraftUseCaseFactory.default().execute({
          sharedId: PUBLISHABLE_SHARED_ID,
          version: 1,
          language: 'en',
        });

        expect(restored.draft?.content).toBe('<p>Hello EN</p>');
      });
    });
  });

  describe('AddLanguageToPages / RemoveLanguageFromPages', () => {
    it('should add a locale to all pages from the default language', async () => {
      await withContext(async () => {
        await AddLanguageToPagesUseCaseFactory.default().execute({
          language: 'pt',
          defaultLanguage: 'es',
        });

        const pagesDS = PagesDataSourceFactory.default();
        const page = (await pagesDS.getBySharedId(PUBLISHABLE_SHARED_ID)).getDataOrThrow();
        expect(page.getLocaleKeys()).toContain('pt');
        expect(page.getLocale('pt').title).toBe(page.getLocale('es').title);
      });
    });

    it('should remove a locale from all pages', async () => {
      await withContext(async () => {
        await RemoveLanguageFromPagesUseCaseFactory.default().execute({ language: 'fr' });

        const pagesDS = PagesDataSourceFactory.default();
        const all = await pagesDS.getAll();
        all.forEach(p => {
          expect(p.getLocaleKeys()).not.toContain('fr');
        });
      });
    });
  });

  describe('pages service with data layer', () => {
    it('should save, publish, and resolve by slug through pages service', async () => {
      await withContext(async () => {
        mockID('pages-flow-id');
        const user = { _id: db.id() };

        const created = await pages.save(
          {
            title: 'Flow Page',
            slug: 'flow-page',
            draft: { content: '<p>Flow</p>', script: '', css: '' },
          },
          user,
          'en'
        );

        const sharedId = created.sharedId!;
        await PublishPageReleaseUseCaseFactory.default().execute({
          sharedId,
          release_message: 'flow release',
          language: 'en',
        });

        const bySlug = await pages.getById({ slug: 'flow-page' }, 'en');
        expect(bySlug.sharedId).toBe(sharedId);

        const pagesDS = PagesDataSourceFactory.default();
        const page = (await pagesDS.getBySharedId(sharedId)).getDataOrThrow();
        const releasesDS = PageReleasesDataSourceFactory.default();
        const releases = await releasesDS.listByPageId(page.id);
        expect(releases).toHaveLength(1);
        expect(releases[0].releaseMessage).toBe('flow release');
      });
    });
  });
});
