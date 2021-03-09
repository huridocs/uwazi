import 'api/utils/jasmineHelpers';
import db from 'api/utils/testing_db';
import { search } from 'api/search';
import { attachmentsPath } from 'api/files/filesystem';

import attachmentsRoutes from '../routes';
import fixtures, { entityId } from './fixtures';
import instrumentRoutes from '../../utils/instrumentRoutes';

describe('Attachments Routes', () => {
  let routes;

  beforeEach(async () => {
    spyOn(search, 'indexEntities').and.returnValue(Promise.resolve());
    routes = instrumentRoutes(attachmentsRoutes);

    await db.clearAllAndLoad(fixtures);
  });

  afterAll(async () => db.disconnect());

  describe('/download', () => {
    const expect404Error = async (req, res) => {
      let error;
      try {
        await routes.get('/api/attachments/download', req, res);
      } catch (e) {
        error = e;
      }
      expect(error.code).toBe(404);
    };

    it('should have a validation schema', () => {
      expect(routes.get.validation('/api/attachments/download')).toMatchSnapshot();
    });

    it('should download the document with the title as file name (replacing extension with file ext)', async () => {
      const req = { query: { _id: entityId, file: 'match.doc' } };
      const res = {};

      await routes.get('/api/attachments/download', req, res);
      expect(res.download).toHaveBeenCalledWith(
        attachmentsPath(req.query.file),
        'common name 2.doc'
      );

      await routes.get('/api/attachments/download', req, res);
      expect(res.download).toHaveBeenCalledWith(
        attachmentsPath(req.query.file),
        'common name 2.doc'
      );
    });

    it('should fail when entity does not exists', async () => {
      const nonExistentId = db.id();
      const req = { query: { _id: nonExistentId, file: 'match.doc' } };
      const res = {};

      await expect404Error(req, res);
    });

    it('should fail when attachment does not exist', async () => {
      const req = { query: { _id: entityId, file: 'nonExisting.doc' } };
      const res = {};

      await expect404Error(req, res);
    });
  });
});
