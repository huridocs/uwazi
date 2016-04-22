import elastic from './elastic';
import buildQuery from './elasticQuery';
import request from 'shared/JSONRequest';
import {db_url as dbURL} from 'api/config/database';
import {updateMetadataNames} from 'api/documents/utils';

export default {
  search(searchTerm) {
    return elastic.search({index: 'uwazi', body: buildQuery(searchTerm)})
    .then((response) => {
      return response.hits.hits.map((hit) => {
        let result = hit._source.doc;
        result._id = hit._id;
        return result;
      });
    });
  },

  matchTitle(searchTerm) {
    return elastic.search({index: 'uwazi', body: buildQuery(searchTerm, ['doc.title'], ['doc.title'], 5)})
    .then((response) => {
      return response.hits.hits.map((hit) => {
        let result = hit._source.doc;
        result._id = hit._id;
        result.title = hit.highlight['doc.title'][0];
        return result;
      });
    });
  },

  updateMetadataNames(templateId, nameMatches) {
    return request.get(`${dbURL}/_design/documents/_view/metadata_by_template?key="${templateId}"`)
    .then((response) => {
      let documents = response.json.rows.map((r) => r.value);
      documents = updateMetadataNames(documents, nameMatches);

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
