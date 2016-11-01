import database from '../../utils/database.js';
import fixtures from './fixtures.js';
import instrumentRoutes from '../../utils/instrumentRoutes';
import {catchErrors} from 'api/utils/jasmineHelpers';
import {attachmentsPath} from '../../config/paths';

import attachmentsRoutes from '../routes.js';

describe('Attachments Routes', () => {
  let routes;

  beforeEach((done) => {
    database.reset_testing_database()
    .then(() => database.import(fixtures))
    .then(done)
    .catch(done.fail);
    routes = instrumentRoutes(attachmentsRoutes);
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

    beforeEach(() => {
      const file = {fieldname: 'file',
            originalname: 'new original name.miss',
            encoding: '7bit',
            mimetype: 'application/octet-stream',
            destination: __dirname + '/uploads/',
            filename: 'mockfile.doc',
            path: __dirname + '/uploads/mockfile.doc',
            size: 171411271};
      req = {user: 'admin', headers: {}, body: {_id: 'id'}, files: [file]};
    });

    it('should add the uploaded file to the document', (done) => {
      routes.post('/api/upload', req)
      .then(() => {
      });
    });
  });
});
