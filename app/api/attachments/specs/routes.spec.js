import fs from 'fs';
import {db_url as dbUrl} from '../../config/database';
import database from '../../utils/database';
import fixtures from './fixtures';
import instrumentRoutes from '../../utils/instrumentRoutes';
import {catchErrors} from 'api/utils/jasmineHelpers';
import search from 'api/search/search';
import paths, {attachmentsPath} from '../../config/paths';
import request from '../../../shared/JSONRequest';

import attachmentsRoutes from '../routes';

describe('Attachments Routes', () => {
  let routes;
  let originalAttachmentsPath;

  beforeEach((done) => {
    spyOn(search, 'index').and.returnValue(Promise.resolve);
    spyOn(search, 'delete').and.returnValue(Promise.resolve);
    originalAttachmentsPath = paths.attachmentsPath;
    paths.attachmentsPath = __dirname + '/uploads/';

    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
    routes = instrumentRoutes(attachmentsRoutes);
  });

  afterEach(() => {
    paths.attachmentsPath = originalAttachmentsPath;
  });

  describe('/download', () => {
    it('should download the document with the titile as file name (replacing extension with file ext)', (done) => {
      let req = {query: {_id: '8abcc463d6158af8065022d9b5014a19', file: 'match.doc'}};
      let res = {};

      routes.get('/api/attachments/download', req, res)
      .then(() => {
        expect(res.download).toHaveBeenCalledWith(attachmentsPath + req.query.file, 'common name 2.doc');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('/upload', () => {
    let req;
    let file;

    beforeEach(() => {
      file = {fieldname: 'file',
            originalname: 'new original name.miss',
            encoding: '7bit',
            mimetype: 'application/octet-stream',
            destination: __dirname + '/uploads/',
            filename: 'mockfile.doc',
            path: __dirname + '/uploads/mockfile.doc',
            size: 171411271};
      req = {user: 'admin', headers: {}, body: {entityId: '8abcc463d6158af8065022d9b5014a19'}, files: [file]};
    });

    it('should need authorization', () => {
      expect(routes.post('/api/attachments/upload')).toNeedAuthorization();
    });

    it('should add the uploaded file to attachments', (done) => {
      routes.post('/api/attachments/upload', req)
      .then(addedFile => {
        return Promise.all([addedFile, request.get(`${dbUrl}/${req.body.entityId}`)]);
      })
      .then(([addedFile, dbEntity]) => {
        expect(dbEntity.json.attachments.length).toBe(3);
        expect(dbEntity.json.attachments[2]).toEqual(file);
        expect(addedFile.filename).toBe('mockfile.doc');
        done();
      })
      .catch(done.fail);
    });
  });

  describe('/delete', () => {
    let req;

    beforeEach((done) => {
      req = {user: 'admin', headers: {}, query: {entityId: '8abcc463d6158af8065022d9b5014a18', filename: 'toDelete.txt'}};
      fs.writeFile(paths.attachmentsPath + 'toDelete.txt', 'dummy file', (err) => {
        if (err) {
          done.fail(err);
        }
        done();
      });
    });

    it('should need authorization', () => {
      expect(routes.delete('/api/attachments/delete')).toNeedAuthorization();
    });

    it('should remove the passed file from attachments and delte the local file', (done) => {
      expect(fs.existsSync(paths.attachmentsPath + 'toDelete.txt')).toBe(true);
      routes.delete('/api/attachments/delete', req)
      .then(response => {
        return Promise.all([response, request.get(`${dbUrl}/${req.query.entityId}`)]);
      })
      .then(([response, dbEntity]) => {
        expect(dbEntity.json.attachments.length).toBe(1);
        expect(dbEntity.json.attachments[0].filename).toBe('other.doc');
        expect(response.ok).toBe(true);
        expect(fs.existsSync(paths.attachmentsPath + 'toDelete.txt')).toBe(false);
        done();
      })
      .catch(done.fail);
    });

    it('should not fail if, for some reason, file doesnt exist', (done) => {
      expect(fs.existsSync(paths.attachmentsPath + 'toDelete.txt')).toBe(true);
      fs.unlinkSync(paths.attachmentsPath + 'toDelete.txt');
      routes.delete('/api/attachments/delete', req)
      .then(response => {
        expect(response.error).toBeDefined();
        done();
      })
      .catch(done.fail);
    });
  });
});
