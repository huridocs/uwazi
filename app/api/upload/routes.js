import multer from 'multer';
import ID from 'shared/uniqueID';
import languages from 'shared/languages';
import entities from 'api/entities';
import relationships from 'api/relationships';
import PDF from './PDF';
import needsAuthorization from '../auth/authMiddleware';
import { uploadDocumentsPath } from '../config/paths';
import fs from 'fs';

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDocumentsPath);
  },
  filename(req, file, cb) {
    cb(null, `${Date.now() + ID()}.pdf`);
  }
});

export default (app) => {
  const upload = multer({ storage });

  const getDocuments = (id, allLanguages) => {
    if (allLanguages) {
      return entities.getAllLanguages(id);
    }

    return entities.getById(id).then(doc => [doc]);
  };

  const uploadProcess = (req, res, allLanguages = true) => getDocuments(req.body.document, allLanguages)
  .then((_docs) => {
    console.log('Upload Process for', _docs.map(d => d._id).toString());
    console.log('Original name', fs.existsSync(req.files[0].originalname));
    console.log('File exists', fs.existsSync(req.files[0].path));
    const docs = _docs.map((doc) => {
      doc.file = req.files[0];
      doc.uploaded = true;
      return doc;
    });
    return entities.saveMultiple(docs);
  })
  .then(() => {
    console.log('Documents saved as uploaded for:', req.files[0].originalname);
    res.json(req.files[0]);

    const file = req.files[0].destination + req.files[0].filename;

    const sessionSockets = req.io.getCurrentSessionSockets();
    sessionSockets.emit('conversionStart', req.body.document);
    console.log('Starting conversion of:', req.files[0].originalname);
    return Promise.all([
        new PDF(file, req.files[0].originalname).convert(),
        getDocuments(req.body.document, allLanguages)
    ]);
  })
  .then(([conversion, _docs]) => {
    console.log('Conversion succeeed for:', req.files[0].originalname);
    const docs = _docs.map((doc) => {
      doc.processed = true;
      doc.fullText = conversion.fullText;
      doc.file.language = languages.detect(conversion.fullText, 'franc');
      doc.toc = [];
      return doc;
    });
    console.console.log('Saving documents');
    return entities.saveMultiple(docs).then(() => {
      const sessionSockets = req.io.getCurrentSessionSockets();
      sessionSockets.emit('documentProcessed', req.body.document);
    });
  })
  .catch((err) => {
    getDocuments(req.body.document, allLanguages)
    .then((_docs) => {
      const docs = _docs.map((doc) => {
        doc.processed = false;
        return doc;
      });
      entities.saveMultiple(docs);
    });

    const sessionSockets = req.io.getCurrentSessionSockets();
    sessionSockets.emit('conversionFailed', req.body.document);
    console.error(err);
  });

  app.post('/api/upload', needsAuthorization(['admin', 'editor']), upload.any(), (req, res) => uploadProcess(req, res));

  app.post('/api/reupload', needsAuthorization(['admin', 'editor']), upload.any(), (req, res) => entities.getById(req.body.document)
  .then(doc => Promise.all([doc, relationships.deleteTextReferences(doc.sharedId, doc.language)]))
  .then(([doc]) => entities.saveMultiple([{ _id: doc._id, toc: [] }]))
  .then(() => uploadProcess(req, res, false)));
};
