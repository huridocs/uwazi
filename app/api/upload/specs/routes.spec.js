import uploadRoutes from '../routes.js';
import database from '../../utils/database.js';
import fixtures from './fixtures.js';
import {db_url as dbURL} from '../../config/database.js';
import request from '../../../shared/JSONRequest';
import instrumentRoutes from '../../utils/instrumentRoutes';
import documents from '../../documents/documents';

describe('upload routes', () => {
  let app;
  let routes;
  let formData;
  let req;
  let file;

  beforeEach((done) => {
    routes = instrumentRoutes(uploadRoutes, 1);
    app = jasmine.createSpyObj('app', ['post']);
    file = {fieldname: 'file',
            originalname: 'gadgets-01.pdf',
            encoding: '7bit',
            mimetype: 'application/octet-stream',
            destination: __dirname + '/uploads/',
            filename: 'f2082bf51b6ef839690485d7153e847a.pdf',
            path: __dirname + '/uploads/f2082bf51b6ef839690485d7153e847a.pdf',
            size: 171411271};
    req = {headers: {}, body: {document: '8202c463d6158af8065022d9b5014ccb'}, files: [file]};

    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
  });

  describe('POST', () => {
    //temporary test for the conversion, probably this will go on another
    it('should process the document after upload', (done) => {
      routes.post('/api/upload', req)
      .then((response) => {
        setTimeout(() => {
          request.get(dbURL+'/8202c463d6158af8065022d9b5014ccb')
          .then((doc) => {
            expect(doc.json.processed).toBe(true);
            expect(doc.json.fullText).toMatch(/Test file/);
            return documents.getHTML('8202c463d6158af8065022d9b5014ccb');
          })
          .then((conversion) => {
            expect(conversion.fullText).not.toBeDefined();
            expect(conversion.pages.length).toBe(1);
            expect(conversion.css).toMatch(/ff0/);
            done();
          })
          .catch(done.fail);
        }, 500)
      })
      .catch(done.fail);
    });

    it('should update the document with the file path', (done) => {
      routes.post('/api/upload', req)
      .then((response) => {
        expect(response).toEqual(file);
        return request.get(dbURL+'/8202c463d6158af8065022d9b5014ccb');
      })
      .then((doc) => {
        expect(doc.json.file).toEqual(file);
        done()
      })
      .catch(done.fail);
    });


  });
});
