import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { catchErrors } from 'api/utils/jasmineHelpers';
import db from 'api/utils/testing_db';
import documents from 'api/documents';
import entities from 'api/entities';
import entitiesModel from 'api/entities/entitiesModel';
import relationships from 'api/relationships';
import settingsModel from 'api/settings/settingsModel';
import search from 'api/search/search';
import request from 'supertest';
import express from 'express';

import fixtures, { entityId, entityEnId, templateId } from './fixtures.js';
import instrumentRoutes from '../../utils/instrumentRoutes';
import uploadRoutes from '../routes.js';
import errorLog from '../../log/errorLog';
import uploads from '../uploads.js';
import paths from '../../config/paths';

const writeFile = promisify(fs.writeFile);
const fileExists = promisify(fs.stat);

describe('upload routes', () => {
  let routes;
  let req;
  let file;
  let iosocket;
  const sharedId = 'sharedId1';

  const onSocketRespond = (method, url, reqObject, eventName = 'documentProcessed') => {
    const promise = new Promise(resolve => {
      iosocket.emit.and.callFake(event => {
        if (event === eventName) {
          resolve();
        }
      });
    });
    return Promise.all([promise, routes[method](url, reqObject)]);
  };

  const deleteAllFiles = cb => {
    const directory = `${__dirname}/uploads/`;
    const dontDeleteFiles = [
      'import.zip',
      'eng.pdf',
      'spn.pdf',
      'importcsv.csv',
      'f2082bf51b6ef839690485d7153e847a.pdf',
    ];
    fs.readdir(directory, (err, files) => {
      if (err) throw err;

      files.forEach(fileName => {
        if (dontDeleteFiles.includes(fileName)) {
          return;
        }
        fs.unlink(path.join(directory, fileName), error => {
          if (error) throw error;
        });
      });
      cb();
    });
  };

  const checkThumbnails = () => {
    const thumbnail1URI = `${__dirname}/uploads/${entityId}.jpg`;
    const thumbnail2URI = `${__dirname}/uploads/${entityEnId}.jpg`;
    return new Promise((resolve, reject) => {
      fs.stat(path.resolve(thumbnail1URI), err1 => {
        if (err1) {
          reject(new Error(`Missing thumbnail: ${thumbnail1URI}`));
        }
        fs.stat(path.resolve(thumbnail2URI), err2 => {
          if (err2) {
            reject(new Error(`Missing thumbnail: ${thumbnail2URI}`));
          }
          resolve();
        });
      });
    });
  };

  beforeEach(done => {
    deleteAllFiles(() => {
      spyOn(search, 'delete').and.returnValue(Promise.resolve());
      spyOn(search, 'indexEntities').and.returnValue(Promise.resolve());
      iosocket = jasmine.createSpyObj('socket', ['emit']);
      routes = instrumentRoutes(uploadRoutes);
      file = {
        fieldname: 'file',
        originalname: 'gadgets-01.pdf',
        encoding: '7bit',
        mimetype: 'application/octet-stream',
        destination: `${__dirname}/uploads/`,
        filename: 'f2082bf51b6ef839690485d7153e847a.pdf',
        path: `${__dirname}/uploads/f2082bf51b6ef839690485d7153e847a.pdf`,
        size: 171411271,
      };
      req = {
        language: 'es',
        user: 'admin',
        headers: {},
        body: { document: 'sharedId1' },
        files: [file],
        io: {},
        getCurrentSessionSockets: () => ({ sockets: [iosocket], emit: iosocket.emit }),
      };

      db.clearAllAndLoad(fixtures)
        .then(done)
        .catch(catchErrors(done));
      spyOn(errorLog, 'error'); //just to avoid annoying console output
    });
  });

  describe('POST/upload', () => {
    it('should process the document after upload', async () => {
      spyOn(Date, 'now').and.returnValue(1000);
      await onSocketRespond('post', '/api/upload', req);
      const [docES, docEN] = await Promise.all([
        documents.get({ sharedId: 'sharedId1', language: 'es' }, '+fullText'),
        documents.get({ sharedId: 'sharedId1', language: 'en' }, '+fullText'),
      ]);
      expect(iosocket.emit).toHaveBeenCalledWith('conversionStart', 'sharedId1');
      expect(iosocket.emit).toHaveBeenCalledWith('documentProcessed', 'sharedId1');
      expect(docEN[0].processed).toBe(true);
      expect(docEN[0].fullText[1]).toMatch(/Test\[\[1\]\] file/);
      expect(docEN[0].totalPages).toBe(1);
      expect(docEN[0].language).toBe('en');
      expect(docEN[0].file.filename).toBe(file.filename);
      expect(docEN[0].file.timestamp).toBe(1000);

      expect(docES[0].processed).toBe(true);
      expect(docES[0].fullText[1]).toMatch(/Test\[\[1\]\] file/);
      expect(docES[0].totalPages).toBe(1);
      expect(docES[0].language).toBe('es');
      expect(docES[0].file.filename).toBe(file.filename);
      expect(docES[0].file.timestamp).toBe(1000);

      await checkThumbnails();
    });

    describe('Language detection', () => {
      it('should detect English documents and store the result', async () => {
        file.filename = 'eng.pdf';
        file.path = `${__dirname}/uploads/eng.pdf`;

        await onSocketRespond('post', '/api/upload', req);

        const [docES, docEN] = await Promise.all([
          documents.get({ sharedId: 'sharedId1', language: 'es' }, '+fullText'),
          documents.get({ sharedId: 'sharedId1', language: 'en' }, '+fullText'),
        ]);

        expect(docEN[0].file.language).toBe('eng');
        expect(docES[0].file.language).toBe('eng');
      });

      it('should detect Spanish documents and store the result', async () => {
        file.filename = 'spn.pdf';
        file.path = `${__dirname}/uploads/spn.pdf`;

        await onSocketRespond('post', '/api/upload', req);

        const [docES, docEN] = await Promise.all([
          documents.get({ sharedId: 'sharedId1', language: 'es' }, '+fullText'),
          documents.get({ sharedId: 'sharedId1', language: 'en' }, '+fullText'),
        ]);
        expect(docEN[0].file.language).toBe('spa');
        expect(docEN[0].file.originalname).toBeDefined();
        expect(docES[0].file.language).toBe('spa');
      });
    });

    describe('when conversion fails', () => {
      it('should set document processed to false and emit a socket conversionFailed event with the id of the document', done => {
        iosocket.emit.and.callFake(eventName => {
          if (eventName === 'conversionFailed') {
            setTimeout(() => {
              entities.getAllLanguages('sharedId1').then(docs => {
                expect(docs[0].processed).toBe(false);
                expect(docs[1].processed).toBe(false);
                done();
              });
            }, 500);
          }
        });

        req.files = ['invalid_file'];
        routes.post('/api/upload', req).catch(done.fail);
      });
    });

    describe('when upload finishes', () => {
      it('should update the document with the file path and uploaded flag to true', done => {
        iosocket.emit.and.callFake(eventName => {
          if (eventName === 'documentProcessed') {
            documents.getById('sharedId1', 'es').then(modifiedDoc => {
              expect(modifiedDoc.file.originalname).toEqual(file.originalname);
              expect(modifiedDoc.file.filename).toEqual(file.filename);
              expect(modifiedDoc.uploaded).toEqual(true);
              done();
            });
          }
        });
        routes
          .post('/api/upload', req)
          .then(response => {
            expect(response).toEqual(file);
          })
          .catch(done.fail);
      });
    });
  });

  describe('POST/reupload', () => {
    beforeEach(() => {
      spyOn(relationships, 'deleteTextReferences').and.returnValue(Promise.resolve());
    });

    it('should reupload a document', done => {
      iosocket.emit.and.callFake(eventName => {
        if (eventName === 'documentProcessed') {
          expect(relationships.deleteTextReferences).toHaveBeenCalledWith(sharedId, 'es');
          documents
            .getById(sharedId, 'es')
            .then(modifiedDoc => {
              expect(modifiedDoc.toc.length).toBe(0);
              done();
            })
            .catch(done.fail);
        }
      });
      req.body.document = sharedId;

      routes
        .post('/api/reupload', req)
        .then(response => {
          expect(response).toEqual(file);
        })
        .catch(done.fail);
    });

    it('should not remove old document when assigned to other entities', async () => {
      paths.uploadedDocuments = `${__dirname}/uploads/`;
      req.body.document = sharedId;
      await writeFile(`${__dirname}/uploads/test`, 'data');
      await Promise.all([
        entitiesModel.save({ title: 'title', _id: entityId, file: { filename: 'test' } }),
        entitiesModel.save({ title: 'title', file: { filename: 'test' } }),
      ]);
      await onSocketRespond('post', '/api/reupload', req);
      await fileExists(path.resolve(`${__dirname}/uploads/test`));
    });

    it('should remove old document on reupload', async () => {
      paths.uploadedDocuments = `${__dirname}/uploads/`;
      req.body.document = sharedId;
      await writeFile(`${__dirname}/uploads/test`, 'data');

      await entitiesModel.save({ _id: entityId, file: { filename: 'test' } });
      await onSocketRespond('post', '/api/reupload', req);

      try {
        await fileExists(path.resolve(`${__dirname}/uploads/test`));
        fail('file should be deleted on reupload');
      } catch (e) {} //eslint-disable-line
    });

    it('should upload too all entities when none has file', async () => {
      spyOn(Date, 'now').and.returnValue(1100);
      paths.uploadedDocuments = `${__dirname}/uploads/`;
      req.body.document = sharedId;
      await writeFile(`${__dirname}/uploads/test`, 'data');
      await entitiesModel.save({ _id: entityId, file: null });
      await onSocketRespond('post', '/api/reupload', req);

      const _entities = await entities.get({ sharedId });
      const _file = {
        filename: 'f2082bf51b6ef839690485d7153e847a.pdf',
        language: 'other',
        mimetype: 'application/octet-stream',
        originalname: 'gadgets-01.pdf',
        size: 171411271,
        timestamp: 1100,
      };
      expect(_entities[0].file).toEqual(jasmine.objectContaining(_file));
      expect(_entities[1].file).toEqual(jasmine.objectContaining(_file));
    });
  });

  describe('POST/customisation/upload', () => {
    it('should save the upload and return it', async () => {
      const result = await routes.post('/api/customisation/upload', req);
      delete result._id;
      delete result.creationDate;
      expect(result).toMatchSnapshot();
    });
  });

  describe('GET/customisation/upload', () => {
    it('should return all uploads', async () => {
      const result = await routes.get('/api/customisation/upload', {});
      expect(result.map(r => r.originalname)).toMatchSnapshot();
    });
  });

  describe('DELETE/customisation/upload', () => {
    it('should have a validation schema', () => {
      expect(routes.delete.validation('/api/customisation/upload')).toMatchSnapshot();
    });

    it('should delete upload and return the response', async () => {
      spyOn(uploads, 'delete').and.returnValue(Promise.resolve('upload_deleted'));
      const result = await routes.delete('/api/customisation/upload', {
        query: { _id: 'upload_id' },
      });
      expect(result).toBe('upload_deleted');
      expect(uploads.delete).toHaveBeenCalledWith('upload_id');
    });
  });

  describe('POST/import', () => {
    beforeEach(() => {
      file = {
        fieldname: 'file',
        originalname: 'importcsv.csv',
        encoding: '7bit',
        mimetype: 'application/octet-stream',
        destination: `${__dirname}/uploads/`,
        filename: 'importcsv.csv',
        path: `${__dirname}/uploads/importcsv.csv`,
        size: 112,
      };
      req = {
        language: 'es',
        user: 'admin',
        headers: {},
        body: { template: templateId },
        files: [file],
        io: {},
        getCurrentSessionSockets: () => ({ sockets: [iosocket], emit: iosocket.emit }),
      };
    });

    it('should import a csv', done => {
      let start = false;
      let progress = 0;
      iosocket.emit.and.callFake((eventName, data) => {
        if (eventName === 'IMPORT_CSV_PROGRESS') {
          progress = data;
        }
        if (eventName === 'IMPORT_CSV_START') {
          start = true;
        }
        if (eventName === 'IMPORT_CSV_END') {
          expect(start).toBe(true);
          expect(progress).toBe(2);
          entities.get({ template: templateId }).then(entitiesCreated => {
            expect(entitiesCreated.length).toBe(2);
            expect(entitiesCreated[0].title).toBe('imported entity one');
            expect(entitiesCreated[1].title).toBe('imported entity two');
            done();
          });
        }
      });

      routes.post('/api/import', req);
    });

    describe('on error', () => {
      it('should emit the error', done => {
        file.path = `${__dirname}/uploads/import.zip`;
        iosocket.emit.and.callFake((eventName, data) => {
          if (eventName === 'IMPORT_CSV_ERROR') {
            expect(data.code).toBe(500);
            done();
          }
        });
        routes.post('/api/import', req);
      });
    });
  });

  describe('api/public', () => {
    beforeEach(done => {
      deleteAllFiles(() => {
        spyOn(Date, 'now').and.returnValue(1000);
        paths.uploadedDocuments = `${__dirname}/uploads/`;
        const buffer = fs.readFileSync(`${__dirname}/12345.test.pdf`);
        file = {
          fieldname: 'file',
          originalname: 'gadgets-01.pdf',
          encoding: '7bit',
          mimetype: 'application/octet-stream',
          buffer,
        };

        const attachment = {
          fieldname: 'attachment0',
          originalname: 'attachment-01.pdf',
          encoding: '7bit',
          mimetype: 'application/octet-stream',
          buffer,
        };
        req = {
          language: 'es',
          headers: {},
          body: { title: 'public submit', template: templateId.toString() },
          files: [file, attachment],
          io: {},
          getCurrentSessionSockets: () => ({ sockets: [iosocket], emit: iosocket.emit }),
        };
        done();
      });
    });

    it('should create the entity and store the files', async () => {
      await onSocketRespond('post', '/api/public', req);
      const [newEntity] = await entities.get({ title: 'public submit' });
      expect(newEntity.title).toBe('public submit');
      expect(newEntity.file.originalname).toBe('gadgets-01.pdf');
      expect(newEntity.processed).toBe(true);
      expect(newEntity.attachments.length).toBe(1);
      expect(newEntity.attachments[0].originalname).toBe('attachment-01.pdf');
      expect(fs.existsSync(path.resolve(`${__dirname}/uploads/${newEntity.file.filename}`))).toBe(
        true
      );
      expect(
        fs.existsSync(path.resolve(`${__dirname}/uploads/${newEntity.attachments[0].filename}`))
      ).toBe(true);
    });

    it('should not create entity if settings has no allowedPublicTemplates option', async () => {
      const [settingsObject] = await settingsModel.get();
      delete settingsObject.allowedPublicTemplates;
      await settingsModel.db.replaceOne({}, settingsObject);
      try {
        await routes.post('/api/public', req);
        fail('should return error');
      } catch (e) {
        expect(e.message).toMatch(/unauthorized public template/i);
        expect(e.code).toBe(403);
      }
      const res = await entities.get({ title: 'public submit' });
      expect(res.length).toBe(0);
    });

    it('should not create entity if template is not whitelisted in allowedPublicTemplates setting', async () => {
      req.body.template = 'unknownTemplate';
      try {
        await routes.post('/api/public', req);
        fail('should return error');
      } catch (e) {
        expect(e.message).toMatch(/unauthorized public template/i);
        expect(e.code).toBe(403);
      }
      const res = await entities.get({ title: 'public submit' });
      expect(res.length).toBe(0);
    });
  });

  describe('/remotepublic', () => {
    let app;
    let remoteApp;
    beforeEach(() => {
      app = express();
      app.use((_req, _res, next) => {
        _req.session = { remotecookie: 'connect.ssid: 12n32ndi23j4hsj;' }; //eslint-disable-line
        next();
      });
      uploadRoutes(app);
    });

    it('should return the captcha and store its value in session', done => {
      remoteApp = express();
      remoteApp.post('/api/public', (_req, res) => {
        expect(_req.headers.cookie).toBe('connect.ssid: 12n32ndi23j4hsj;');
        res.json('ok');
      });

      const remoteServer = remoteApp.listen(54321, async () => {
        await request(app)
          .post('/api/remotepublic')
          .send({ title: 'Title' })
          .expect(200);
        remoteServer.close();
        done();
      });
    });
  });

  afterAll(done => {
    deleteAllFiles(() => {
      db.disconnect().then(done);
    });
  });
});
