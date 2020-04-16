/*eslint-disable max-lines*/
import fs from 'fs';
import path from 'path';
import settings from 'api/settings';
import { catchErrors } from 'api/utils/jasmineHelpers';
import db from 'api/utils/testing_db';
import entities from 'api/entities';
import settingsModel from 'api/settings/settingsModel';
import search from 'api/search/search';
import request from 'supertest';
import express from 'express';
import { files } from 'api/files/files';

import * as filesystem from 'api/files/filesystem';
import { fixtures, templateId } from './fixtures';
import instrumentRoutes from '../../utils/instrumentRoutes';
import uploadRoutes from '../jsRoutes.js';
import errorLog from '../../log/errorLog';
import paths from '../../config/paths';

const mockExport = jest.fn();
jest.mock('api/csv/csvExporter', () => {
  return jest.fn().mockImplementation(() => {
    return { export: mockExport };
  });
});

describe('upload routes', () => {
  let routes;
  let req;
  let file;
  let iosocket;

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
    fs.readdir(directory, (err, filesList) => {
      if (err) throw err;

      filesList.forEach(fileName => {
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
      expect(uploadedFile.status).toBe('ready');
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

describe('export routes', () => {
  let req;
  let routes;

  const setSpys = filename => {
    spyOn(settings, 'get').and.returnValue({ site_name: 'uwazi' });
    spyOn(filesystem, 'temporalFilesPath').and.returnValue(filename);
    spyOn(Date.prototype, 'toISOString').and.returnValue('ISOString');
  };

  beforeAll(() => {
    routes = instrumentRoutes(uploadRoutes);
  });

  describe('/api/export', () => {
    beforeEach(() => {
      req = {
        language: 'es',
        user: 'user',
        query: {
          filters: '',
          types: '',
          fields: '',
          aggregations: '',
          select: '',
          unpublished: '',
          includeUnpublished: '',
        },
      };
    });

    it('should process the search and download a file', async () => {
      mockExport.mockImplementation(() => Promise.resolve());
      const searchMock = spyOn(search, 'search').and.returnValue({});
      const uniqueName = `${Date.now().toString()}-testExport.csv`;
      setSpys(uniqueName);

      const res = await routes.get('/api/export', req);
      fs.unlinkSync(uniqueName);

      const regex = new RegExp(`^download:${uniqueName},uwazi-ISOString.csv`);
      expect(res).toMatch(regex);
      expect(searchMock).toHaveBeenCalledWith(req.query, 'es', 'user');
    });

    it('should return an error on fail', async done => {
      const error = new Error();
      mockExport.mockImplementation(() => Promise.reject(error));
      spyOn(search, 'search').and.returnValue({});
      const uniqueName = `${Date.now().toString()}-testExport.csv`;
      setSpys(uniqueName);
      const nextMock = jest.fn();

      routes.get('/api/export', req, {}, nextMock).catch(_e => {
        expect(nextMock).toHaveBeenCalledWith(error);
        expect(fs.existsSync(uniqueName)).toBe(false);
        done();
      });
    });

    it('should log an error if could not delete the temp file', async done => {
      const error = new Error();
      mockExport.mockImplementation(() => Promise.reject(error));
      spyOn(search, 'search').and.returnValue({});
      const uniqueName = `${Date.now().toString()}-testExport.csv`;
      setSpys(uniqueName);
      const nextMock = jest.fn();
      jest.spyOn(fs, 'unlink').mockImplementation((filePath, cb) => {
        cb(filePath);
      });
      jest.spyOn(errorLog, 'error');

      routes.get('/api/export', req, {}, nextMock).catch(_e => {
        expect(errorLog.error.mock.calls[0][0]).toMatch(new RegExp(`${uniqueName}$`));
        fs.unlinkSync(uniqueName);
        done();
      });
    });
  });
});
