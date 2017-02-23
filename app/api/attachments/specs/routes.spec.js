import fs from 'fs';
import instrumentRoutes from '../../utils/instrumentRoutes';
import {catchErrors} from 'api/utils/jasmineHelpers';
import search from 'api/search/search';
import paths, {attachmentsPath} from '../../config/paths';

import entities from '../../entities';
import attachmentsRoutes from '../routes';
import fixtures, {entityId, toDeleteId} from './fixtures';
import {db} from 'api/utils';

describe('Attachments Routes', () => {
  let routes;
  let originalAttachmentsPath;

  beforeEach((done) => {
    spyOn(search, 'index').and.returnValue(Promise.resolve());
    spyOn(search, 'delete').and.returnValue(Promise.resolve());
    originalAttachmentsPath = paths.attachmentsPath;
    paths.attachmentsPath = __dirname + '/uploads/';

    db.clearAllAndLoad(fixtures, (err) => {
      if (err) {
        done.fail(err);
      }
      done();
    });
    routes = instrumentRoutes(attachmentsRoutes);
  });

  afterEach(() => {
    paths.attachmentsPath = originalAttachmentsPath;
  });

  describe('/download', () => {
    it('should download the document with the titile as file name (replacing extension with file ext)', (done) => {
      let req = {query: {_id: entityId, file: 'match.doc'}};
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
      file = {
        //fieldname: 'file',
        originalname: 'new original name.miss',
        filename: 'mockfile.doc'
        //encoding: '7bit',
        //mimetype: 'application/octet-stream',
        //destination: __dirname + '/uploads/',
        //path: __dirname + '/uploads/mockfile.doc',
        //size: 171411271
      };
      req = {user: 'admin', headers: {}, body: {entityId}, files: [file]};
    });

    it('should need authorization', () => {
      expect(routes.post('/api/attachments/upload', req)).toNeedAuthorization();
    });

    it('should add the uploaded file to attachments', (done) => {
      routes.post('/api/attachments/upload', req)
      .then(addedFile => {
        return Promise.all([addedFile, entities.getById(req.body.entityId)]);
      })
      .then(([addedFile, dbEntity]) => {
        expect(dbEntity.attachments.length).toBe(3);
        expect(dbEntity.attachments[2].filename).toEqual(file.filename);
        expect(dbEntity.attachments[2].originalname).toEqual(file.originalname);
        expect(addedFile.filename).toBe('mockfile.doc');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('/delete', () => {
    let req;

    beforeEach((done) => {
      req = {user: 'admin', headers: {}, query: {entityId: toDeleteId, filename: 'toDelete.txt'}};
      fs.writeFile(paths.attachmentsPath + 'toDelete.txt', 'dummy file', (err) => {
        if (err) {
          done.fail(err);
        }
        done();
      });
    });

    it('should need authorization', () => {
      expect(routes.delete('/api/attachments/delete', {query: {entityId: 'a'}})).toNeedAuthorization();
    });

    it('should remove the passed file from attachments and delte the local file', (done) => {
      expect(fs.existsSync(paths.attachmentsPath + 'toDelete.txt')).toBe(true);
      routes.delete('/api/attachments/delete', req)
      .then(response => {
        return Promise.all([response, entities.getById(req.query.entityId)]);
      })
      .then(([response, dbEntity]) => {
        expect(dbEntity.attachments.length).toBe(1);
        expect(dbEntity.attachments[0].filename).toBe('other.doc');
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
