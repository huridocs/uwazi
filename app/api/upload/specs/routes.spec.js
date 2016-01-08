import upload_routes from '../routes.js'
import database from '../../utils/database.js'
import fixtures from './fixtures.js'
import fetch from 'isomorphic-fetch'
import {db_url} from '../../config/database.js'
import request from '../../../shared/JSONRequest'
import instrumentRoutes from '../../utils/instrumentRoutes'

describe('upload routes', () => {

  let app;
  let routes;
  let formData;
  let req;
  let file;

  beforeEach((done) => {
    routes = instrumentRoutes(upload_routes, 1);
    app = jasmine.createSpyObj('app', ['post']);
    file = {fieldname: 'file',
            originalname: 'gadgets-01.pdf',
            encoding: '7bit',
            mimetype: 'application/octet-stream',
            destination: 'uploads/',
            filename: 'f2082bf51b6ef839690485d7153e847a',
            path: 'uploads/f2082bf51b6ef839690485d7153e847a',
            size: 171411271}
    req = {headers: {}, body: {document: '8202c463d6158af8065022d9b5014ccb'}, files: [file]};

    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
  });

  describe('POST', () => {
    it('should update the document with the file path', (done) => {
      routes.post('/api/upload', req)
      .then((response) => {
        expect(response).toEqual(file);
        return request.get(db_url+'/8202c463d6158af8065022d9b5014ccb');
      })
      .then((doc) => {
        expect(doc.json.file).toEqual(file);
        done()
      })
      .catch(done.fail);

    });
  });
});
