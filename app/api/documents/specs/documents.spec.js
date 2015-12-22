import documents from '../routes.js'
import database from '../../utils/database.js'
import fixtures from './fixtures.js'
import request from '../../../shared/JSONRequest.js'
import {db_url} from '../../config/database.js'


describe('documents', () => {

  let app, res;

  beforeEach((done) => {
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);

    app = jasmine.createSpyObj('app', ['post', 'get']);
    res = {json: function(){}};
  });

  describe('POST', () => {

    it('should listen /api/documents', () => {
      documents(app);
      let args = app.post.calls.mostRecent().args;
      expect(args[0]).toBe('/api/documents');
    });

    it('should create a new document', (done) => {
      documents(app);
      let documentsPost = app.post.calls.mostRecent().args[1];
      let req = {body:{title: 'Batman begins'}};

      spyOn(res, 'json').and.callFake((response) => {
        request.get(db_url+'/_design/documents/_view/all')
        .then(documents => {

          expect(response.ok).toBe(true);
          expect(response.id).toBeDefined();
          expect(response.rev).toBeDefined();

          expect(documents.json.rows.find(doc => doc.title = 'Batman begins')).toBeDefined();
          done();
        })
        .catch(done.fail);
      });
      documentsPost(req, res);
    });
  });

  describe('GET', () => {
    it('should listen /api/documents', () => {
      documents(app);
      let args = app.get.calls.mostRecent().args;
      expect(args[0]).toBe('/api/documents');
    });

    it('should return a list of documents', (done) => {
      documents(app);
      let documentsGet = app.get.calls.mostRecent().args[1];

      spyOn(res, 'json').and.callFake((response) => {
        expect(response.rows.length).toBe(2);
        done();
      });

      documentsGet({}, res);
    });
  })
});
