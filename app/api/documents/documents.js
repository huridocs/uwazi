import {db_url as dbURL} from 'api/config/database';
import {index as elasticIndex} from 'api/config/elasticIndexes';
import elastic from './elastic';
import queryBuilder from './documentQueryBuilder';
import request from 'shared/JSONRequest';
import {updateMetadataNames, deleteMetadataProperties} from 'api/documents/utils';
import date from 'api/utils/date.js';
import sanitizeResponse from '../utils/sanitizeResponse';
import fs from 'fs';
import uniqueID from 'shared/uniqueID';
//import references from '../references/references.js';
import entities from 'api/entities';

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

  get: entities.get,

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

  getHTML(documentId) {
    let path = `${__dirname}/../../../conversions/${documentId}.json`;
    return new Promise((resolve, reject) => {
      fs.readFile(path, (err, conversionJSON) => {
        if (err) {
          reject(err);
        }

        try {
          let conversion = JSON.parse(conversionJSON);
          if (conversion.css) {
            conversion.css = conversion.css.replace(/(\..*?){/g, '._' + documentId + ' $1 {');
          }
          resolve(conversion);
        } catch (e) {
          reject(e);
        }
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

  deleteFile(doc) {
    let filePath = `./uploaded_documents/${doc.file.filename}`;

    if (fs.existsSync(filePath)) {
      fs.unlink(filePath);
    }
  },

  delete(id) {
    let docsToDelete = [];
    return request.get(`${dbURL}/${id}`)
    .then((response) => {
      docsToDelete.push({_id: response.json._id, _rev: response.json._rev});

      this.deleteFile(response.json);
      return request.get(`${dbURL}/_design/references/_view/by_source?key="${id}"`);
    })
    .then((response) => {
      sanitizeResponse(response.json);
      docsToDelete = docsToDelete.concat(response.json.rows);
      return request.get(`${dbURL}/_design/references/_view/by_target?key="${id}"`);
    })
    //.then((response) => {
      //sanitizeResponse(response.json);
      //docsToDelete = docsToDelete.concat(response.json.rows);
      //return request.get(`${dbURL}/_design/documents/_view/conversions_id?key="${id}"`);
    //})
    .then((response) => {
      sanitizeResponse(response.json);
      docsToDelete = docsToDelete.concat(response.json.rows);
      docsToDelete.map((doc) => doc._deleted = true);
      return request.post(`${dbURL}/_bulk_docs`, {docs: docsToDelete});
    })
    .then((response) => {
      return response.json;
    });
  }
};
