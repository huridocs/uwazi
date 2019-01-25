import { catchErrors } from 'api/utils/jasmineHelpers';
import db from 'api/utils/testing_db';
import fs from 'fs';

import attachmentsRoutes from '../routes';
import entities from '../../entities';
import fixtures, { entityId, entityIdEn, entityIdPt, toDeleteId, attachmentToEdit } from './fixtures';
import instrumentRoutes from '../../utils/instrumentRoutes';
import paths from '../../config/paths';

describe('Attachments Routes', () => {
  let routes;
  let originalAttachmentsPath;

  function testRouteResponse(URL, req, expected, done) {
    routes.get(URL, req)
    .then((response) => {
      expect(response).toBe(expected);
      done();
    })
    .catch(catchErrors(done));
  }

  beforeEach((done) => {
    spyOn(entities, 'indexEntities').and.returnValue(Promise.resolve());
    originalAttachmentsPath = paths.attachmentsPath;
    routes = instrumentRoutes(attachmentsRoutes);

    db.clearAllAndLoad(fixtures).then(done).catch(catchErrors(done));
  });

  afterEach(() => {
    paths.attachmentsPath = originalAttachmentsPath;
  });

  afterAll((done) => {
    db.disconnect().then(done);
  });

  describe('/attachment/file', () => {
    it('should send the requested existing file', (done) => {
      paths.attachmentsPath = `${__dirname}/uploads/`;
      const expected = `sendFile:${paths.attachmentsPath}mockfile.doc`;
      testRouteResponse('/api/attachment/:file', { params: { file: 'mockfile.doc' } }, expected, done);
    });

    it('should redirect to no_preview if file doesnt exist', (done) => {
      testRouteResponse('/api/attachment/:file', { params: { file: 'missing.jpg' } }, 'redirect:/public/no-preview.png', done);
    });
  });

  describe('/download', () => {
    function expect404Error(req, res, done) {
      routes.get('/api/attachments/download', req, res)
      .then(() => {
        done.fail('should fail');
      })
      .catch((error) => {
        expect(error.code).toBe(404);
        done();
      });
    }
    it('should download the document with the title as file name (replacing extension with file ext)', (done) => {
      const req = { query: { _id: entityId, file: 'match.doc' } };
      const res = {};
      paths.attachmentsPath = `${__dirname}/uploads`;

      routes.get('/api/attachments/download', req, res)
      .then(() => {
        expect(res.download).toHaveBeenCalledWith(`${__dirname}/uploads/${req.query.file}`, 'common name 2.doc');
        paths.attachmentsPath = `${__dirname}/uploads/`;
        return routes.get('/api/attachments/download', req, res);
      })
      .then(() => {
        expect(res.download).toHaveBeenCalledWith(`${__dirname}/uploads/${req.query.file}`, 'common name 2.doc');
        done();
      })
      .catch(catchErrors(done));
    });

    it('should fail when entity does not exists', (done) => {
      const nonExistentId = db.id();
      const req = { query: { _id: nonExistentId, file: 'match.doc' } };
      const res = {};
      paths.attachmentsPath = `${__dirname}/uploads`;

      expect404Error(req, res, done);
    });

    it('should fail when attachment does not exist', (done) => {
      const req = { query: { _id: entityId, file: 'nonExisting.doc' } };
      const res = {};
      paths.attachmentsPath = `${__dirname}/uploads`;

      expect404Error(req, res, done);
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
      req = { user: 'admin', headers: {}, body: { entityId }, files: [file] };
    });

    it('should need authorization', () => {
      expect(routes._post('/api/attachments/upload', req)).toNeedAuthorization();
    });

    it('should add the uploaded file to attachments, add current timestamp and return the attachment, including its new ID', (done) => {
      spyOn(Date, 'now').and.returnValue(1000);
      routes.post('/api/attachments/upload', req)
      .then(addedFile => Promise.all([addedFile, entities.getById(req.body.entityId)]))
      .then(([addedFile, dbEntity]) => {
        expect(dbEntity.attachments[2].filename).toEqual(file.filename);
        expect(dbEntity.attachments[2].originalname).toEqual(file.originalname);
        expect(dbEntity.attachments[2].timestamp).toBe(1000);
        expect(addedFile.filename).toBe('mockfile.doc');
        expect(addedFile._id).toBeDefined();
        expect(addedFile._id.toString()).toBe(dbEntity.attachments[2]._id.toString());
        done();
      })
      .catch(catchErrors(done));
    });

    it('should add the uploaded file to all shared entities and return the file, including its new ID', (done) => {
      req.body.allLanguages = 'true';
      spyOn(Date, 'now').and.returnValue(1000);

      routes.post('/api/attachments/upload', req)
      .then(addedFile => Promise.all([addedFile, entities.get({ sharedId: 'sharedId' })]))
      .then(([addedFile, dbEntities]) => {
        const dbEntity = dbEntities.find(e => e._id.toString() === entityId.toString());
        const dbEntityEn = dbEntities.find(e => e._id.toString() === entityIdEn.toString());
        const dbEntityPt = dbEntities.find(e => e._id.toString() === entityIdPt.toString());

        expect(dbEntity.attachments.length).toBe(3);
        expect(dbEntity.attachments[2].filename).toBe(file.filename);
        expect(dbEntity.attachments[2].originalname).toBe(file.originalname);
        expect(dbEntity.attachments[2]._id.toString()).toBe(addedFile._id.toString());
        expect(dbEntity.attachments[2].timestamp).toBe(1000);
        expect(addedFile.filename).toBe('mockfile.doc');

        expect(dbEntityEn.attachments.length).toBe(2);
        expect(dbEntityEn.attachments[0].filename).toBe('otherEn.doc');
        expect(dbEntityEn.file.filename).toBe('filenameEn');
        expect(dbEntityEn.attachments[1].filename).toBe(file.filename);
        expect(dbEntityEn.attachments[1].originalname).toBe(file.originalname);
        expect(dbEntityEn.attachments[1]._id.toString()).not.toBe(addedFile._id.toString());
        expect(dbEntityEn.attachments[1].timestamp).toBe(1000);

        expect(dbEntityPt.attachments.length).toBe(1);
        expect(dbEntityPt.file.filename).toBe('filenamePt');
        expect(dbEntityPt.attachments[0].filename).toBe(file.filename);
        expect(dbEntityPt.attachments[0].originalname).toBe(file.originalname);
        expect(dbEntityPt.attachments[0]._id.toString()).not.toBe(addedFile._id.toString());
        expect(dbEntityPt.attachments[0].timestamp).toBe(1000);

        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('/rename', () => {
    let req;

    beforeEach(() => {
      req = { user: 'admin', body: { entityId, _id: attachmentToEdit.toString(), originalname: 'edited name' } };
    });

    it('should need authorization', () => {
      expect(routes._post('/api/attachments/rename', { body: { entityId: 'a' } })).toNeedAuthorization();
    });

    it('should have a validation schema', () => {
      expect(routes.post.validation('/api/attachments/rename')).toMatchSnapshot();
    });

    it('should rename a specific attachment', (done) => {
      routes.post('/api/attachments/rename', req)
      .then((response) => {
        expect(response._id.toString()).toBe(attachmentToEdit.toString());
        expect(response.filename).toBe('match.doc');
        expect(response.originalname).toBe('edited name');

        return entities.getById(req.body.entityId);
      })
      .then((entity) => {
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
      .then((response) => {
        expect(response._id.toString()).toBe(entityId.toString());
        expect(response.filename).toBe('filename');
        expect(response.originalname).toBe('edited source name');

        return entities.getById(req.body.entityId);
      })
      .then((entity) => {
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
      req = { user: 'admin', headers: {}, query: { entityId: toDeleteId, filename: 'toDelete.txt' } };
      fs.writeFile(`${paths.attachmentsPath}toDelete.txt`, 'dummy file', (err) => {
        if (err) {
          done.fail(err);
        }
        done();
      });
    });

    it('should have a validation schema', () => {
      expect(routes.delete.validation('/api/attachments/delete')).toMatchSnapshot();
    });

    it('should need authorization', () => {
      expect(routes.delete('/api/attachments/delete', { query: { entityId: 'a' } })).toNeedAuthorization();
    });

    it('should remove the passed file from attachments and delte the local file', (done) => {
      expect(fs.existsSync(`${paths.attachmentsPath}toDelete.txt`)).toBe(true);
      routes.delete('/api/attachments/delete', req)
      .then(response => Promise.all([response, entities.getById(req.query.entityId)]))
      .then(([response, dbEntity]) => {
        expect(response._id.toString()).toBe(toDeleteId.toString());
        expect(response.attachments.length).toBe(1);
        expect(dbEntity.attachments.length).toBe(1);
        expect(dbEntity.attachments[0].filename).toBe('other.doc');
        expect(fs.existsSync(`${paths.attachmentsPath}toDelete.txt`)).toBe(false);
        done();
      })
      .catch(done.fail);
    });

    it('should not delte the local file if other siblings are using it', (done) => {
      expect(fs.existsSync(`${paths.attachmentsPath}toDelete.txt`)).toBe(true);
      const sibling = { sharedId: toDeleteId.toString(), attachments: [{ filename: 'toDelete.txt', originalname: 'common name 1.not' }] };
      entities.saveMultiple([sibling])
      .then(() => routes.delete('/api/attachments/delete', req))
      .then(response => Promise.all([response, entities.getById(req.query.entityId)]))
      .then(([response, dbEntity]) => {
        expect(response._id.toString()).toBe(toDeleteId.toString());
        expect(dbEntity.attachments.length).toBe(1);
        expect(fs.existsSync(`${paths.attachmentsPath}toDelete.txt`)).toBe(true);
        done();
      })
      .catch(done.fail);
    });

    it('should not fail if, for some reason, file doesnt exist', (done) => {
      expect(fs.existsSync(`${paths.attachmentsPath}toDelete.txt`)).toBe(true);
      fs.unlinkSync(`${paths.attachmentsPath}toDelete.txt`);
      routes.delete('/api/attachments/delete', req)
      .then((response) => {
        expect(response.error).toBeDefined();
        done();
      })
      .catch(done.fail);
    });
  });
});
