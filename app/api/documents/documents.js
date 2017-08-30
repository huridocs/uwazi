import {db_url as dbURL} from 'api/config/database';
import request from 'shared/JSONRequest';
import {updateMetadataNames, deleteMetadataProperties} from 'api/documents/utils';
import fs from 'fs';
import entities from '../entities';
import model from '../entities/entitiesModel';

export default {
  save(doc, params) {
    doc.type = 'document';
    delete doc.file;
    return entities.save(doc, params);
  },

  //test (this is a temporary fix to be able to save pdfInfo from client without being logged)
  savePDFInfo(doc, params) {
    return this.get(doc.sharedId, params.language)
    .then((existingDoc) => {
      if (existingDoc.pdfInfo) {
        return existingDoc;
      }
      return model.save({_id: doc._id, sharedId: doc.sharedId, pdfInfo: doc.pdfInfo}, params);
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

  updateMetadataProperties(templateId, nameMatches, deleteProperties) {
    return request.get(`${dbURL}/_design/documents/_view/metadata_by_template?key="${templateId}"`)
    .then((response) => {
      let documents = response.json.rows.map((r) => r.value);
      documents = updateMetadataNames(documents, nameMatches);
      documents = deleteMetadataProperties(documents, deleteProperties);

      let updates = [];
      documents.forEach((document) => {
        let url = `${dbURL}/_design/documents/_update/partialUpdate/${document._id}`;
        updates.push(request.post(url, document));
      });

      return Promise.all(updates);
    });
  },

  getHTML(id, language) {
    return this.get(id, language)
    .then((docResponse) => {
      const doc = docResponse.rows[0];
      let path = `${__dirname}/../../../conversions/${doc._id}.json`;
      return new Promise((resolve, reject) => {
        fs.readFile(path, (err, conversionJSON) => {
          if (err) {
            reject(err);
          }

          try {
            let conversion = JSON.parse(conversionJSON);
            if (conversion.css) {
              conversion.css = conversion.css.replace(/(\..*?){/g, '._' + doc._id + ' $1 {');
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
    let path = `${__dirname}/../../../conversions/${conversion.document}.json`;
    return new Promise((resolve, reject) => {
      fs.writeFile(path, JSON.stringify(conversion), (err) => {
        if (err) {
          reject(err);
        }

        resolve(path);
      });
    });
  },

  delete(id) {
    return entities.delete(id);
  }
};
