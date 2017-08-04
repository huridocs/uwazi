import fs from 'fs';
import instrumentRoutes from '../../utils/instrumentRoutes';
import {catchErrors} from 'api/utils/jasmineHelpers';
import search from 'api/search/search';
import paths, {attachmentsPath} from '../../config/paths';

import entities from '../../entities';
import attachmentsRoutes from '../routes';
import fixtures, {entityId, entityIdEn, entityIdPt, toDeleteId, attachmentToEdit} from './fixtures';
import db from 'api/utils/testing_db';

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
        originalname: 'new original name.miss',
        filename: 'mockfile.doc'
      };
      req = {user: 'admin', headers: {}, body: {entityId}, files: [file]};
    });

    it('should need authorization', () => {
      expect(routes.post('/api/attachments/upload', req)).toNeedAuthorization();
    });

    it('should add the uploaded file to attachments and return it, incluiding its new ID', (done) => {
      routes.post('/api/attachments/upload', req)
      .then(addedFile => {
        return Promise.all([addedFile, entities.getById(req.body.entityId)]);
      })
      .then(([addedFile, dbEntity]) => {
        expect(dbEntity.attachments.length).toBe(3);
        expect(dbEntity.attachments[2].filename).toEqual(file.filename);
        expect(dbEntity.attachments[2].originalname).toEqual(file.originalname);
        expect(addedFile.filename).toBe('mockfile.doc');
        expect(addedFile._id).toBeDefined();
        expect(addedFile._id.toString()).toBe(dbEntity.attachments[2]._id.toString());
        done();
      })
      .catch(catchErrors(done));
    });

    it('should add the uploaded file to all shared entities and return the file, incluiding its new ID', (done) => {
      req.body.allLanguages = 'true';

      routes.post('/api/attachments/upload', req)
      .then(addedFile => {
        return Promise.all([addedFile, entities.get({sharedId: 'sharedId'})]);
      })
      .then(([addedFile, dbEntities]) => {
        const dbEntity = dbEntities.find(e => e._id.toString() === entityId.toString());
        const dbEntityEn = dbEntities.find(e => e._id.toString() === entityIdEn.toString());
        const dbEntityPt = dbEntities.find(e => e._id.toString() === entityIdPt.toString());

        expect(dbEntity.attachments.length).toBe(3);
        expect(dbEntity.attachments[2].filename).toBe(file.filename);
        expect(dbEntity.attachments[2].originalname).toBe(file.originalname);
        expect(addedFile.filename).toBe('mockfile.doc');
        expect(addedFile._id.toString()).toBe(dbEntity.attachments[2]._id.toString());

        expect(dbEntityEn.attachments.length).toBe(2);
        expect(dbEntityEn.attachments[0].filename).toBe('otherEn.doc');
        expect(dbEntityEn.file.filename).toBe('filenameEn');
        expect(dbEntityEn.attachments[1].filename).toBe(file.filename);
        expect(dbEntityEn.attachments[1].originalname).toBe(file.originalname);

        expect(dbEntityPt.attachments.length).toBe(1);
        expect(dbEntityPt.file.filename).toBe('filenamePt');
        expect(dbEntityPt.attachments[0].filename).toBe(file.filename);
        expect(dbEntityPt.attachments[0].originalname).toBe(file.originalname);

        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('/rename', () => {
    let req;

    beforeEach(() => {
      req = {user: 'admin', body: {entityId, _id: attachmentToEdit.toString(), originalname: 'edited name'}};
    });

    it('should need authorization', () => {
      expect(routes.post('/api/attachments/rename', {body: {entityId: 'a'}})).toNeedAuthorization();
    });

    it('should rename a specific attachment', (done) => {
      routes.post('/api/attachments/rename', req)
      .then(response => {
        expect(response._id.toString()).toBe(attachmentToEdit.toString());
        expect(response.filename).toBe('match.doc');
        expect(response.originalname).toBe('edited name');

        return entities.getById(req.body.entityId);
      })
      .then(entity => {
        expect(entity.file.originalname).toBe('source doc');
        expect(entity.attachments[0].originalname).toBe('o1');
        expect(entity.attachments[1].originalname).toBe('edited name');
        done();
      });
    });

    it('should rename the base file if id matches entity', (done) => {
      req.body._id = entityId.toString();
      req.body.originalname = 'edited source name';

      routes.post('/api/attachments/rename', req)
      .then(response => {
        expect(response._id.toString()).toBe(entityId.toString());
        expect(response.filename).toBe('filename');
        expect(response.originalname).toBe('edited source name');

        return entities.getById(req.body.entityId);
      })
      .then(entity => {
        expect(entity.file.originalname).toBe('edited source name');
        expect(entity.attachments[0].originalname).toBe('o1');
        expect(entity.attachments[1].originalname).toBe('common name 2.not');
        done();
      });
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
