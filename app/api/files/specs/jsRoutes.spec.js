/*eslint-disable max-lines*/
import fs from 'fs';
import path from 'path';
import { catchErrors } from 'api/utils/jasmineHelpers';
import db from 'api/utils/testing_db';
import entities from 'api/entities';
import { settingsModel } from 'api/settings/settingsModel';
import search from 'api/search/search';
import request from 'supertest';
import express from 'express';

import mailer from 'api/utils/mailer';
import { fixtures, templateId } from './fixtures';
import instrumentRoutes from '../../utils/instrumentRoutes';
import uploadRoutes from '../jsRoutes.js';
import errorLog from '../../log/errorLog';

const mockExport = jest.fn();
jest.mock('api/csv/csvExporter', () =>
  jest.fn().mockImplementation(() => ({ export: mockExport }))
);

// eslint-disable-next-line max-statements
describe('upload routes', () => {
  let routes;
  let req;
  let file;
  let iosocket;

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

  describe('api/public', () => {
    beforeEach(done => {
      deleteAllFiles(() => {
        spyOn(Date, 'now').and.returnValue(1000);
        spyOn(mailer, 'send');
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
          body: {
            entity: { title: 'public submit', template: templateId.toString() },
          },
          files: [file, attachment],
          io: {},

          getCurrentSessionSockets: () => ({ sockets: [iosocket], emit: iosocket.emit }),
        };
        done();
      });
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
      req.body.entity = JSON.stringify({
        title: 'public submit',
        template: 'unauthorized_template_id',
      });
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
