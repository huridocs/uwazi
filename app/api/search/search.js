import {db_url as dbURL} from 'api/config/database';
import {index as elasticIndex} from 'api/config/elasticIndexes';
import elastic from './elastic';
import queryBuilder from './documentQueryBuilder';
import entities from '../entities';
import model from '../entities/entitiesModel';

export default {
  search(query, language) {
    let documentsQuery = queryBuilder()
    .fullTextSearch(query.searchTerm, query.fields)
    .filterMetadata(query.filters)
    .filterByTemplate(query.types)
    .filterById(query.ids)
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

    if (query.includeUnpublished) {
      documentsQuery.includeUnpublished();
    }

    return elastic.search({index: elasticIndex, body: documentsQuery.query()})
    .then((response) => {
      let rows = response.hits.hits.map((hit) => {
        let result = hit._source;
        result._id = hit._id;
        return result;
      });

      return {rows, totalRows: response.hits.total, aggregations: response.aggregations};
    });
  },

  getUploadsByUser(user, language) {
    return model.get({user: user._id, language, published: false});
  },

  matchTitle(searchTerm, language) {
    let query = queryBuilder()
    .fullTextSearch(searchTerm, ['title'])
    .highlight(['title'])
    .language(language)
    .limit(5)
    .query();

    return elastic.search({index: elasticIndex, body: query})
    .then((response) => {
      return response.hits.hits.map((hit) => {
        let result = hit._source;
        result._id = hit._id;
        result.title = hit.highlight.title[0];
        return result;
      });
    });
  },

  countByTemplate(templateId) {
    return entities.countByTemplate(templateId);
  },

  index(entity) {
    const id = entity._id.toString();
    delete entity._id;
    delete entity._rev;
    const body = entity;
    return elastic.index({index: elasticIndex, type: 'entity', id, body})
    .catch(console.log);
  },

  delete(entity) {
    const id = entity._id.toString();
    return elastic.delete({index: elasticIndex, type: 'entity', id});
  }
};
