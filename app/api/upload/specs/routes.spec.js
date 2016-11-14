import uploadRoutes from '../routes.js';
import database from '../../utils/database.js';
import fixtures from './fixtures.js';
import {db_url as dbURL} from '../../config/database.js';
import request from '../../../shared/JSONRequest';
import instrumentRoutes from '../../utils/instrumentRoutes';
import documents from '../../documents/documents';
import entities from 'api/entities';
import {catchErrors} from 'api/utils/jasmineHelpers';

describe('upload routes', () => {
  let routes;
  let req;
  let file;
  let iosocket;

  beforeEach((done) => {
    iosocket = jasmine.createSpyObj('socket', ['emit']);
    let io = {getSocket: () => {
      return iosocket;
    }};
    routes = instrumentRoutes(uploadRoutes);
    file = {fieldname: 'file',
            originalname: 'gadgets-01.pdf',
            encoding: '7bit',
            mimetype: 'application/octet-stream',
            destination: __dirname + '/uploads/',
            filename: 'f2082bf51b6ef839690485d7153e847a.pdf',
            path: __dirname + '/uploads/f2082bf51b6ef839690485d7153e847a.pdf',
            size: 171411271};
    req = {language: 'es', user: 'admin', headers: {}, body: {document: 'id'}, files: [file], io};

    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
  });

  describe('POST', () => {
    //temporary test for the conversion, probably this will go on another
    it('should process the document after upload', (done) => {
      routes.post('/api/upload', req)
      .then(() => {
        setTimeout(() => {
          return request.get(`${dbURL}/_design/entities_and_docs/_view/sharedId?key="id"`)
          .then((docs) => {
            expect(iosocket.emit).toHaveBeenCalledWith('conversionStart', 'id');
            expect(iosocket.emit).toHaveBeenCalledWith('documentProcessed', 'id');
            expect(docs.json.rows[0].value.processed).toBe(true);
            expect(docs.json.rows[0].value.fullText).toMatch(/Test file/);
            expect(docs.json.rows[0].value.language).toBe('en');

            expect(docs.json.rows[1].value.processed).toBe(true);
            expect(docs.json.rows[1].value.fullText).toMatch(/Test file/);
            expect(docs.json.rows[1].value.language).toBe('es');
            done();
          })
          .catch(catchErrors(done));
        }, 1000);
      })
      .catch(catchErrors(done));
    });

    describe('when conversion fails', () => {
      it('should set document processed to false and emit a socket conversionFailed event with the id of the document', (done) => {
        iosocket.emit.and.callFake((eventName) => {
          if (eventName === 'conversionFailed') {
            setTimeout(() => {
              entities.getAllLanguages('id')
              .then(docs => {
                expect(docs.rows[0].processed).toBe(false);
                expect(docs.rows[1].processed).toBe(false);
                done();
              });
            }, 100);
          }
        });

        req.files = ['invalid_file'];
        routes.post('/api/upload', req)
        .catch(done.fail);
      });
    });

    describe('when upload finishes', () => {
      it('should update the document with the file path and uploaded flag to true', (done) => {
        routes.post('/api/upload', req)
        .then((response) => {
          expect(response).toEqual(file);
          return request.get(`${dbURL}/8202c463d6158af8065022d9b5014ccb`);
        })
        .then((doc) => {
          expect(doc.json.file).toEqual(file);
          expect(doc.json.uploaded).toEqual(true);
          done();
        })
        .catch(done.fail);
      });
    });
  });
});
