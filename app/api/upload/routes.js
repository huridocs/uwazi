import request from '../../shared/JSONRequest.js';
import {db_url as dbURL} from '../config/database.js';
import multer from 'multer';
import PDF from './PDF';
import documents from 'api/documents/documents';
import ID from 'shared/uniqueID';
import needsAuthorization from '../auth/authMiddleware';
import {uploadDocumentsPath} from '../config/paths';

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDocumentsPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + ID() + '.pdf');
  }
});

export default (app) => {
  let upload = multer({storage: storage});

  app.post('/api/upload', needsAuthorization, upload.any(), (req, res) => {
    request.get(dbURL + '/' + req.body.document)
    .then((response) => {
      let doc = response.json;
      doc.file = req.files[0];
      doc.uploaded = true;

      return request.post(dbURL, doc);
    })
    .then(() => {
      res.json(req.files[0]);

      let file = req.files[0].destination + req.files[0].filename;

      return Promise.all([
        new PDF(file).convert(),
        request.get(dbURL + '/' + req.body.document)
      ]);
    })
    .then((response) => {
      let document = response[1].json;
      let conversion = response[0];
      conversion.document = document._id;

      let socket = req.io.getSocket();
      if (socket) {
        socket.emit('documentProcessed', document._id);
      }

      document.processed = true;
      document.fullText = conversion.fullText;
      delete conversion.fullText;
      return Promise.all([
        request.post(dbURL, document),
        documents.saveHTML(conversion)
      ]);
    })
    .catch((err) => {
      if (err.error === 'conversion_error') {
        documents.save({_id: req.body.document, processed: false});
        let socket = req.io.getSocket();
        socket.emit('conversionFailed', req.body.document);
      }
    });
  });
};
