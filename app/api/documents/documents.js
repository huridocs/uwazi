import {db_url as dbURL} from 'api/config/database';
import elastic from './elastic';
import queryBuilder from './documentQueryBuilder';
import request from 'shared/JSONRequest';
import {updateMetadataNames, deleteMetadataProperties} from 'api/documents/utils';

export default {
  search(query) {
    let searchTerm = query.searchTerm;
    delete query.searchTerm;
    let documentsQuery = queryBuilder().fullTextSearch(searchTerm).filterMetadata(query).query();
    return elastic.search({index: 'uwazi', body: documentsQuery})
    .then((response) => {
      return response.hits.hits.map((hit) => {
        let result = hit._source.doc;
        result._id = hit._id;
        return result;
      });
    });
  },

  matchTitle(searchTerm) {
    let query = queryBuilder().fullTextSearch(searchTerm, ['doc.title']).highlight(['doc.title']).limit(5).query();
    return elastic.search({index: 'uwazi', body: query})
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
  }
};
