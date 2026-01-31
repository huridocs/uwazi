import '#api/utils/jasmineHelpers';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { ObjectId } from 'mongodb';
import instrumentRoutes from '../../utils/instrumentRoutes.js';
import thesauriRoute from '../routes.js';
import thesauri from '../thesauri.js';
import { fixtures } from './fixtures.js';

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
    it('should create a thesauri', async () => {
      const req = {
        body: { name: 'Batman wish list', values: [{ label: 'Joker BFF' }] },
        sockets: { emitToCurrentTenant: jest.fn().mockResolvedValue() },
      };
      const response = await routes.post('/api/thesauris', req);

      expect(response).toEqual({
        _id: expect.any(ObjectId),
        name: 'Batman wish list',
        values: [{ label: 'Joker BFF', id: expect.any(String) }],
      });
    });
  });
});
