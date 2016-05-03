import request from '../../shared/JSONRequest.js';
import {db_url} from '../config/database.js';
import multer from 'multer';
import PDF from './PDF';
import documents from 'api/documents/documents';

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname + '/../../../uploaded_documents/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '.pdf');
  }
});

export default (app, io) => {
  let upload = multer({storage: storage});

  app.post('/api/upload', upload.any(), (req, res) => {
    request.get(db_url + '/' + req.body.document)
    .then((response) => {
      let doc = response.json;
      doc.file = req.files[0];
      doc.uploaded = true;

      return request.post(db_url, doc);
    })
    .then(() => {
      res.json(req.files[0]);

      let file = req.files[0].destination + req.files[0].filename;

      return Promise.all([
        new PDF(file).convert(),
        request.get(db_url + '/' + req.body.document)
      ]);
    })
    .then((response) => {

      let document = response[1].json;
      let conversion = response[0];
      conversion.document = document._id;
      req.iosocket.emit('documentProcessed', document._id);
      document.processed = true;
      document.fullText = conversion.fullText;
      delete conversion.fullText;
      return Promise.all([
        request.post(db_url, document),
        documents.saveHTML(conversion)
      ]);
    })
    .catch((err) => {
      console.log(err);
    });
  });
};
