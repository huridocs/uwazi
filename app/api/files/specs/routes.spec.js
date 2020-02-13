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
import { files } from 'api/files/files';

import { fixtures, entityId, entityEnId, templateId } from './fixtures';
import instrumentRoutes from '../../utils/instrumentRoutes';
import uploadRoutes from '../deprecatedRoutes.js';
import errorLog from '../../log/errorLog';
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
      'invalid_document.txt',
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

  // describe('POST/reupload', () => {
  //   beforeEach(() => {
  //     spyOn(relationships, 'deleteTextReferences').and.returnValue(Promise.resolve());
  //   });

  //   it('should reupload a document', (done) => {
  //     iosocket.emit.and.callFake((eventName) => {
  //       if (eventName === 'documentProcessed') {
  //         expect(relationships.deleteTextReferences).toHaveBeenCalledWith(sharedId, 'es');
  //         documents.getById(sharedId, 'es')
  //         .then((modifiedDoc) => {
  //           expect(modifiedDoc.toc.length).toBe(0);
  //           done();
  //         })
  //         .catch(done.fail);
  //       }
  //     });
  //     req.body.document = sharedId;

  //     routes.post('/api/reupload', req)
  //     .then((response) => {
  //       expect(response).toEqual(file);
  //     })
  //     .catch(done.fail);
  //   });

  //   it('should not remove old document when assigned to other entities', async () => {
  //     paths.uploadedDocuments = `${__dirname}/uploads/`;
  //     req.body.document = sharedId;
  //     await writeFile(`${__dirname}/uploads/test`, 'data');
  //     await Promise.all([
  //       entitiesModel.save({ title: 'title', _id: entityId, file: { filename: 'test' } }),
  //       entitiesModel.save({ title: 'title', file: { filename: 'test' } }),
  //     ]);
  //     await onSocketRespond('post', '/api/reupload', req);
  //     await fileExists(path.resolve(`${__dirname}/uploads/test`));
  //   });

  //   it('should remove old document on reupload', async () => {
  //     paths.uploadedDocuments = `${__dirname}/uploads/`;
  //     req.body.document = sharedId;
  //     await writeFile(`${__dirname}/uploads/test`, 'data');

  //     await entitiesModel.save({ _id: entityId, file: { filename: 'test' } });
  //     await onSocketRespond('post', '/api/reupload', req);

  //     try {
  //       await fileExists(path.resolve(`${__dirname}/uploads/test`));
  //       fail('file should be deleted on reupload');
  //     } catch (e) {} //eslint-disable-line
  //   });

  //   it('should upload too all entities when none has file', async () => {
  //     spyOn(Date, 'now').and.returnValue(1100);
  //     paths.uploadedDocuments = `${__dirname}/uploads/`;
  //     req.body.document = sharedId;
  //     await writeFile(`${__dirname}/uploads/test`, 'data');
  //     await entitiesModel.save({ _id: entityId, file: null });
  //     await onSocketRespond('post', '/api/reupload', req);

  //     const _entities = await entities.get({ sharedId });
  //     const _file = {
  //       filename: 'f2082bf51b6ef839690485d7153e847a.pdf',
  //       language: 'other',
  //       mimetype: 'application/octet-stream',
  //       originalname: 'gadgets-01.pdf',
  //       size: 171411271,
  //       timestamp: 1100
  //     };
  //     expect(_entities[0].file).toEqual(jasmine.objectContaining(_file));
  //     expect(_entities[1].file).toEqual(jasmine.objectContaining(_file));
  //   });
  // });

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
      expect(newEntity.attachments.length).toBe(1);
      expect(newEntity.attachments[0].originalname).toBe('attachment-01.pdf');

      const [uploadedFile] = await files.get({ entity: newEntity.sharedId });
      expect(uploadedFile.originalname).toBe('gadgets-01.pdf');
      expect(uploadedFile.processed).toBe(true);
      expect(fs.existsSync(path.resolve(`${__dirname}/uploads/${file.filename}`))).toBe(true);
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
