import documents from '../routes.js'
import database from '../../utils/database.js'
import fixtures from './fixtures.js'
import request from '../../../shared/JSONRequest.js'
import {db_url} from '../../config/database.js'


describe('documents', () => {

  beforeEach((done) => {
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
  });

  describe('POST', () => {

    it('should listen /api/documents', () => {
      let app = jasmine.createSpyObj('app', ['post']);
      documents(app);
      let args = app.post.calls.mostRecent().args;
      expect(args[0]).toBe('/api/documents');
    });

    it('should create a new document', (done) => {
      let app = jasmine.createSpyObj('app', ['post']);
      documents(app);
      let documentsPost = app.post.calls.mostRecent().args[1];

      let res = {json: function(){}};
      let req = {body:{title: 'Batman begins'}};

      spyOn(res, 'json').and.callFake((response) => {
        request.get(db_url+'/_design/documents/_view/all')
        .then(documents => {

          expect(response.ok).toBe(true);
          expect(response.id).toBeDefined();
          expect(response.rev).toBeDefined();

          expect(documents.json.rows[0].value.title).toBe('Batman begins');
          expect(documents.json.rows[0].value.type).toBe('document');
          done();
        })
        .catch(done.fail);
      });
      documentsPost(req, res);
    });
  });
});
