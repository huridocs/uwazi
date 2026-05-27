import { mockID } from '#shared/uniqueID.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import date from '#api/utils/date.js';
import db from '#api/utils/testing_db.js';

import { fixtures, pageToUpdate } from './fixtures.js';
import pages from '../pages.js';

const withContext = async <T>(fn: () => Promise<T>) => testingEnvironment.runWithContext(fn);

describe('pages', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('save', () => {
    it('should create a new page with locales for each installed language', async () => {
      await withContext(async () => {
        jest.spyOn(date, 'currentUTC').mockReturnValue(1);
        mockID('sharedid');

        const page = { title: 'Batman begins' };
        const user = { _id: db.id() };

        const result = await pages.save(page, user, 'es');
        const sharedId = result.sharedId || '';
        const [es, en, pt] = await Promise.all([
          pages.getById(sharedId, 'es'),
          pages.getById(sharedId, 'en'),
          pages.getById(sharedId, 'pt'),
        ]);

        expect([es.title, en.title, pt.title]).toEqual([page.title, page.title, page.title]);
        expect(es.creationDate).toEqual(1);
        expect(es.markdownSupport).toBe(false);

        const allDocs = await pages.get({});
        const created = allDocs.filter(p => p.sharedId === sharedId);
        expect(created).toHaveLength(1);
      });
    });

    it('should fail if new page saved but no user passed', async () => {
      await withContext(async () => {
        expect.assertions(1);
        const page = { title: 'Batman returns' };

        try {
          await pages.save(page);
        } catch (err) {
          expect((err as Error).message).toBe('missing user');
        }
      });
    });

    it('should return the newly created page', async () => {
      await withContext(async () => {
        const page = { title: 'the dark knight' };
        const user = { _id: db.id() };

        const createdPage = await pages.save(page, user, 'es');

        expect(createdPage._id?.toString()).toBeDefined();
        expect(createdPage.title).toBe(page.title);
        expect(createdPage.language).toBe('es');
      });
    });

    describe('when updating', () => {
      it('should not change creation date on partial update', async () => {
        await withContext(async () => {
          jest.spyOn(date, 'currentUTC').mockReturnValue(10);

          const modifiedDoc = await pages.save(
            { _id: pageToUpdate, sharedId: '2', title: 'Edited title', entityView: true },
            { username: 'another_user' } as any
          );

          expect(modifiedDoc.title).toBe('Edited title');

          const doc = await pages.getById('2', 'es');
          expect(doc.creationDate).toBe(1);
        });
      });

      it('should save entityView on the unified page document', async () => {
        await withContext(async () => {
          const pageToUpdateEntityView = await pages.getById('3', 'en');
          await pages.save({ ...pageToUpdateEntityView, entityView: true });
          const en = await pages.getById('3', 'en');
          const es = await pages.getById('3', 'es');
          expect(en.entityView).toBe(true);
          expect(es.entityView).toBe(true);
        });
      });
    });
  });

  describe('delete', () => {
    it('should delete the page by sharedId', async () => {
      await withContext(async () => {
        const user = { _id: db.id() };
        const created = await pages.save({ title: 'Page to delete' }, user, 'en');
        const sharedId = created.sharedId!;
        await pages.delete(sharedId);
        const result = await pages.get({ sharedId });
        expect(result.length).toBe(0);
      });
    });
    it('should not allow deleting pages used as entity view', async () => {
      await withContext(async () => {
        const sharedId = '1';
        try {
          await pages.delete(sharedId);
        } catch (err) {
          expect((err as Error).message).toContain(
            'This page is in use by the following templates:'
          );
        }
      });
    });
  });

  describe('addLanguage()', () => {
    it('should add locale on all pages from the default language', async () => {
      await withContext(async () => {
        await pages.addLanguage('pt');
        const newPages = await pages.get({ language: 'pt' });
        expect(newPages.length).toBe(3);
      });
    });

    it('should not duplicate locale if the language already exists', async () => {
      await withContext(async () => {
        const oldCount = await pages.get({ language: 'en' });
        await pages.addLanguage('en');
        const newCount = await pages.get({ language: 'en' });
        expect(newCount.length).toBe(oldCount.length);
      });
    });
  });

  describe('editor mode', () => {
    it('should load all installed locales with mode=editor', async () => {
      await withContext(async () => {
        const editorPage = await pages.getById('1', undefined, 'editor');
        expect(editorPage.locales).toBeDefined();
        expect(editorPage.locales?.es?.title).toBe('Batman finishes');
        expect(editorPage.locales?.en?.title).toBe('Batman finishes');
        expect(editorPage.locales?.pt?.title).toBe('');
        expect(editorPage.title).toBeUndefined();
        expect(editorPage.releasesByLocale).toBeDefined();
      });
    });

    it('should save and round-trip multi-locale editor payload', async () => {
      await withContext(async () => {
        const user = { _id: db.id() };
        mockID('editor-multi');
        const created = await pages.save(
          {
            locales: {
              es: { title: 'Título ES', draft: { content: '<p>es</p>' } },
              en: { title: 'Title EN', draft: { content: '<p>en</p>' } },
              pt: { title: 'Título PT', draft: { content: '<p>pt</p>' } },
            },
          },
          user
        );

        expect(created.locales?.es?.title).toBe('Título ES');
        expect(created.locales?.en?.title).toBe('Title EN');

        const loaded = await pages.getById(created.sharedId!, undefined, 'editor');
        expect(loaded.locales?.es?.draft?.content).toBe('<p>es</p>');
        expect(loaded.locales?.pt?.title).toBe('Título PT');
      });
    });

    it('should reject unknown language keys in editor save', async () => {
      await withContext(async () => {
        expect.assertions(1);
        const user = { _id: db.id() };
        try {
          await pages.save(
            {
              sharedId: '2',
              locales: {
                xx: { title: 'Bad' },
              },
            },
            user
          );
        } catch (error) {
          expect((error as { code?: number }).code).toBe(400);
        }
      });
    });

    it('should update only provided locales without wiping others', async () => {
      await withContext(async () => {
        const { PagesDataSourceFactory } =
          await import('#api/pages/infrastructure/factories/PagesDataSourceFactory.js');
        const pagesDS = PagesDataSourceFactory.default();
        const user = { _id: db.id() };
        const editorBefore = await pages.getById('2', undefined, 'editor');
        await pages.save(
          {
            sharedId: '2',
            locales: {
              es: {
                title: 'Solo ES cambiado',
                draft: editorBefore.locales!.es!.draft ?? { content: '', script: '', css: '' },
              },
            },
          },
          user
        );
        const editorAfter = await pages.getById('2', undefined, 'editor');
        expect(editorAfter.locales?.es?.title).toBe('Solo ES cambiado');
        const domain = (await pagesDS.getBySharedId('2')).getDataOrThrow();
        expect(domain.getLocale('fr').title).toBe('Right there');
      });
    });
  });

  describe('getById', () => {
    it('should throws 404 error on unexistent id', async () => {
      await withContext(async () => {
        expect.assertions(1);
        try {
          await pages.getById('unexistent_id');
        } catch (error) {
          expect((error as { code?: number }).code).toBe(404);
        }
      });
    });
  });

  describe('getById lookup', () => {
    it('should resolve page only by sharedId', async () => {
      await withContext(async () => {
        const page = await pages.getById('1', 'es');
        expect(page.sharedId).toBe('1');
        expect(page.title).toBe('Batman finishes');
      });
    });
  });
});
