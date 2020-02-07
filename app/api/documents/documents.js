import fs from 'fs';
import entities from '../entities';
import model from '../entities/entitiesModel';

export default {
  save(doc, params) {
    delete doc.file;
    return entities.save(doc, params);
  },

  //test (this is a temporary fix to be able to save pdfInfo from client without being logged)
  savePDFInfo(doc, params) {
    return this.getById(doc.sharedId, params.language).then(existingDoc => {
      if (existingDoc.pdfInfo) {
        return existingDoc;
      }
      return model.save({ _id: doc._id, sharedId: doc.sharedId, pdfInfo: doc.pdfInfo }, params);
    });
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

  getHTML(id, language) {
    return this.get(id, language).then(docResponse => {
      const doc = docResponse.rows[0];
      const path = `${__dirname}/../../../conversions/${doc._id}.json`;
      return new Promise((resolve, reject) => {
        fs.readFile(path, (err, conversionJSON) => {
          if (err) {
            reject(err);
          }

          try {
            const conversion = JSON.parse(conversionJSON);
            if (conversion.css) {
              conversion.css = conversion.css.replace(/(\..*?){/g, `._${doc._id} $1 {`);
            }
            resolve(conversion);
          } catch (e) {
            reject(e);
          }
        });
      });
    });
  },

  saveHTML(conversion) {
    conversion.type = 'conversion';
    const path = `${__dirname}/../../../conversions/${conversion.document}.json`;
    return new Promise((resolve, reject) => {
      fs.writeFile(path, JSON.stringify(conversion), err => {
        if (err) {
          reject(err);
        }

        resolve(path);
      });
    });
  },

  delete(id) {
    return entities.delete(id);
  },
};
