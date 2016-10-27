import {db_url as dbURL} from 'api/config/database';
import request from 'shared/JSONRequest';
import {updateMetadataNames, deleteMetadataProperties} from 'api/documents/utils';
import fs from 'fs';
import uniqueID from 'shared/uniqueID';
import {deleteFiles} from '../utils/files.js';
import entities from '../entities';

export default {
  save(doc, params) {
    doc.type = 'document';
    if (doc.toc) {
      doc.toc = doc.toc.map((tocEntry) => {
        if (!tocEntry._id) {
          tocEntry._id = uniqueID();
        }

        return tocEntry;
      });
    }

    return entities.save(doc, params);
  },

  get: (id, language) => {
    return entities.get(id, language)
    .then((doc) => {
      delete doc.rows[0].fullText;
      return doc;
    });
  },

  getUploadsByUser(user) {
    let url = `${dbURL}/_design/documents/_view/uploads?key="${user._id}"&descending=true`;

    return request.get(url)
    .then(response => {
      response.json.rows = response.json.rows.map(row => row.value).sort((a, b) => b.creationDate - a.creationDate);
      return response.json;
    });
  },

  countByTemplate(templateId) {
    return request.get(`${dbURL}/_design/documents/_view/count_by_template?group_level=1&key="${templateId}"`)
    .then((response) => {
      if (!response.json.rows.length) {
        return 0;
      }
      return response.json.rows[0].value;
    });
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

  deleteFiles(deletedDocs) {
    let filesToDelete = deletedDocs.map((doc) => {
      return `./uploaded_documents/${doc.file.filename}`;
    });
    deletedDocs.forEach((doc) => filesToDelete.push(`./conversions/${doc._id}.json`));
    filesToDelete = filesToDelete.filter((doc, index) => filesToDelete.indexOf(doc) === index);

    return deleteFiles(filesToDelete);
  },

  delete(id) {
    return entities.delete(id)
    .then((deletedDocuments) => {
      return this.deleteFiles(deletedDocuments);
    });
  }
};
