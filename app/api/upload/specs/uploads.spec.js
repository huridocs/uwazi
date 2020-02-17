/* eslint-disable max-nested-callbacks */
import { catchErrors } from 'api/utils/jasmineHelpers';
import db from 'api/utils/testing_db';
import fs from 'fs';
import path from 'path';

import uploads from '../uploads';
import uploadsModel from '../uploadsModel';
import paths from '../../config/paths';

describe('uploads', () => {
  let file;
  const uploadId = db.id();

  beforeEach(done => {
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

    db.clearAllAndLoad({ uploads: [{ _id: uploadId, filename: 'upload.filename' }] })
      .then(done)
      .catch(catchErrors(done));
  });

  afterAll(done => {
    db.disconnect().then(done);
  });

  describe('save', () => {
    it('should save file passed', async () => {
      let saved = await uploads.save(file);
      saved = await uploadsModel.getById(saved._id);

      expect(saved.creationDate).toBeDefined();

      expect(saved).toMatchObject({
        originalname: 'gadgets-01.pdf',
        mimetype: 'application/octet-stream',
        filename: 'f2082bf51b6ef839690485d7153e847a.pdf',
        size: 171411271,
      });
    });
  });

  describe('delete', () => {
    it('should delete the file', async () => {
      fs.writeFileSync(path.join(paths.customUploads, 'upload.filename'));

      expect(fs.existsSync(path.join(paths.customUploads, 'upload.filename'))).toBe(true);

      await uploads.delete(uploadId);

      expect(fs.existsSync(path.join(paths.customUploads, 'upload.filename'))).toBe(false);
    });
  });
});
