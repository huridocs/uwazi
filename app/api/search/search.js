import {db_url as dbURL} from 'api/config/database';
import {index as elasticIndex} from 'api/config/elasticIndexes';
import elastic from './elastic';
import queryBuilder from './documentQueryBuilder';
import request from 'shared/JSONRequest';

export default {
  search(query, language) {
    let documentsQuery = queryBuilder()
    .fullTextSearch(query.searchTerm, query.fields)
    .filterMetadata(query.filters)
    .filterByTemplate(query.types)
    .language(language);

    if (query.sort) {
      documentsQuery.sort(query.sort, query.order);
    }

    if (query.from) {
      documentsQuery.from(query.from);
    }

    if (query.limit) {
      documentsQuery.limit(query.limit);
    }

    if (query.aggregations) {
      documentsQuery.aggregations(query.aggregations);
    }

    return elastic.search({index: elasticIndex, body: documentsQuery.query()})
    .then((response) => {
      let rows = response.hits.hits.map((hit) => {
        let result = hit._source.doc;
        result._id = hit._id;
        return result;
      });

      return {rows, totalRows: response.hits.total, aggregations: response.aggregations};
    })
    .catch(console.log);
  },

  getUploadsByUser(user, language) {
    let url = `${dbURL}/_design/search/_view/uploads`;

    return request.get(url, {key: [user._id, language]})
    .then(response => {
      response.json.rows = response.json.rows.map(row => row.value).sort((a, b) => b.creationDate - a.creationDate);
      return response.json;
    });
  },

  matchTitle(searchTerm, language) {
    let query = queryBuilder()
    .fullTextSearch(searchTerm, ['doc.title'])
    .highlight(['doc.title'])
    .language(language)
    .limit(5)
    .query();

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
    return request.get(`${dbURL}/_design/search/_view/count_by_template?group_level=1&key="${templateId}"`)
    .then((response) => {
      if (!response.json.rows.length) {
        return 0;
      }
      return response.json.rows[0].value;
    });
  }
};
