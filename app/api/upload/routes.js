import request from '../../shared/JSONRequest.js';
import {db_url as dbURL} from '../config/database.js';
import multer from 'multer';
import PDF from './PDF';
import ID from 'shared/uniqueID';
import needsAuthorization from '../auth/authMiddleware';
import {uploadDocumentsPath} from '../config/paths';
import documents from 'api/documents';
import entities from 'api/entities';

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
    //request.get(dbURL + '/' + req.body.document)
    entities.getAllLanguages(req.body.document)
    .then((response) => {
      const docs = response.rows.map((doc) => {
        doc.file = req.files[0];
        doc.uploaded = true;
        return doc;
      });

      return entities.saveMultiple(docs);
    })
    .then(() => {
      res.json(req.files[0]);

      let file = req.files[0].destination + req.files[0].filename;

      return Promise.all([
        new PDF(file, req.files[0].originalname).convert(),
        //request.get(dbURL + '/' + req.body.document)
        entities.getAllLanguages(req.body.document)
      ]);
    })
    .then(([conversion, docsResponse]) => {
      let socket = req.io.getSocket();
      if (socket) {
        socket.emit('documentProcessed', req.body.document);
      }

      const docs = docsResponse.rows.map((doc) => {
        doc.processed = true;
        doc.fullText = conversion.fullText;
        return doc;
      });

      delete conversion.fullText;
      let saves = docs.map((doc) => {
        const conv = Object.assign({}, conversion, {document: doc._id});
        return documents.saveHTML(conv);
      });

      saves.push(entities.saveMultiple(docs));

      return Promise.all(saves);
    })
    .catch((err) => {
      if (err.error === 'conversion_error') {
        entities.getAllLanguages(req.body.document)
        .then((response) => {
          const docs = response.rows.map((doc) => {
            doc.processed = false;
            return doc;
          });
          entities.saveMultiple(docs);
        });
        let socket = req.io.getSocket();
        socket.emit('conversionFailed', req.body.document);
      }
    });
  });
};
