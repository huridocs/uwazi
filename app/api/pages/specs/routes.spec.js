import pagesRoutes from '../routes.js';
import database from '../../utils/database.js';
import fixtures from './fixtures.js';
import instrumentRoutes from '../../utils/instrumentRoutes';
import pages from '../pages';
import {catchErrors} from 'api/utils/jasmineHelpers';

describe('Pages Routes', () => {
  let routes;

  beforeEach((done) => {
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
    routes = instrumentRoutes(pagesRoutes);
  });

  describe('POST', () => {
    it('should need authorization', () => {
      expect(routes.post('/api/pages')).toNeedAuthorization();
    });

    it('should create a new document with use user', (done) => {
      let req = {
        body: {title: 'Batman begins'},
        user: {_id: 'c08ef2532f0bd008ac5174b45e033c93', username: 'admin'}
      };

      spyOn(pages, 'save').and.returnValue(new Promise((resolve) => resolve('document')));
      routes.post('/api/pages', req)
      .then((document) => {
        expect(document).toBe('document');
        expect(pages.save).toHaveBeenCalledWith(req.body, req.user);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('/api/pages', () => {
    it('should return a list of pages returned from the list view', (done) => {
      routes.get('/api/pages')
      .then((response) => {
        expect(response.rows.length).toBe(3);
        expect(response.rows[0].title).toEqual('Batman finishes');
        expect(response.rows[0]._id).toEqual('8202c463d6158af8065022d9b50dda18');
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when passing id', () => {
      it('should return matching document', (done) => {
        let req = {query: {_id: '8202c463d6158af8065022d9b50ddccb'}};

        routes.get('/api/pages', req)
        .then((response) => {
          let docs = response.rows;
          expect(docs.length).toBe(1);
          expect(docs[0].title).toBe('Penguin almost done');
          done();
        })
        .catch(catchErrors(done));
      });
    });
  });

  describe('/api/pages/list', () => {
    it('return the list from pages passing the keys', (done) => {
      let req = {
        query: {keys: JSON.stringify(['1', '2'])}
      };

      spyOn(pages, 'list').and.returnValue(new Promise((resolve) => resolve('document')));
      routes.get('/api/pages/list', req)
      .then((document) => {
        expect(document).toBe('document');
        expect(pages.list).toHaveBeenCalledWith(['1', '2']);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('DELETE', () => {
    beforeEach(() => {
      spyOn(pages, 'delete').and.returnValue(Promise.resolve({json: 'ok'}));
    });

    it('should use pages to delete it', (done) => {
      let req = {query: {_id: 123, _rev: 456}};
      return routes.delete('/api/pages', req)
      .then(() => {
        expect(pages.delete).toHaveBeenCalledWith(req.query._id);
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
