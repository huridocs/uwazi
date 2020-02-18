import { files } from 'api/files';
import entities from '../entities';

export default {
  save(doc, params) {
    delete doc.file;
    return entities.save(doc, params);
  },

  //test (this is a temporary fix to be able to save pdfInfo from client without being logged)
  async savePDFInfo(_id, pdfInfo) {
    const [doc] = await files.get({ _id });
    if (doc.pdfInfo) {
      return doc;
    }
    return files.save({ _id, pdfInfo });
  },
  //

  get(query, select) {
    return entities.get(query, select);
  },

  getById(sharedId, language) {
    return entities.getById(sharedId, language);
  },

  countByTemplate(templateId) {
    return entities.countByTemplate(templateId);
  },

  delete(id) {
    return entities.delete(id);
  },
};
