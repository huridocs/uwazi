import {db_url as dbURL} from 'api/config/database';
import {index as elasticIndex} from 'api/config/elasticIndexes';
import elastic from './elastic';
import queryBuilder from './documentQueryBuilder';
import request from 'shared/JSONRequest';
import {updateMetadataNames, deleteMetadataProperties} from 'api/documents/utils';
import date from 'api/utils/date.js';
import sanitizeResponse from '../utils/sanitizeResponse';
import fs from 'fs';

export default {
  save(doc, user) {
    doc.type = 'document';
    if (!doc._id) {
      doc.user = user;
      doc.creationDate = date.currentUTC();
    }

    let url = dbURL;
    if (doc._id) {
      url = dbURL + '/_design/documents/_update/partialUpdate/' + doc._id;
    }

    return request.post(url, doc)
    .then(response => request.get(`${dbURL}/${response.json.id}`))
    .then(response => response.json);
  },

  search(query) {
    let documentsQuery = queryBuilder()
    .fullTextSearch(query.searchTerm, query.fields)
    .filterMetadata(query.filters)
    .filterByTemplate(query.types);

    if (query.sort) {
      documentsQuery.sort(query.sort, query.order);
    }

    if (query.from) {
      documentsQuery.from(query.from);
    }

    if (query.limit) {
      documentsQuery.limit(query.limit);
    }

    return elastic.search({index: elasticIndex, body: documentsQuery.query()})
    .then((response) => {
      let rows = response.hits.hits.map((hit) => {
        let result = hit._source.doc;
        result._id = hit._id;
        return result;
      });

      return {rows, totalRows: response.hits.total};
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

  matchTitle(searchTerm) {
    let query = queryBuilder().fullTextSearch(searchTerm, ['doc.title']).highlight(['doc.title']).limit(5).query();
    return elastic.search({index: elasticIndex, body: query})
    .then((response) => {
      return response.hits.hits.map((hit) => {
        let result = hit._source.doc;
        result._id = hit._id;
        result.title = hit.highlight['doc.title'][0];
        return result;
      });
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
    return request.get(`${dbURL}/_design/documents/_view/conversions?key="${documentId}"`)
    .then((response) => {
      let conversion = response.json.rows[0].value;
      if (conversion.css) {
        conversion.css = conversion.css.replace(/(\..*?){/g, '._' + conversion.document + ' $1{');
      }
      return conversion;
    });
  },

  saveHTML(conversion) {
    conversion.type = 'conversion';
    return request.post(dbURL, conversion)
    .then((response) => {
      return response.json;
    });
  },

  list(keys) {
    let url = `${dbURL}/_design/documents/_view/list`;
    if (keys) {
      url += `?keys=${JSON.stringify(keys)}`;
    }
    return request.get(url)
    .then((response) => {
      return sanitizeResponse(response.json);
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
      return request.get(`${dbURL}/_design/references/_view/by_source_document?key="${id}"`);
    })
    .then((response) => {
      sanitizeResponse(response.json);
      docsToDelete = docsToDelete.concat(response.json.rows);
      return request.get(`${dbURL}/_design/references/_view/by_target_document?key="${id}"`);
    })
    .then((response) => {
      sanitizeResponse(response.json);
      docsToDelete = docsToDelete.concat(response.json.rows);
    })
    .then(() => {
      docsToDelete.map((doc) => doc._deleted = true);
      return request.post(`${dbURL}/_bulk_docs`, {docs: docsToDelete});
    })
    .then((response) => {
      return response.json;
    });
  }
};
