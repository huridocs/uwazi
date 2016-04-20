import request from '../../shared/JSONRequest.js';
import {db_url} from '../config/database.js'
import multer from 'multer'
import PDF from './PDF';

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname+'/../../../uploaded_documents/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now()+'.pdf');
  }
});

export default app => {
  var upload = multer({ storage: storage});

  app.post('/api/upload', upload.any(), (req, res) => {
    request.get(db_url + '/' + req.body.document)
    .then((response) => {
      let doc = response.json;
      doc.file = req.files[0];

      return request.post(db_url, doc);
    })
    .then((response) => {
      res.json(req.files[0]);

      let file = req.files[0].destination+req.files[0].filename;

      return Promise.all([
        new PDF(file).convert(),
        request.get(db_url + '/' + req.body.document)
      ]);
    })
    .then((response) => {
      let document = Object.assign({}, response[1].json, response[0]);
      document.processed = true;
      return request.post(db_url, document);
    })
    .catch((err) => {
      console.log(err);
    })
  });
}
