import { mockID } from 'shared/uniqueID';
import date from 'api/utils/date.js';
import db from 'api/utils/testing_db';

import { fixtures, pageToUpdate } from './fixtures';
import pages from '../pages';

describe('pages', () => {
  beforeEach(async () => {
    await db.setupFixturesAndContext(fixtures);
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('save', () => {
    it('should create a new page with logged user id and UTC date for each language', async () => {
      jest.spyOn(date, 'currentUTC').mockReturnValue(1);
      mockID('sharedid');

      const page = { title: 'Batman begins' };
      const user = { _id: db.id() };

      const result = await pages.save(page, user, 'es');
      const sharedId = result.sharedId || '';
      const [es, en, pt] = await Promise.all([
        pages.getById(sharedId, 'es', 'title creationDate user'),
        pages.getById(sharedId, 'en', 'title creationDate user'),
        pages.getById(sharedId, 'pt', 'title creationDate user'),
      ]);

      expect([es.title, en.title, pt.title]).toEqual([page.title, page.title, page.title]);
      expect(es.user?.toString()).toBe(user._id.toString());
      expect(es.creationDate).toEqual(1);
    });

    it('should fail if new page saved but no user passed', async () => {
      expect.assertions(1);
      const page = { title: 'Batman returns' };

      try {
        await pages.save(page);
      } catch (err) {
        expect(err.message).toBe('missing user');
      }
    });

    it('should return the newly created page', async () => {
      const page = { title: 'the dark knight' };
      const user = { _id: db.id() };

      const createdPage = await pages.save(page, user, 'es');

      expect(createdPage._id.toString()).toBeDefined();
      expect(createdPage.title).toBe(page.title);
      expect(createdPage.language).toBe('es');

      const [pageInDB] = await pages.get(createdPage._id, 'creationDate user');

      expect(pageInDB.user?.toString()).toBe(user._id.toString());
    });

    describe('when updating', () => {
      it('should not assign again user and creation date and partial update data', async () => {
        jest.spyOn(date, 'currentUTC').mockReturnValue(10);

        const modifiedDoc = await pages.save(
          { _id: pageToUpdate, sharedId: '1', title: 'Edited title', entityView: true },
          { username: 'another_user' }
        );

        expect(modifiedDoc.title).toBe('Edited title');

        const [doc] = await pages.get(modifiedDoc._id, 'creationDate user');

        expect(doc.user).not.toBe('another_user');
        expect(doc.creationDate).toBe(1);
      });

      it('should save the same entityView value across all languages', async () => {
        const pageToUpdateEntityView = await pages.get({ sharedId: '3', language: 'en' });
        await pages.save({ ...pageToUpdateEntityView[0], entityView: true });
        const updatedPages = await pages.get({ sharedId: '3' });
        expect(updatedPages.length).toBe(2);
        expect(updatedPages).toEqual([
          expect.objectContaining({ entityView: true }),
          expect.objectContaining({ entityView: true }),
        ]);
      });
    });
  });

  describe('delete', () => {
    it('should delete the page in all languages', async () => {
      const sharedId = '2';
      await pages.delete(sharedId);
      const result = await pages.get({ sharedId });
      expect(result.length).toBe(0);
    });
    it('should not allow deleting pages used as entity view', async () => {
      const sharedId = '1';
      try {
        await pages.delete(sharedId);
      } catch (err) {
        expect(err.message).toContain('This page is in use by the following templates:');
      }
    });
  });

  describe('addLanguage()', () => {
    it('should duplicate all the pages from the default language to the new one', async () => {
      await pages.addLanguage('ab');
      const newPages = await pages.get({ language: 'ab' });
      expect(newPages.length).toBe(3);
    });

    it('should not duplicate the pages if the language already exists', async () => {
      const oldCount = await pages.get({ language: 'en' });
      await pages.addLanguage('en');
      const newCount = await pages.get({ language: 'en' });
      expect(newCount.length).toBe(oldCount.length);
    });
  });

  describe('getById', () => {
    it('should throws 404 error on unexistent id', async () => {
      expect.assertions(1);
      try {
        await pages.getById('unexistent_id');
      } catch (error) {
        expect(error.code).toBe(404);
      }
    });
  });
});
