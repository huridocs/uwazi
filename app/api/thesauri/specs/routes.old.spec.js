import translations from '#api/i18n/translations.js';
import '#api/utils/jasmineHelpers';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import instrumentRoutes from '#api/utils/instrumentRoutes.js';
import thesauriRoute from '#api/thesauri/routes.js';
import thesauri from '#api/thesauri/thesauri.js';
import { fixtures } from '#api/thesauri/specs/fixtures.js';

describe('thesauri routes', () => {
  let routes;

  beforeEach(async () => {
    routes = instrumentRoutes(thesauriRoute);
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('GET', () => {
    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/thesauris')).toMatchSnapshot();
    });

    it('should return all thesauri by default, passing user', async () => {
      jest.spyOn(thesauri, 'get').mockImplementation(async () => Promise.resolve('response'));
      const response = await routes.get('/api/thesauris', { language: 'es', user: 'user' });
      let undefinedVar;
      expect(thesauri.get).toHaveBeenCalledWith(undefinedVar, 'es', 'user');
      expect(response).toEqual({ rows: 'response' });
    });

    describe('when passing id', () => {
      it('should get passing id', async () => {
        jest.spyOn(thesauri, 'get').mockImplementation(async () => Promise.resolve('response'));
        const req = { query: { _id: 'id' } };

        await routes.get('/api/thesauris', req);
        let undefinedVar;
        expect(thesauri.get).toHaveBeenCalledWith('id', undefinedVar, undefinedVar);
      });
    });

    describe('dictionaries', () => {
      it('should have a validation schema', () => {
        expect(routes.get.validation('/api/dictionaries')).toMatchSnapshot();
      });

      it('should return all dictionaries by default', async () => {
        jest
          .spyOn(thesauri, 'dictionaries')
          .mockImplementation(async () => Promise.resolve('response'));
        const response = await routes.get('/api/dictionaries');
        expect(thesauri.dictionaries).toHaveBeenCalled();
        expect(response).toEqual({ rows: 'response' });
      });

      describe('when passing id', () => {
        it('should get matching id', async () => {
          jest
            .spyOn(thesauri, 'dictionaries')
            .mockImplementation(async () => Promise.resolve('response'));
          const response = await routes.get('/api/dictionaries', { query: { _id: 'id' } });
          expect(thesauri.dictionaries).toHaveBeenCalledWith({ _id: 'id' });
          expect(response).toEqual({ rows: 'response' });
        });
      });
    });
  });

  describe('DELETE', () => {
    it('should have a validation schema', () => {
      expect(routes.delete.validation('/api/thesauris')).toMatchSnapshot();
    });

    it('should delete a thesauri', async () => {
      jest.spyOn(thesauri, 'delete').mockImplementation(async () => Promise.resolve());
      const req = { query: { _id: 'abc', _rev: '123' } };
      await routes.delete('/api/thesauris', req);
      expect(thesauri.delete).toHaveBeenCalledWith('abc', '123');
    });
  });

  describe('POST', () => {
    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/thesauris')).toMatchSnapshot();
    });

    it('should create a thesauri', async () => {
      jest.spyOn(translations, 'addContext').mockImplementation(async () => Promise.resolve());
      const req = { body: { name: 'Batman wish list', values: [{ id: '1', label: 'Joker BFF' }] } };
      const response = await routes.post('/api/thesauris', req);
      expect(response.values[0].id).toEqual('1');
      expect(response.values[0].label).toEqual('Joker BFF');
    });
  });
});
