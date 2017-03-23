import multer from 'multer';
import PDF from './PDF';
import ID from 'shared/uniqueID';
import needsAuthorization from '../auth/authMiddleware';
import {uploadDocumentsPath} from '../config/paths';
import entities from 'api/entities';
import references from 'api/references';

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

  let getDocuments = (id, allLanguages) => {
    if (allLanguages) {
      return entities.getAllLanguages(id);
    }

    return entities.getById(id).then((doc) => {
      return [doc];
    });
  };

  let uploadProcess = (req, res, allLanguages = true) => {
    return getDocuments(req.body.document, allLanguages)
    .then((_docs) => {
      const docs = _docs.map((doc) => {
        doc.file = req.files[0];
        doc.uploaded = true;
        doc.processed = false;
        return doc;
      });
      return entities.saveMultiple(docs);
    })
    .then(() => {
      res.json(req.files[0]);

      let file = req.files[0].destination + req.files[0].filename;

      let socket = req.io.getSocket();
      if (socket) {
        socket.emit('conversionStart', req.body.document);
      }
      return Promise.all([
        new PDF(file, req.files[0].originalname).convert(),
        getDocuments(req.body.document, allLanguages)
      ]);
    })
    .then(([conversion, _docs]) => {
      let socket = req.io.getSocket();
      if (socket) {
        socket.emit('documentProcessed', req.body.document);
      }

      const docs = _docs.map((doc) => {
        doc.processed = true;
        doc.fullText = conversion.fullText;
        doc.toc = [];
        return doc;
      });

      return entities.saveMultiple(docs);
    })
    .catch((err) => {
      if (err.error === 'conversion_error') {
        getDocuments(req.body.document, allLanguages)
        .then((_docs) => {
          const docs = _docs.map((doc) => {
            doc.processed = false;
            return doc;
          });
          entities.saveMultiple(docs);
        });
        let socket = req.io.getSocket();
        socket.emit('conversionFailed', req.body.document);
      }
    });
  };

  app.post('/api/upload', needsAuthorization, upload.any(), (req, res) => {
    return uploadProcess(req, res);
  });

  app.post('/api/reupload', needsAuthorization, upload.any(), (req, res) => {
    return entities.getById(req.body.document)
    .then(doc => references.deleteTextReferences(doc.sharedId, doc.language))
    .then(() => uploadProcess(req, res, false));
  });
};
