import { catchErrors } from 'api/utils/jasmineHelpers';
import db from 'api/utils/testing_db';
import translations from 'api/i18n/translations';

import fixtures from './fixtures.js';
import instrumentRoutes from '../../utils/instrumentRoutes';
import thesauris from '../thesauris';
import thesaurisRoute from '../routes.js';

describe('thesauris routes', () => {
  let routes;

  beforeEach((done) => {
    routes = instrumentRoutes(thesaurisRoute);
    db.clearAllAndLoad(fixtures).then(done).catch(catchErrors(done));
  });

  afterAll((done) => {
    db.disconnect().then(done);
  });

  describe('GET', () => {
    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/thesauris')).toMatchSnapshot();
    });

    it('should return all thesauris by default, passing user', (done) => {
      spyOn(thesauris, 'get').and.returnValue(Promise.resolve('response'));
      routes.get('/api/thesauris', { language: 'es', user: 'user' })
      .then((response) => {
        let undefinedVar;
        expect(thesauris.get).toHaveBeenCalledWith(undefinedVar, 'es', 'user');
        expect(response).toEqual({ rows: 'response' });
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when passing id', () => {
      it('should get passing id', (done) => {
        spyOn(thesauris, 'get').and.returnValue(Promise.resolve('response'));
        const req = { query: { _id: 'id' } };

        routes.get('/api/thesauris', req)
        .then(() => {
          let undefinedVar;
          expect(thesauris.get).toHaveBeenCalledWith('id', undefinedVar, undefinedVar);
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('dictionaries', () => {
      it('should have a validation schema', () => {
        expect(routes.get.validation('/api/dictionaries')).toMatchSnapshot();
      });

      it('should return all dictionaries by default', (done) => {
        spyOn(thesauris, 'dictionaries').and.returnValue(Promise.resolve('response'));
        routes.get('/api/dictionaries')
        .then((response) => {
          expect(thesauris.dictionaries).toHaveBeenCalled();
          expect(response).toEqual({ rows: 'response' });
          done();
        })
        .catch(catchErrors(done));
      });
      describe('when passing id', () => {
        it('should get matching id', (done) => {
          spyOn(thesauris, 'dictionaries').and.returnValue(Promise.resolve('response'));
          routes.get('/api/dictionaries', { query: { _id: 'id' } })
          .then((response) => {
            expect(thesauris.dictionaries).toHaveBeenCalledWith({ _id: 'id' });
            expect(response).toEqual({ rows: 'response' });
            done();
          })
          .catch(catchErrors(done));
        });
      });
    });
  });

  describe('DELETE', () => {
    it('should have a validation schema', () => {
      expect(routes.delete.validation('/api/thesauris')).toMatchSnapshot();
    });

    it('should delete a thesauri', (done) => {
      spyOn(thesauris, 'delete').and.returnValue(Promise.resolve());
      const req = { query: { _id: 'abc', _rev: '123' } };
      return routes.delete('/api/thesauris', req)
      .then(() => {
        expect(thesauris.delete).toHaveBeenCalledWith('abc', '123');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('POST', () => {
    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/thesauris')).toMatchSnapshot();
    });

    it('should create a thesauri', (done) => {
      spyOn(translations, 'addContext').and.returnValue(Promise.resolve());
      const req = { body: { name: 'Batman wish list', values: [{ id: '1', label: 'Joker BFF' }] } };
      routes.post('/api/thesauris', req)
      .then((response) => {
        expect(response.values[0].id).toEqual('1');
        expect(response.values[0].label).toEqual('Joker BFF');
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when file is uploaded', () => {
      let file;
      let req;
      let args;
      beforeEach(() => {
        args = {
          name: 'Imported',
          values: [{ label: 'one' }]
        };
        file = {
          fieldname: 'file',
          originalname: 'import_thesauri.csv',
          encoding: 'utf8',
          mimetype: 'text/csv',
          destination: `${__dirname}/uploads/`,
          filename: 'import_thesauri.csv',
          path: `${__dirname}/uploads/import_thesauri.csv`,
          size: 112
        };
        req = {
          language: 'es',
          user: 'admin',
          headers: {},
          body: { thesauri: JSON.stringify(args) },
          files: [file]
        };
      });
      it('should import data into the thesauri', async () => {
        jest.spyOn(thesauris, 'save');
        const response = await routes.post('/api/thesauris', req);
        const thes = await thesauris.getById(response._id);
        expect(thes.values.length).toBe(3);
        expect(thes.values.some(v => v.label === 'one')).toBe(true);
        expect(thes.values.some(v => v.label === 'Value 1')).toBe(true);
        expect(thes.values.some(v => v.label === 'Value 2')).toBe(true);
        expect(thesauris.save).toHaveBeenCalledWith(args);
      });
    });
  });
});
