import documents_routes from '../routes.js'
import database from '../../utils/database.js'
import fixtures from './fixtures.js'
import request from '../../../shared/JSONRequest.js'
import {db_url} from '../../config/database.js'
import instrumentRoutes from '../../utils/instrumentRoutes'
import elastic from '../elastic'


describe('documents', () => {

  let routes;

  beforeEach((done) => {
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
    routes = instrumentRoutes(documents_routes);
  });

  describe('POST', () => {

    describe('not logged in', () => {
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
      let req = {body:{title: 'Batman begins'}, user: {"_id":"c08ef2532f0bd008ac5174b45e033c93", "username":"admin"}};

      routes.post('/api/documents', req)
      .then((response) => {
        expect(response.id).toBeDefined();
        expect(response.value.title).toBe('Batman begins');
        expect(response.value.user).toEqual({"_id":"c08ef2532f0bd008ac5174b45e033c93", "username":"admin"});
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
          let req = {body:{_id:doc.value._id, _rev: doc.value._rev, test:'test'}, user: {"_id":"c08ef2532f0bd008ac5174b45e033c93", "username":"admin"}};
          return routes.post('/api/documents', req)
        })
        .then((doc) => {
          return routes.get('/api/documents', request)
        })
        .then((response) => {
          expect(response.rows[0].value.test).toBe('test');
          expect(response.rows[0].value.title).toBe('Penguin almost done');
          done();
        })
        .catch(done.fail);

      });
    });
  });

  describe('GET', () => {
    it('should return a list of documents returned from the list view', (done) => {
      routes.get('/api/documents')
      .then((response) => {
        expect(response.rows.length).toBe(2);
        expect(response.rows[0].value).toEqual({title:'Batman finishes', _id: '8202c463d6158af8065022d9b5014a18'});
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
          expect(docs[0].value.title).toBe('Penguin almost done');
          done();
        })
        .catch(done.fail);

      });
    });

    describe('/api/documents/search', () => {
      it('should do a multimatch query to elastic and transform the results to be application format compatible', (done) => {

        spyOn(elastic, 'search').and.returnValue(new Promise((resolve) => {
          resolve({
            "took": 7,
            "timed_out": false,
            "_shards": {
              "total": 5,
              "successful": 5,
              "failed": 0
            },
            "hits": {
              "total": 1,
              "max_score": 0.05050901,
              "hits": [
                {
                  "_index": "uwazi",
                  "_type": "logs",
                  "_id": "id1",
                  "_score": 0.05050901,
                  "_source": {
                    "doc": {
                      "processed": true,
                      "title": "first match"
                    }
                  }
                },
                {
                  "_index": "uwazi",
                  "_type": "logs",
                  "_id": "id2",
                  "_score": 0.05050901,
                  "_source": {
                    "doc": {
                      "processed": true,
                      "title": "second match"
                    }
                  }
                }
              ]
            }
          });
        }));

        let request = {query:{searchTerm:'test'}};
        let elasticQuery = {
          "_source": {
            "include": [ "doc.title", "doc.processed"]
          },
          "from" : 0,
          "size" : 100,
          "query": {
            "multi_match" : {
              "query":      "test",
              "type":       "phrase_prefix",
              "fields":     [ "doc.fullText", "doc.metadata.*", "doc.title" ]
            }
          },
          "filter": {
            "term":  { "doc.published": true }
          }
        }

        routes.get('/api/documents/search', request)
        .then((response) => {
          expect(elastic.search).toHaveBeenCalledWith({index:'uwazi', body:elasticQuery});
          expect(response).toEqual([{_id:'id1', title:'first match', processed: true},{_id:'id2', title:'second match', processed: true}]);
          done();
        })
        .catch(done.fail);

      });

      describe('when searchTerm is blank', () => {

        it('should do a match_all query to elastic', (done) => {

          spyOn(elastic, 'search').and.returnValue(new Promise((resolve) => { resolve({hits:{hits:[]}}); }));

          let request = {query:{searchTerm:''}};

          routes.get('/api/documents/search', request)
          .then((response) => {
            let args = elastic.search.calls.argsFor(0)[0];

            expect(args.index).toBe('uwazi');
            expect(args.body.query).toEqual({match_all:{}});

            done();
          })
          .catch(done.fail);

        });
      });

    });

  })

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
        expect(docs.length).toBe(2);
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
      routes.get('/api/uploads', {user: {"_id": "c08ef2532f0bd008ac5174b45e033c93"}})
      .then((response) => {
        expect(response.rows.length).toBe(1);
        expect(response.rows[0].value).toEqual({title:'Right there', _id: 'd0298a48d1221c5ceb53c4879301507f'});
        done();
      })
      .catch(done.fail);
    });
  });
});
