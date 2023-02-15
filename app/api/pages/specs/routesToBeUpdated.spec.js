import 'api/utils/jasmineHelpers';
import instrumentRoutes from '../../utils/instrumentRoutes';
import pages from '../pages';
import pagesRoutes from '../routes';

describe('Pages Routes (to be updated)', () => {
  let routes;

  beforeEach(() => {
    routes = instrumentRoutes(pagesRoutes);
  });

  describe('POST', () => {
    let req;
    beforeEach(() => {
      req = {
        body: { title: 'Batman begins' },
        user: { username: 'admin' },
        language: 'lang',
      };
    });

    it('should need authorization', () => {
      jest.spyOn(pages, 'save').mockImplementation(async () => Promise.resolve('pages'));
      expect(routes.post('/api/pages', req)).toNeedAuthorization();
    });

    it('should create a new document with current user', async () => {
      jest.spyOn(pages, 'save').mockImplementation(async () => Promise.resolve('document'));
      const document = await routes.post('/api/pages', req);
      expect(document).toBe('document');
      expect(pages.save).toHaveBeenCalledWith(req.body, req.user, 'lang');
    });
  });

  describe('/api/pages', () => {
    it('should ask pages model for the page in the current locale', async () => {
      const req = {
        query: { sharedId: '123' },
        language: 'es',
      };
      jest.spyOn(pages, 'get').mockImplementation(async () => Promise.resolve('page'));
      const response = await routes.get('/api/pages', req);
      expect(pages.get).toHaveBeenCalledWith({ sharedId: '123', language: 'es' });
      expect(response).toBe('page');
    });
  });

  describe('/api/page', () => {
    it('should ask pages model for the page in the current locale', async () => {
      const req = {
        query: { sharedId: '123' },
        language: 'es',
      };
      jest.spyOn(pages, 'getById').mockImplementation(async () => Promise.resolve('page'));
      const response = await routes.get('/api/page', req);
      expect(pages.getById).toHaveBeenCalledWith('123', 'es');
      expect(response).toBe('page');
    });
  });

  describe('GET', () => {
    describe('/api/pages', () => {
      it('should have a validation schema', () => {
        expect(routes.get.validation('/api/pages')).toMatchSnapshot();
      });
    });
  });

  describe('DELETE', () => {
    beforeEach(() => {
      jest.spyOn(pages, 'delete').mockImplementation(async () => Promise.resolve({ json: 'ok' }));
    });

    it('should have a validation schema', () => {
      expect(routes.delete.validation('/api/pages')).toMatchSnapshot();
    });

    it('should use pages to delete it', async () => {
      const req = { query: { _id: 123, _rev: 456, sharedId: '456' } };
      await routes.delete('/api/pages', req);
      expect(pages.delete).toHaveBeenCalledWith(req.query.sharedId);
    });
  });
});
