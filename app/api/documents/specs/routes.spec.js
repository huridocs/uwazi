import documentRoutes from '../routes.js';
import database from '../../utils/database.js';
import fixtures from './fixtures.js';
import request from '../../../shared/JSONRequest.js';
import {db_url} from '../../config/database.js';
import instrumentRoutes from '../../utils/instrumentRoutes';
import elastic from '../elastic';
import documents from '../documents';

describe('documents', () => {
  let routes;

  beforeEach((done) => {
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
    routes = instrumentRoutes(documentRoutes);
  });

  describe('POST', () => {

    describe('when not logged in', () => {
      it('should return unauthorized error', (done) => {
        let req = {body:{title: 'Batman starts'}};
        routes.post('/api/documents', req)
        .then((response) => {
          expect(response.status).toBe(401);
          done()
        })
        .catch(done.fail);
      });
    });

    it('should create a new document with use user', (done) => {
      let req = {
        body:{
          title: 'Batman begins'
        },
        user: {"_id":"c08ef2532f0bd008ac5174b45e033c93", "username":"admin"}
      };

      routes.post('/api/documents', req)
      .then((response) => {
        return routes.get('/api/documents', {query:{_id:response.id}});
      })
      .then((response) => {
        expect(response.rows[0].title).toBe('Batman begins');
        expect(response.rows[0].user).toEqual({"_id":"c08ef2532f0bd008ac5174b45e033c93", "username":"admin"});
        done();
      })
      .catch(done.fail);
    });

    describe("when updating a document", () => {
      it("should be able to do partial document updates", (done) => {

        let request = {query:{_id:'8202c463d6158af8065022d9b5014ccb'}};
        routes.get('/api/documents', request)
        .then((response) => {
          let doc = response.rows[0];
          let req = {body:{_id:doc._id, _rev: doc._rev, test:'test'}, user: {"_id":"c08ef2532f0bd008ac5174b45e033c93", "username":"admin"}};
          return routes.post('/api/documents', req)
        })
        .then((doc) => {
          expect(doc.id).toBe('8202c463d6158af8065022d9b5014ccb');
          return routes.get('/api/documents', request)
        })
        .then((response) => {
          expect(response.rows[0].test).toBe('test');
          expect(response.rows[0].title).toBe('Penguin almost done');
          done();
        })
        .catch(done.fail);

      });
    });
  });

  describe('/api/documents', () => {
    it('should return a list of documents returned from the list view', (done) => {
      routes.get('/api/documents')
      .then((response) => {
        expect(response.rows.length).toBe(2);
        expect(response.rows[0]).toEqual({title:'Batman finishes', _id: '8202c463d6158af8065022d9b5014a18'});
        done();
      })
      .catch(console.log)
    });

    describe("when passing id", () => {
      it('should return matching document', (done) => {
        let request = {query:{_id:'8202c463d6158af8065022d9b5014ccb'}};

        routes.get('/api/documents', request)
        .then((response) => {
          let docs = response.rows;
          expect(docs.length).toBe(1);
          expect(docs[0].title).toBe('Penguin almost done');
          done();
        })
        .catch(done.fail);

      });
    });
  })

  describe('/api/documents/newest', () => {
    it('should return a list of documents returned from the list view', (done) => {
      routes.get('/api/documents/newest')
      .then((response) => {
        expect(response.rows.length).toBe(2);
        expect(response.rows[0]).toEqual({title:'Batman finishes', _id: '8202c463d6158af8065022d9b5014a18'});
        done();
      })
      .catch(console.log)
    });
  })

  describe('/api/documents/relevant', () => {
    it('should return a list of documents returned from the list view', (done) => {
      routes.get('/api/documents/relevant')
      .then((response) => {
        expect(response.rows.length).toBe(2);
        expect(response.rows[0]).toEqual({title:'Batman finishes', _id: '8202c463d6158af8065022d9b5014a18'});
        done();
      })
      .catch(console.log);
    });
  });

  describe('/api/documents/html', () => {
    it('should get the thml conversion', (done) => {
      spyOn(documents, 'getHTML').and.returnValue(new Promise((resolve) => resolve('html')));
      let req = {query: {_id: 'test'}};

      routes.get('/api/documents/html', req)
      .then((response) => {
        expect(response).toEqual('html');
        expect(documents.getHTML).toHaveBeenCalledWith('test');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('/api/documents/count_by_template', () => {
    it('should return count of documents using a specific template', (done) => {
      spyOn(documents, 'countByTemplate').and.returnValue(new Promise((resolve) => resolve(2)));
      let req = {query: {templateId: 'templateId'}};

      routes.get('/api/documents/count_by_template', req)
      .then((response) => {
        expect(documents.countByTemplate).toHaveBeenCalledWith('templateId');
        expect(response).toEqual(2);
        done();
      })
      .catch(done.fail);
    });
  });

  describe('/api/documents/search', () => {
    it('should search documents and return the results', (done) => {
      spyOn(documents, 'search').and.returnValue(new Promise((resolve) => resolve('results')));
      let req = {query: {searchTerm: 'test', property: 'property'}};

      routes.get('/api/documents/search', req)
      .then((response) => {
        expect(documents.search).toHaveBeenCalledWith({searchTerm: 'test', property: 'property'});
        expect(response).toEqual('results');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('/api/documents/match_title', () => {
    it('should search documents by title and return the results', (done) => {
      spyOn(documents, 'matchTitle').and.returnValue(new Promise((resolve) => resolve('results')));
      let req = {query: {searchTerm: 'test'}};

      routes.get('/api/documents/match_title', req)
      .then((response) => {
        expect(response).toEqual('results');
        done();
      })
      .catch(done.fail);
    });
  });


  describe("DELETE", () => {

    it("should delete a document", (done) => {

      request.get(db_url+'/8202c463d6158af8065022d9b5014ccb')
      .then(template => {
        let request = {body:{"_id":template.json._id, "_rev":template.json._rev}};
        return routes.delete('/api/documents', request);
      })
      .then((response) => {
        expect(response.ok).toBe(true);
        return request.get(db_url+'/_design/documents/_view/all');
      })
      .then((response) => {
        let docs = response.json.rows;
        expect(docs.length).toBe(6);
        expect(docs[0].value.title).toBe('Batman finishes');
        done();
      })
      .catch(done.fail);

    });

    describe("when there is a db error", () => {
      it("return the error in the response", (done) => {
        let request = {body:{"_id":'8202c463d6158af8065022d9b5014ccb', "_rev":'bad_rev'}};

        routes.delete('/api/documents', request)
        .then((response) => {
          expect(response.error.error).toBe('bad_request');
          done();
        })
        .catch(done.fail);

      });
    });

  });

  describe('/uploads', () => {
    it('should return a list of documents not published of the current user', (done) => {
      routes.get('/api/uploads', {user: {"_id": "c08ef2532f0bd008ac5174b45e033c94"}})
      .then((response) => {
        expect(response.rows.length).toBe(1);
        expect(response.rows[0].value).toEqual({title:'unpublished', _id: 'd0298a48d1221c5ceb53c4879301508f'});
        done();
      })
      .catch(done.fail);
    });
  });
});
